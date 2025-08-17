import { ref, type Ref } from 'vue'
import { debugLog } from '../utils/debug'

export type SaveResult = {
  success: boolean
  serverData?: unknown
  updatedAt?: string | number | Date
  error?: string
  conflict?: boolean
}

export type RetryPolicy = {
  attempts: number
  baseDelayMs: number
  factor: number
  jitter: boolean
}

export type NormalizeFn = (key: string, value: unknown) => unknown
export type IsEqualFn = (a: unknown, b: unknown, key: string) => boolean
export type CanSaveFn = (snapshot: Record<string, unknown>) => boolean

export type JobAutosaveOptions = {
  jobId: string
  getSnapshot: () => Record<string, unknown>
  applyOptimistic: (patch: Record<string, unknown>) => void
  rollbackOptimistic: (previousValues: Record<string, unknown>) => void
  saveAdapter: (patch: Record<string, unknown>) => Promise<SaveResult>

  normalize?: NormalizeFn
  isEqual?: IsEqualFn

  debounceMs?: number
  retryPolicy?: RetryPolicy
  devLogging?: boolean
}

export type JobAutosaveApi = {
  queueChange: (key: string, nextValue: unknown) => void
  queueChanges: (patch: Record<string, unknown>) => void
  flush: (reason?: string) => Promise<void>
  cancel: () => void

  isSaving: Ref<boolean>
  lastSavedAt: Ref<Date | null>
  error: Ref<string | null>
  pendingKeys: Ref<Set<string>>
  inFlightToken: Ref<number>

  onBeforeUnloadBind: () => void
  onBeforeUnloadUnbind: () => void
  onVisibilityBind: () => void
  onVisibilityUnbind: () => void
  onRouteLeaveBind: (router: {
    beforeEach: (
      guard: (to: unknown, from: unknown, next: (value?: unknown) => void) => unknown,
    ) => unknown
  }) => () => void
}

/**
 * createJobAutosave - Autosave orquestrador por entidade Job
 *
 * Recursos:
 * - Debounce único por Job (default 500ms)
 * - Buffer por campo e coalescência de mudanças rápidas
 * - Single-flight com marcação de pending para rodar novamente
 * - Retry in-memory com backoff exponencial e jitter
 * - Flush em blur/visibility hidden/route leave/beforeunload
 * - No-op guard com comparação normalizada
 * - Atualização otimista com rollback em falha
 * - Correlação de respostas via token do voo em andamento
 */
export function createJobAutosave(opts: JobAutosaveOptions): JobAutosaveApi {
  // Defaults
  const debounceMs = Number.isFinite(opts.debounceMs) ? Number(opts.debounceMs) : 500
  const retry: RetryPolicy = opts.retryPolicy ?? {
    attempts: 3,
    baseDelayMs: 500,
    factor: 2,
    jitter: true,
  }
  const dev = !!opts.devLogging

  const normalize: NormalizeFn =
    opts.normalize ??
    ((key: string, value: unknown) => {
      if (value == null) return value
      if (typeof value === 'string') {
        // trim + collapse internal whitespace
        const collapsed = value.trim().replace(/\s+/g, ' ')
        // enums usuais: pricing/status
        if (key === 'pricing_methodology' || key === 'job_status') {
          return collapsed.toLowerCase()
        }
        return collapsed
      }
      // Datas "delivery_date" normalizadas para YYYY-MM-DD
      if (key === 'delivery_date') {
        try {
          if (typeof value === 'string' && value) {
            // já vem como yyyy-mm-dd em inputs type=date
            return value
          }
          if (value instanceof Date) {
            const y = value.getFullYear()
            const m = `${value.getMonth() + 1}`.padStart(2, '0')
            const d = `${value.getDate()}`.padStart(2, '0')
            return `${y}-${m}-${d}`
          }
        } catch {
          return value
        }
      }
      return value
    })

  const isEqual: IsEqualFn =
    opts.isEqual ??
    ((a: unknown, b: unknown, key: string) => {
      const na = normalize(key, a)
      const nb = normalize(key, b)
      // For *_id keys, undefined !== null (we need the "clear" to pass)
      if (/_id$/.test(key)) {
        return na === nb
      }
      return JSON.stringify(na) === JSON.stringify(nb)
    })

  // Estado interno
  const changeBuffer = new Map<string, unknown>()
  const pendingKeys = ref(new Set<string>())
  const isSaving = ref(false)
  const lastSavedAt = ref<Date | null>(null)
  const error = ref<string | null>(null)
  const inFlightToken = ref(0)

  let debounceTimer: number | null = null
  let pendingAfterFlight = false

  function log(...args: unknown[]) {
    if (!dev) return
    debugLog('[JobAutosave]', ...args)
  }

  function scheduleDebounced() {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    debounceTimer = window.setTimeout(() => {
      void attemptFlush('debounce-timeout')
    }, debounceMs)
    log('⏳ scheduled debounce', { debounceMs, pendingKeys: [...pendingKeys.value] })
  }

  function queueChange(key: string, nextValue: unknown) {
    const normalized = normalize(key, nextValue)
    changeBuffer.set(key, normalized)
    pendingKeys.value.add(key)
    log('📝 queueChange', { key, normalized })
    scheduleDebounced()
  }

  function queueChanges(patch: Record<string, unknown>) {
    Object.entries(patch).forEach(([k, v]) => {
      const normalized = normalize(k, v)
      changeBuffer.set(k, normalized)
      pendingKeys.value.add(k)
    })
    log('📝 queueChanges', { keys: Object.keys(patch) })
    scheduleDebounced()
  }

  async function attemptFlush(reason?: string) {
    // Se houver timer pendente, cancela (vamos flushear agora)
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }

    // Se já estamos salvando, marca para rodar depois
    if (isSaving.value) {
      pendingAfterFlight = true
      log('⏭️ in-flight, marked pendingAfterFlight', { reason })
      return
    }

    // IMPORTANTE: Captura snapshot ANTES de qualquer modificação
    const originalSnapshot = opts.getSnapshot() ?? {}

    // Monta patch efetivo (no-op aware)
    const rawPatch: Record<string, unknown> = {}
    for (const [k, v] of changeBuffer.entries()) {
      rawPatch[k] = v
    }

    // Dependência: alteração de client_id implica zerar contato no mesmo payload
    if ('client_id' in rawPatch) {
      rawPatch['contact_id'] = null
      rawPatch['contact_name'] = null
      pendingKeys.value.add('contact_id')
      pendingKeys.value.add('contact_name')
    }

    // Remove no-ops comparando com snapshot ORIGINAL (antes de otimismo)
    const effectivePatch: Record<string, unknown> = {}
    Object.entries(rawPatch).forEach(([k, v]) => {
      if (!isEqual(originalSnapshot[k as keyof typeof originalSnapshot], v, k)) {
        effectivePatch[k] = v
      }
    })

    if (Object.keys(effectivePatch).length === 0) {
      // Nada mudou de fato
      log('🚫 no-op patch, aborting', { reason })
      // Limpa buffer dessas keys
      changeBuffer.clear()
      pendingKeys.value.clear()
      return
    }

    if ('client_id' in effectivePatch) {
      if (!('contact_id' in effectivePatch)) {
        effectivePatch['contact_id'] = null
      }
      if (!('contact_name' in effectivePatch)) {
        effectivePatch['contact_name'] = null
      }
    }

    // Gate de completude
    const virtualSnapshot = { ...originalSnapshot, ...effectivePatch }
    if (
      ('contact_id' in effectivePatch || 'contact_name' in effectivePatch) &&
      !virtualSnapshot['client_id']
    ) {
      log('⛔ canSave=false (contact_* change without client_id)')
      return
    }

    // Preparar envio
    isSaving.value = true
    error.value = null
    pendingAfterFlight = false
    const token = ++inFlightToken.value

    // Copia patch e limpa buffer (tudo que chegou até aqui será enviado)
    const sendingPatch = { ...effectivePatch }
    changeBuffer.clear()
    pendingKeys.value.clear()

    // Otimismo: guardar valores anteriores para rollback (do snapshot original)
    const previousValues: Record<string, unknown> = {}
    Object.keys(sendingPatch).forEach(
      (k) => (previousValues[k] = (originalSnapshot as Record<string, unknown>)[k]),
    )
    try {
      log('💡 optimistic apply', { sendingPatch })
      opts.applyOptimistic(sendingPatch)
    } catch (e) {
      log('⚠️ optimistic apply failed (ignored)', e)
    }

    try {
      const res = await saveWithRetry(sendingPatch, retry)
      // Ignorar respostas antigas
      if (token !== inFlightToken.value) {
        log('🕒 stale response ignored', { token, current: inFlightToken.value })
        return
      }

      if (!res.success) {
        throw new Error(res.error || (res.conflict ? 'Conflict' : 'Save failed'))
      }

      lastSavedAt.value = new Date()
      error.value = null
      log('✅ saved', { updatedAt: res.updatedAt, hasServerData: !!res.serverData })
    } catch (e) {
      // rollback
      try {
        log('↩️ rollback optimistic', { previous: previousValues })
        opts.rollbackOptimistic(previousValues)
      } catch (re) {
        log('⚠️ rollback failed (ignored)', re)
      }
      const msg = e instanceof Error ? e.message : 'Save failed'
      error.value = msg
      log('❌ save error', { msg })
    } finally {
      isSaving.value = false
      // Se houve novas alterações durante o voo, roda novamente
      if (pendingAfterFlight || changeBuffer.size > 0) {
        log('🔁 pending detected, attempting next flush')
        pendingAfterFlight = false
        // Evita loop imediato: agenda no próximo microtask
        queueMicrotask(() => {
          void attemptFlush('post-flight-pending')
        })
      }
    }
  }

  async function saveWithRetry(
    patch: Record<string, unknown>,
    policy: RetryPolicy,
  ): Promise<SaveResult> {
    let attempt = 0
    let delay = policy.baseDelayMs
    while (attempt < policy.attempts) {
      try {
        // Offline: falha imediata conforme política acordada
        if (typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine) {
          throw new Error('Offline')
        }

        const res = await opts.saveAdapter(patch)
        if (!res.success) {
          // Heurística simples: 400/422 ou conflict não devem retentar (o adapter pode sinalizar via flags)
          const nonTransient =
            res.conflict === true ||
            (res.error && /\b(400|422|validation|invalid)\b/i.test(String(res.error)))
          if (nonTransient) {
            return res
          }
          // transient → vai ao catch abaixo pra retentar
          throw new Error(res.error || 'Transient save error')
        }
        return res
      } catch (err) {
        attempt++
        const isLast = attempt >= policy.attempts
        const msg = err instanceof Error ? err.message : String(err)
        const transient =
          !/\b(400|422|validation|invalid|conflict)\b/i.test(msg) && msg.toLowerCase() !== 'offline'

        log('⏱️ retry', { attempt, msg, transient, isLast })

        if (!transient || isLast) {
          return { success: false, error: msg }
        }

        const jitter = policy.jitter ? Math.floor(Math.random() * (delay / 2)) : 0
        await new Promise((r) => setTimeout(r, delay + jitter))
        delay = Math.max(50, Math.floor(delay * (policy.factor || 2)))
      }
    }
    return { success: false, error: 'Save failed after retries' }
  }

  function cancel() {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    changeBuffer.clear()
    pendingKeys.value.clear()
    pendingAfterFlight = false
    log('🧹 canceled (cleared buffer and timers)')
  }

  async function flush(reason?: string) {
    await attemptFlush(reason ?? 'manual-flush')
  }

  // Bindings
  const beforeUnloadHandler = () => {
    // Chamada best-effort; não garante envio síncrono
    if (changeBuffer.size > 0 || isSaving.value) {
      log('🚪 beforeunload flush')
    }
    // Não bloquear a saída; apenas tentar flush
    void attemptFlush('beforeunload')
  }

  function onBeforeUnloadBind() {
    window.addEventListener('beforeunload', beforeUnloadHandler)
    log('🔗 bound beforeunload')
  }
  function onBeforeUnloadUnbind() {
    window.removeEventListener('beforeunload', beforeUnloadHandler)
    log('🔌 unbound beforeunload')
  }

  const visibilityHandler = () => {
    if (document.visibilityState === 'hidden') {
      log('🫥 visibility hidden flush')
      void attemptFlush('visibility-hidden')
    }
  }
  function onVisibilityBind() {
    document.addEventListener('visibilitychange', visibilityHandler)
    log('🔗 bound visibilitychange')
  }
  function onVisibilityUnbind() {
    document.removeEventListener('visibilitychange', visibilityHandler)
    log('🔌 unbound visibilitychange')
  }

  function onRouteLeaveBind(router: {
    beforeEach: (
      guard: (to: unknown, from: unknown, next: (value?: unknown) => void) => unknown,
    ) => unknown
  }) {
    const remove = router.beforeEach((_to, _from, next) => {
      // Best-effort: não bloquear navegação; apenas dispara flush
      log('🛣️ route leave flush')
      void attemptFlush('route-leave')
      next()
    })
    log('🔗 bound route-leave')
    return typeof remove === 'function' ? (remove as () => void) : () => {}
  }

  return {
    queueChange,
    queueChanges,
    flush,
    cancel,
    isSaving,
    lastSavedAt,
    error,
    pendingKeys,
    inFlightToken,
    onBeforeUnloadBind,
    onBeforeUnloadUnbind,
    onVisibilityBind,
    onVisibilityUnbind,
    onRouteLeaveBind,
  }
}
