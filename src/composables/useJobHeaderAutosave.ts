import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { createJobAutosave, type SaveResult } from './useJobAutosave'
import { jobService } from '../services/job.service'
import { useJobsStore } from '../stores/jobs'
import { toast } from 'vue-sonner'
import { z } from 'zod'
import { schemas } from '../api/generated/api'

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
    if ('pricing_methodology' in patch) p.pricing_methodology = (patch.pricing_methodology as Job['pricing_methodology']) ?? null
    if ('quoted' in patch) p.quoted = Boolean(patch.quoted)
    if ('fully_invoiced' in patch) p.fully_invoiced = Boolean(patch.fully_invoiced)
    if ('paid' in patch) p.paid = Boolean(patch.paid)
    if ('quote_acceptance_date' in patch) p.quote_acceptance_date = (patch.quote_acceptance_date as string | null | undefined) ?? null
    return p
  }

  // Local state and original snapshot (always based on header)
  const localHeader = ref<JobHeaderResponse>(header)
  const originalHeader = ref<JobHeaderResponse>(header)

  const isInitializing = ref(false)
  let unbindRouteGuard: () => void = () => {}

  // ---- mappings between Header and Job (only when necessary) ----
  const headerToPartialJob = (h: JobHeaderResponse): Partial<Job> => {
    // Header has: job_id, job_number, name, client:{id,name}, status, pricing_methodology, quoted, fully_invoiced, paid, quote_acceptance_date
    // Job expects: id, name, client_id, client_name, job_status, pricing_methodology, quoted, fully_invoiced, paid, quote_acceptance_date, ...
    return {
      id: h.job_id,
      name: h.name,
      client_id: h.client?.id ?? null,
      client_name: h.client?.name ?? null,
      job_status: h.status, // NOTE: maps status -> job_status
      pricing_methodology: h.pricing_methodology as 'time_materials' | 'fixed_price' | undefined,
      quoted: h.quoted,
      fully_invoiced: h.fully_invoiced,
      paid: h.paid,
      quote_acceptance_date: h.quote_acceptance_date ?? null,
    }
  }

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

        // Builds partial payload (Job) from received PATCH.
        // Backend accepts partial via serializer.partial=True.
        // Wrap in { data: { job: ... } } as per JobDetailResponse.
        const payloadJob: Partial<Job> = headerToPartialJob(originalHeader.value)

        // apply the patch (local fields)
        Object.assign(payloadJob, patch as Partial<Job>)

        // Include current basic info from store to prevent overwriting
        const currentBasicInfo = jobsStore.currentBasicInfo
        if (currentBasicInfo) {
          payloadJob.description = currentBasicInfo.description
          payloadJob.delivery_date = currentBasicInfo.delivery_date
          payloadJob.order_number = currentBasicInfo.order_number
          payloadJob.notes = currentBasicInfo.notes
        }

        // if client changed, clear contact (optional, but aligned with previous behavior)
        if ('client_id' in (patch as Partial<Job>)) {
          payloadJob.contact_id = null
          payloadJob.contact_name = null
        }

        const res = await jobService.updateJobHeaderPartial(jobId, payloadJob)
        if (!res.success) return { success: false, error: res.error }

        // For header-only updates, don't update the full job in store
        // to avoid overwriting basic info fields that aren't in the response
        // Just update the header snapshot
        const updatedHeader = applyPatchToHeader(originalHeader.value, patch as Partial<Job>)
        originalHeader.value = updatedHeader
        localHeader.value = updatedHeader

        // Update only the header in store, not the full job
        jobsStore.patchHeader(header.job_id, headerToPartialHeaderPatch(patch as Partial<Job>))

        toast.success('Job updated successfully')
        return { success: true, serverData: res.data }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        return { success: false, error: msg }
      }
    },
    devLogging: true,
  })

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
    isInitializing.value = false
  })

  onUnmounted(() => {
    autosave.onBeforeUnloadUnbind()
    autosave.onVisibilityUnbind()
    unbindRouteGuard()
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
