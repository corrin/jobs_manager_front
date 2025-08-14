import { ref } from 'vue'
import { toast } from 'vue-sonner'

// Temporary debug function until utils are available
const debugLog = (...args: unknown[]) => console.log('[DEBUG]', ...args)

// Temporary error extraction until utils are available
const extractErrorMessage = (error: unknown, fallback = 'Unknown error'): string => {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message)
  }
  return fallback
}

/**
 * useTimesheetAutosave - Per-row autosave orchestrator with debounce and limited concurrency.
 *
 * Responsibilities:
 * - Debounce by rowKey (backend id or tempId)
 * - Prevent duplicate in-flight saves for the same row
 * - FIFO queue with limited concurrency (default: 2)
 * - Coalesce rapid edits: if changes occur during a save, schedule a new execution
 * - Per-row soft refresh via provided callback
 *
 * Notes:
 * - Does not know the entry format; operates via callbacks provided by the caller
 */
export interface AutosaveEntryProvider<T> {
  // Returns the stable key for the row (backend id or tempId)
  getRowKey(entry: T): string | undefined
  // Gets the current row from the rowKey, ensuring the latest edited values
  getEntry(rowKey: string): T | null
}

export interface AutosaveGuards<T> {
  // Completeness rules to allow saving
  isRowComplete(entry: T): boolean
  // Duplicate check for new rows only (no backend id)
  isDuplicate(entry: T): boolean
}

export interface AutosaveActions<T> {
  // Executes persistence (reuses existing project logic)
  save(entry: T): Promise<void>
  // Soft refresh of the saved entry (authoritative merge from backend into the row)
  softRefresh(entry: T): Promise<void>
  // Optional callback after success
  onAfterSuccess?: (entry: T) => void
}

export interface AutosaveOptions<T>
  extends AutosaveEntryProvider<T>,
    AutosaveGuards<T>,
    AutosaveActions<T> {
  debounceMs?: number
  maxConcurrency?: number
}

type RowKey = string

interface RowState {
  isSaving: boolean
  pending: boolean
}

export function useTimesheetAutosave<T extends Record<string, unknown>>(opts: AutosaveOptions<T>) {
  const debounceMs = opts.debounceMs ?? 800
  const MAX_CONCURRENCY = opts.maxConcurrency ?? 2

  // Internal structures
  const timers = new Map<RowKey, number>()
  const state = new Map<RowKey, RowState>()
  const queue: RowKey[] = []
  const inFlight = ref(0)

  // Quick stats
  const queuedCount = () => queue.length
  const inFlightCount = () => inFlight.value
  const isIdle = () => queuedCount() === 0 && inFlightCount() === 0

  function schedule(rowKey: RowKey) {
    const existing = timers.get(rowKey)
    if (existing) {
      clearTimeout(existing)
      debugLog('🔄 [Autosave] rescheduled (cleared existing timer)', { rowKey })
    }
    const t = window.setTimeout(() => enqueue(rowKey), debounceMs)
    timers.set(rowKey, t)
    debugLog('⏳ [Autosave] scheduled', { rowKey, debounceMs })
  }

  function scheduleEntry(entry: T) {
    const rk = opts.getRowKey(entry)
    if (!rk) return
    schedule(rk)
  }

  function enqueue(rowKey: RowKey) {
    // If it's already saving, mark as pending to run again upon completion
    const st = state.get(rowKey) ?? { isSaving: false, pending: false }
    if (st.isSaving) {
      st.pending = true
      state.set(rowKey, st)
      debugLog('⏭️ [Autosave] in-flight, marked pending', { rowKey, currentState: st })
      return
    }
    queue.push(rowKey)
    debugLog('📥 [Autosave] enqueued', {
      rowKey,
      queueSize: queue.length,
      totalInFlight: inFlight.value,
    })
    process()
  }

  function process() {
    while (inFlight.value < MAX_CONCURRENCY && queue.length > 0) {
      const rowKey = queue.shift() as RowKey
      const st = state.get(rowKey) ?? { isSaving: false, pending: false }
      st.isSaving = true
      st.pending = false
      state.set(rowKey, st)
      inFlight.value++

      debugLog('🚀 [Autosave] processing', {
        rowKey,
        inFlight: inFlight.value,
        remainingQueue: queue.length,
      })

      saveRow(rowKey)
        .catch((err) => {
          // Errors already handled in saveRow (toasts); just logging here
          debugLog('❌ [Autosave] unhandled error in saveRow', err)
        })
        .finally(() => {
          inFlight.value--
          const s = state.get(rowKey) ?? { isSaving: false, pending: false }
          s.isSaving = false
          state.set(rowKey, s)

          // If new changes occurred during the save, re-enqueue
          if (s.pending) {
            debugLog('🔁 [Autosave] pending true, re-enqueue', { rowKey })
            enqueue(rowKey)
          }

          // Continue processing queue
          process()
        })
    }
  }

  async function saveRow(rowKey: RowKey) {
    // Get the most recent entry
    const entry = opts.getEntry(rowKey)
    if (!entry) {
      debugLog('⚠️ [Autosave] getEntry returned null - skipping', { rowKey })
      return
    }

    // Completeness validation
    if (!opts.isRowComplete(entry)) {
      debugLog('⛔ [Autosave] row incomplete - skip save', { rowKey })
      return
    }

    // Duplication for new rows
    if (opts.isDuplicate(entry)) {
      debugLog('⛔ [Autosave] duplicate new row - skip save', { rowKey })
      toast.error('Save failed: Duplicate entry detected')
      return
    }

    const toastId = `timesheet-save-${rowKey}`
    try {
      debugLog('💾 [Autosave] start save', { rowKey, entryId: entry.id || 'new' })
      toast.dismiss(toastId)
      toast.info('Saving entry...', { id: toastId, duration: 0 })

      await opts.save(entry)
      debugLog('💾 [Autosave] save completed, starting soft refresh', { rowKey })

      // After saving, perform a specific soft refresh
      await opts.softRefresh(entry)
      debugLog('🔄 [Autosave] soft refresh completed', { rowKey })

      toast.dismiss(toastId)
      toast.success('Entry saved')
      debugLog('✅ [Autosave] saved successfully', { rowKey, entryId: entry.id })

      // If the id has changed (from tempId to backend id), migrate internal states
      migrateRowKeyIfChanged(rowKey, entry)
      opts.onAfterSuccess?.(entry)
    } catch (error) {
      const message = extractErrorMessage(error, 'Save failed')
      toast.dismiss(toastId)
      toast.error(`Save failed: ${message}`)
      debugLog('❌ [Autosave] save error', { rowKey, error, message })
    }
  }

  function migrateRowKeyIfChanged(prevKey: RowKey, entry: T) {
    const newKey = opts.getRowKey(entry)
    if (!newKey || newKey === prevKey) return

    // Migrate timer
    const t = timers.get(prevKey)
    if (t) {
      timers.delete(prevKey)
      timers.set(newKey, t)
    }

    // Migrate state
    const s = state.get(prevKey)
    if (s) {
      state.delete(prevKey)
      state.set(newKey, s)
    }

    debugLog('🪄 [Autosave] migrated rowKey', { from: prevKey, to: newKey })
  }

  return {
    // Public API
    schedule,
    scheduleEntry,
    isIdle,
    stats: () => ({
      queued: queuedCount(),
      inFlight: inFlightCount(),
    }),
  }
}
