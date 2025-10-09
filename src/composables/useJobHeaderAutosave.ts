import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { createJobAutosave, type SaveResult } from './useJobAutosave'
import { useJobsStore } from '../stores/jobs'
import { toast } from 'vue-sonner'
import { onConcurrencyRetry } from '@/composables/useConcurrencyEvents'
import { z } from 'zod'
import { schemas } from '../api/generated/api'
import { useAuthStore } from '@/stores/auth'
import { useJobETags } from '@/composables/useJobETags'
import { buildJobDeltaEnvelope, useJobDeltaQueue } from '@/composables/useJobDelta'
import { submitJobDelta } from '@/services/delta.service'
import { isConcurrencyError } from '@/types/concurrency'

type Job = z.infer<typeof schemas.Job>
type JobHeaderResponse = z.infer<typeof schemas.JobHeaderResponse>

/**
 * Composable for autosave based on lightweight HEADER (JobHeaderResponse).
 * - Does not use getJob (avoids large payload)
 * - Maps header -> Job fields only when saving
 */
export function useJobHeaderAutosave(header: JobHeaderResponse) {
  const router = useRouter()
  const jobsStore = useJobsStore()
  const authStore = useAuthStore()
  const etagStore = useJobETags()
  const deltaQueue = useJobDeltaQueue(header.job_id)

  const headerToPartialHeaderPatch = (patch: Partial<Job>): Partial<JobHeaderResponse> => {
    const p: Partial<JobHeaderResponse> = {}
    if ('name' in patch) p.name = patch.name as string
    if ('client_id' in patch || 'client_name' in patch) {
      p.client = {
        id: (patch.client_id as string | null | undefined) ?? undefined,
        name: (patch.client_name as string | null | undefined) ?? undefined,
      } as JobHeaderResponse['client']
    }
    if ('job_status' in patch) p.status = String(patch.job_status)
    if ('pricing_methodology' in patch)
      p.pricing_methodology = (patch.pricing_methodology as Job['pricing_methodology']) ?? null
    if ('quoted' in patch) p.quoted = Boolean(patch.quoted)
    if ('fully_invoiced' in patch) p.fully_invoiced = Boolean(patch.fully_invoiced)
    if ('paid' in patch) p.paid = Boolean(patch.paid)
    if ('quote_acceptance_date' in patch)
      p.quote_acceptance_date = (patch.quote_acceptance_date as string | null | undefined) ?? null
    return p
  }

  // Local state and original snapshot (always based on header)
  const localHeader = ref<JobHeaderResponse>(header)
  const originalHeader = ref<JobHeaderResponse>(header)

  const isInitializing = ref(false)
  let unbindRouteGuard: () => void = () => {}
  let unbindConcurrencyRetry: () => void = () => {}

  /**
   * Applies a patch (based on "local" fields reflected from header) to the header snapshot.
   * Accepts keys: name, client_id, client_name, job_status, pricing_methodology, quoted, fully_invoiced, paid.
   * Here we do the inverse mapping (local fields -> header).
   */
  const applyPatchToHeader = (
    base: JobHeaderResponse,
    patch: Partial<Job>, // we use Partial<Job> because it's the format of local keys after mapping
  ): JobHeaderResponse => {
    // Update client (Header uses client:{id,name})
    const client =
      'client_id' in patch || 'client_name' in patch
        ? {
            id:
              (patch.client_id as string | null | undefined) !== undefined
                ? ((patch.client_id as string | null) ?? '')
                : (base.client?.id ?? ''),
            name:
              (patch.client_name as string | null | undefined) !== undefined
                ? ((patch.client_name as string | null) ?? '')
                : (base.client?.name ?? ''),
          }
        : base.client

    // status <- job_status
    const status =
      patch.job_status !== undefined && patch.job_status !== null
        ? String(patch.job_status)
        : base.status

    return {
      ...base,
      name: patch.name ?? base.name,
      client: client,
      status,
      pricing_methodology:
        (patch.pricing_methodology as Job['pricing_methodology']) ?? base.pricing_methodology,
      quoted: patch.quoted ?? base.quoted,
      fully_invoiced: patch.fully_invoiced ?? base.fully_invoiced,
      paid: patch.paid ?? base.paid,
      quote_acceptance_date:
        (patch.quote_acceptance_date as string | null | undefined) ?? base.quote_acceptance_date,
    }
  }

  // ---- Autosave ----
  const autosave = createJobAutosave({
    jobId: header.job_id,
    getSnapshot: () => {
      // Snapshot always in shape of HEADER; we will map to Job when saving
      return { ...originalHeader.value }
    },
    applyOptimistic: (patch) => {
      // patch comes in "local" format (Partial<Job>), so first convert to header
      localHeader.value = applyPatchToHeader(localHeader.value, patch as Partial<Job>)
      // Update store for immediate reactivity across app
      jobsStore.patchHeader(header.job_id, headerToPartialHeaderPatch(patch as Partial<Job>))
    },
    rollbackOptimistic: (previous) => {
      localHeader.value = applyPatchToHeader(localHeader.value, previous as Partial<Job>)
      jobsStore.patchHeader(header.job_id, headerToPartialHeaderPatch(previous as Partial<Job>))
    },
    saveAdapter: async (patch): Promise<SaveResult> => {
      try {
        const jobId = header.job_id
        if (!jobId) {
          return { success: false, error: 'Missing job id' }
        }
        const actorId = authStore.user?.id ?? null
        if (!actorId) {
          return { success: false, error: 'Missing actor id' }
        }

        // Only allow header fields to be updated here to prevent cross-job contamination
        const allowedHeaderKeys = [
          'name',
          'client_id',
          'client_name',
          'job_status',
          'pricing_methodology',
          'quoted',
          'fully_invoiced',
          'paid',
          'quote_acceptance_date',
        ] as const

        // Filter incoming patch down to allowed header keys only
        const filteredPatch: Partial<Job> = {}
        Object.entries(patch as Partial<Job>).forEach(([k, v]) => {
          if ((allowedHeaderKeys as readonly string[]).includes(k as string)) {
            ;(filteredPatch as Record<string, unknown>)[k] = v as unknown
          }
        })

        if (Object.keys(filteredPatch).length === 0) {
          return { success: true }
        }

        // Build payload strictly from filteredPatch (no base/header merge)
        const payloadJob: Record<string, unknown> = { ...filteredPatch }

        // If client changed, clear contact fields
        if ('client_id' in (filteredPatch as Partial<Job>)) {
          payloadJob.contact_id = null
          payloadJob.contact_name = null
        }

        const fields = Object.keys(payloadJob)

        const detail = jobsStore.getJobById(jobId)
        const beforeValues: Record<string, unknown> = {}
        const headerSnapshot = originalHeader.value
        for (const field of fields) {
          switch (field) {
            case 'name':
              beforeValues[field] = headerSnapshot.name
              break
            case 'client_id':
              beforeValues[field] = headerSnapshot.client?.id ?? null
              break
            case 'client_name':
              beforeValues[field] = headerSnapshot.client?.name ?? null
              break
            case 'job_status':
              beforeValues[field] = headerSnapshot.status
              break
            case 'pricing_methodology':
              beforeValues[field] = headerSnapshot.pricing_methodology
              break
            case 'quoted':
              beforeValues[field] = headerSnapshot.quoted
              break
            case 'fully_invoiced':
              beforeValues[field] = headerSnapshot.fully_invoiced
              break
            case 'paid':
              beforeValues[field] = headerSnapshot.paid
              break
            case 'quote_acceptance_date':
              beforeValues[field] = headerSnapshot.quote_acceptance_date
              break
            case 'contact_id':
              beforeValues[field] = detail?.job?.contact_id ?? null
              break
            case 'contact_name':
              beforeValues[field] = detail?.job?.contact_name ?? null
              break
            default:
              beforeValues[field] = detail?.job
                ? (detail.job as Record<string, unknown>)[field]
                : undefined
          }
        }

        const changeId = deltaQueue.getOrCreateChangeId(payloadJob)
        const etag = etagStore.getETag(jobId)
        const envelope = await buildJobDeltaEnvelope({
          job_id: jobId,
          change_id: changeId,
          actor_id: actorId,
          made_at: new Date().toISOString(),
          etag,
          before: beforeValues,
          after: payloadJob,
          fields,
        })

        const res = await submitJobDelta(jobId, envelope)
        if (!res.success) {
          const msg = res.error
          const conflict =
            /precondition|if-?match|etag|412|428|updated by another user|data reloaded|concurrent modification|missing version/i.test(
              msg,
            )
          return { success: false, error: msg, conflict }
        }

        deltaQueue.clearChangeId()

        if (res.data?.data) {
          jobsStore.setDetailedJob(res.data.data)
        }

        const updatedHeader = applyPatchToHeader(originalHeader.value, payloadJob as Partial<Job>)
        originalHeader.value = updatedHeader
        localHeader.value = updatedHeader

        jobsStore.patchHeader(header.job_id, headerToPartialHeaderPatch(payloadJob as Partial<Job>))

        toast.success('Job updated successfully')
        return { success: true, serverData: res.data }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        const conflict = isConcurrencyError(e)
        return { success: false, error: msg, conflict }
      }
    },
    devLogging: true,
  })

  // Sync header UI with store after a conflict-triggered reload (or any store update)
  const storeHeader = computed(() => jobsStore.getHeaderById(header.job_id))
  watch(
    storeHeader,
    (newHeader) => {
      if (!newHeader) return
      // Update both local and original snapshots so the UI reflects the latest server data
      // Preserve object shape (especially client) to avoid partial merging issues
      localHeader.value = {
        ...localHeader.value,
        ...newHeader,
        client: newHeader.client,
      }
      originalHeader.value = newHeader
    },
    { deep: true },
  )

  // Helpers
  const enqueue = (key: keyof Partial<Job>, value: unknown) => {
    if (!isInitializing.value) {
      autosave.queueChange(key as string, value)
    }
  }

  // Handlers that UI uses (everything in terms of "local" fields that map well to Job)
  const handleNameUpdate = (name: string) => enqueue('name', name)
  const handleClientUpdate = (client: { id: string; name: string }) => {
    autosave.queueChanges({
      client_id: client.id,
      client_name: client.name,
      contact_id: null,
      contact_name: null,
    })
    void autosave.flush('client-change')
  }
  const handleStatusUpdate = (newStatus: string) => enqueue('job_status', newStatus)
  const handlePricingMethodologyUpdate = (method: string) => enqueue('pricing_methodology', method)
  const handleQuotedUpdate = (v: boolean) => enqueue('quoted', v)
  const handleFullyInvoicedUpdate = (v: boolean) => enqueue('fully_invoiced', v)
  const handlePaidUpdate = (v: boolean) => enqueue('paid', v)

  // Status indicators
  const saveHasError = computed(() => !!autosave.error.value)
  const saveStatusText = computed(() => {
    if (autosave.isSaving.value) return 'Saving...'
    if (autosave.error.value) return 'Save failed'
    if (autosave.lastSavedAt.value) {
      try {
        return `Saved at ${autosave.lastSavedAt.value.toLocaleTimeString()}`
      } catch {
        return 'Saved'
      }
    }
    return ''
  })
  const retrySave = () => void autosave.flush('retry-click')

  onMounted(() => {
    isInitializing.value = true
    // binds
    autosave.onBeforeUnloadBind()
    autosave.onVisibilityBind()
    unbindRouteGuard = autosave.onRouteLeaveBind({
      beforeEach: (guard: any) => router.beforeEach(guard), // eslint-disable-line @typescript-eslint/no-explicit-any
    })
    // Listen for global "Retry" from concurrency toast for this job
    unbindConcurrencyRetry = onConcurrencyRetry(header.job_id, () => {
      void autosave.flush('retry-click')
    })
    isInitializing.value = false
  })

  onUnmounted(() => {
    autosave.onBeforeUnloadUnbind()
    autosave.onVisibilityUnbind()
    unbindRouteGuard()
    unbindConcurrencyRetry()
  })

  return {
    // "local" header reactive (for UI)
    localHeader,
    // setters
    handleNameUpdate,
    handleClientUpdate,
    handleStatusUpdate,
    handlePricingMethodologyUpdate,
    handleQuotedUpdate,
    handleFullyInvoicedUpdate,
    handlePaidUpdate,
    // status
    saveHasError,
    saveStatusText,
    retrySave,
  }
}
