<template>
  <AppLayout>
    <div class="p-4 md:p-8 flex flex-col gap-4">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center py-8">
        <div class="text-gray-600">Loading purchase order...</div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-red-800">{{ error }}</p>
        <Button @click="load" class="mt-2" variant="outline" size="sm"> Try Again </Button>
      </div>

      <!-- Main Content -->
      <div v-else class="flex flex-col lg:flex-row gap-6">
        <PoSummaryCard
          :po="po"
          :is-create-mode="false"
          :show-actions="canShowActions"
          :sync-enabled="canSync"
          :supplier-readonly="!canEditSupplier"
          :class="{
            'opacity-75': isPoDeleted,
            'opacity-90': isPoSubmitted,
          }"
          @update:supplier="canEditSupplier ? (po.supplier = $event) : null"
          @update:supplier_id="canEditSupplier ? (po.supplier_id = $event) : null"
          @update:pickup_address_id="handlePickupAddressChange($event)"
          @update:reference="!isPoDeleted ? (po.reference = $event) : null"
          @update:expected_delivery="!isPoDeleted ? (po.expected_delivery = $event) : null"
          @update:status="handleStatusChange"
          @save="saveSummary"
          @sync-xero="syncWithXero"
          @view-xero="viewInXero"
          @print="printPo"
          @email="emailPo"
        />
        <Card
          class="flex-1 flex flex-col"
          :class="{
            'opacity-75': isPoDeleted,
            'opacity-90': isPoSubmitted,
          }"
        >
          <CardHeader>
            <h2 class="font-semibold">Line Items</h2>
          </CardHeader>
          <CardContent class="flex-1 flex flex-col">
            <PoLinesTable
              :lines="po.lines"
              :jobs="jobs"
              :read-only="!canEditLineItems"
              :jobs-read-only="!canEditJobs"
              :existing-allocations="existingAllocations"
              :default-retail-rate="defaultRetailRate"
              :stock-holding-job-id="stockHoldingJobId || undefined"
              :po-status="po.status"
              :po-id="po.id"
              @update:lines="canEditLineItems || canEditJobs ? (po.lines = $event) : null"
              @add-line="handleAddLineEvent"
              @delete-line="deleteLine"
              @receipt:save="handleReceiptSave"
              @allocation-deleted="handleAllocationDeleted"
            />
          </CardContent>
        </Card>
      </div>

      <!-- Deleted PO Warning Banner - Horizontal below cards -->
      <div v-if="isPoDeleted" class="w-full bg-red-50 border border-red-200 rounded-lg p-3">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <span class="text-sm font-medium text-red-800">Purchase Order Deleted</span>
            <span class="text-sm text-red-700 ml-2"
              >This purchase order has been deleted. All editing functions are disabled - you can
              only view the details.</span
            >
          </div>
        </div>
      </div>

      <!-- Submitted PO Warning Banner - Horizontal below cards -->
      <div
        v-else-if="isPoSubmitted"
        class="w-full bg-blue-50 border border-blue-200 rounded-lg p-3"
      >
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-4 w-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <span class="text-sm font-medium text-blue-800"
              >Purchase Order Submitted to Supplier</span
            >
            <span class="text-sm text-blue-700 ml-2"
              >This purchase order has been submitted to the supplier. Supplier and line item
              changes are locked, but other details can still be updated.</span
            >
          </div>
        </div>
      </div>

      <!-- Comments Section -->
      <PoCommentsSection v-if="orderId && !isCreateMode" :po-id="orderId" />
      <Card v-else class="mt-2">
        <CardHeader>
          <h3 class="font-semibold text-sm">Comments</h3>
        </CardHeader>
        <CardContent class="text-sm text-slate-600">
          Comments will be available after this PO is published.
        </CardContent>
      </Card>

      <div
        v-if="isCreateMode"
        class="flex flex-wrap gap-2 justify-end"
        data-automation-id="PurchaseOrderFormView-create-actions"
      >
        <Button variant="outline" @click="clearCreateDraft">Discard Draft</Button>
      </div>

      <div v-else class="flex flex-wrap gap-2 justify-end">
        <Button aria-label="Close" @click="close" data-automation-id="PurchaseOrderFormView-close"
          >Close</Button
        >
      </div>
    </div>

    <!-- PDF Dialog -->
    <PoPdfDialog
      :open="showPdfDialog"
      :purchase-order-id="orderId"
      :po-number="po.po_number"
      @update:open="showPdfDialog = $event"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { debugLog } from '@/utils/debug'

import { ref, watch, onMounted, computed } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PoSummaryCard from '@/components/purchasing/PoSummaryCard.vue'
import PoLinesTable from '@/components/purchasing/PoLinesTable.vue'
import PoPdfDialog from '@/components/purchasing/PoPdfDialog.vue'
import PoCommentsSection from '@/components/purchasing/PoCommentsSection.vue'
import { useRoute, useRouter } from 'vue-router'
import { usePurchaseOrderStore } from '@/stores/purchaseOrderStore'
import { useXeroItemStore } from '@/stores/xeroItemStore'
import { useDeliveryReceiptStore } from '@/stores/deliveryReceiptStore'
import { extractErrorMessage, createErrorToast } from '@/utils/errorHandler'
import { toast } from 'vue-sonner'
import { api } from '@/api/client'
import { transformDeliveryReceiptForAPI } from '@/utils/delivery-receipt'
import { schemas } from '@/api/generated/api'
import { onPoConcurrencyRetry } from '@/composables/usePoConcurrencyEvents'
import { openGmailCompose } from '@/utils/email'
import type { z } from 'zod'
import { getPoDraft, savePoDraft, deletePoDraft, listPoDrafts } from '@/composables/usePoDrafts'

// Import types from generated API schemas
type PurchaseOrderLine = z.infer<typeof schemas.PurchaseOrderLine>
type Job = z.infer<typeof schemas.JobForPurchasing>
type AllocationItem = z.infer<typeof schemas.AllocationItem>
type DeliveryAllocation = z.infer<typeof schemas.DeliveryReceiptAllocationRequest>
type PurchaseOrderEmailResponse = z.infer<typeof schemas.PurchaseOrderEmailResponse>
type ClientContact = z.infer<typeof schemas.ClientContact>
type PurchaseOrderEmailResponseWithLegacy = PurchaseOrderEmailResponse & { email?: string }
type BackendPurchaseOrderStatus = z.infer<typeof schemas.PurchaseOrderDetailStatusEnum>
type UiPurchaseOrderStatus = BackendPurchaseOrderStatus | 'local_draft'
type PurchaseOrderLineCreate = z.input<typeof schemas.PurchaseOrderLineCreateRequest>
type PurchaseOrderCreatePayload = z.input<typeof schemas.PurchaseOrderCreateRequest>
type LocalPurchaseOrder = Omit<z.infer<typeof schemas.PurchaseOrderDetail>, 'status' | 'lines'> & {
  status?: UiPurchaseOrderStatus
  lines: PurchaseOrderLine[]
}

const route = useRoute()
const router = useRouter()
const orderIdParam = route.params.id as string | undefined
const draftIdParam = (route.query.draft as string | undefined) || undefined
const draftId = ref<string | undefined>(draftIdParam)
const orderId = orderIdParam ?? 'new'
const isCreateMode = computed(() => orderId === 'new')
const store = usePurchaseOrderStore()
const xeroItemStore = useXeroItemStore()
const receiptStore = useDeliveryReceiptStore()
const originalLines = ref<PurchaseOrderLine[]>([])
const isSyncing = ref(false)
const showPdfDialog = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)
const jobs = ref<Job[]>([])
const isLoadingJobs = ref(false)
const existingAllocations = ref<Record<string, AllocationItem[]>>({})
const stockHoldingJobId = ref<string | null>(null)
const isSavingReceipt = ref(false)
const lastPoNumber = ref<string | null>(null)
const isLoadingLastPoNumber = ref(false)
const lastPoNumberError = ref<string | null>(null)
const lastDraftSavedAt = ref<Date | null>(null)

const mapLineToDraft = (line: PurchaseOrderLine): PurchaseOrderLineCreate => ({
  job_id: line.job_id || null,
  description: line.description || '',
  quantity: line.quantity ?? 0,
  unit_cost: line.unit_cost ?? null,
  price_tbc: line.price_tbc ?? false,
  item_code: line.item_code || '',
  metal_type: (line.metal_type as string | undefined) || '',
  alloy: line.alloy || '',
  specifics: line.specifics || '',
  location: line.location || '',
  dimensions: line.dimensions || '',
})

const mapDraftLineToPoLine = (line: PurchaseOrderLineCreate): PurchaseOrderLine => ({
  id: '',
  description: line.description || '',
  quantity: line.quantity ?? 0,
  dimensions: line.dimensions || undefined,
  unit_cost: line.unit_cost ?? null,
  price_tbc: line.price_tbc ?? false,
  supplier_item_code: undefined,
  item_code: line.item_code || '',
  received_quantity: undefined,
  metal_type: (line.metal_type as string | undefined) || undefined,
  alloy: line.alloy || undefined,
  specifics: line.specifics || undefined,
  location: line.location || undefined,
  job_id: line.job_id ?? null,
})

const createEmptyPo = (): LocalPurchaseOrder => ({
  id: '',
  po_number: 'Local Draft',
  supplier: '',
  supplier_id: null,
  supplier_has_xero_id: false,
  pickup_address_id: null,
  pickup_address: null,
  reference: '',
  order_date: null,
  expected_delivery: null,
  status: 'local_draft',
  lines: [],
  online_url: undefined,
  xero_id: undefined,
  created_by_id: null,
  created_by_name: '',
})

const po = ref<LocalPurchaseOrder>(createEmptyPo())

const linesToDelete = ref<string[]>([])
const supplierEmailCache = ref<Record<string, string | null>>({})
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const isPoDeleted = computed(() => po.value.status === 'deleted')
const isPoSubmitted = computed(() => po.value.status === 'submitted')
const isPromoting = ref(false)
const blockDraftPersist = ref(false)

// More granular permissions
const canEditSupplier = computed(() => !isPoDeleted.value && !isPoSubmitted.value)
const canEditLineItems = computed(() => !isPoDeleted.value && !isPoSubmitted.value)
const canEditJobs = computed(() => !isPoDeleted.value) // Jobs can be edited even when submitted
const canEditStatus = computed(() => !isPoDeleted.value) // Status can be changed even when submitted
const canShowActions = computed(() => !isPoDeleted.value) // Keep actions visible for consistent UI
const defaultRetailRate = computed(() => receiptStore.getDefaultRetailRate())

// Check if any lines have TBC pricing (costs not yet confirmed)
const hasUnknownCosts = computed(() => {
  return po.value.lines.some((line) => line.price_tbc === true)
})

const nextPoNumber = computed(() => {
  if (!lastPoNumber.value) return null
  const match = lastPoNumber.value.match(/^(.*?)(\d+)\s*$/)
  if (!match) return null
  const prefix = match[1]
  const numberPart = match[2]
  const incremented = (Number(numberPart) || 0) + 1
  return `${prefix}${incremented.toString().padStart(numberPart.length, '0')}`
})

// When the backend last PO number arrives, assign the next number to drafts that still show the placeholder
watch(
  nextPoNumber,
  (val) => {
    if (!isCreateMode.value) return
    if (
      val &&
      (po.value.po_number === 'Local Draft' || !po.value.po_number) &&
      po.value.supplier_id
    ) {
      po.value.po_number = val
      persistCreateDraft()
    }
  },
  { immediate: false },
)

// Autosave supplier updates; once supplier is set, treat draft as 'draft' status and persist locally
watch(
  () => [po.value.supplier_id, po.value.supplier],
  async () => {
    if (!isCreateMode.value) return
    if (po.value.supplier_id) {
      po.value.status = 'draft'
      if (
        po.value.po_number === 'Local Draft' ||
        po.value.po_number === '' ||
        po.value.po_number === undefined
      ) {
        po.value.po_number = nextPoNumber.value || po.value.po_number || 'Local Draft'
      }
      await promoteDraftToBackend()
    }
    persistCreateDraft()
  },
  { deep: false },
)

const persistCreateDraft = () => {
  if (!isCreateMode.value || typeof localStorage === 'undefined') return
  if (blockDraftPersist.value) {
    debugLog('Skipping local draft persist (blocked due to promotion)')
    return
  }
  try {
    if (
      !po.value.po_number ||
      po.value.po_number === 'Local Draft' ||
      po.value.po_number === undefined
    ) {
      po.value.po_number = nextPoNumber.value || 'Local Draft'
    }
    const draftIdToPersist =
      draftId.value ||
      (route.query.draft as string | undefined) ||
      (po.value.id && po.value.id !== 'new' ? po.value.id : undefined)

    const savedId = savePoDraft({
      draftId: draftIdToPersist,
      supplier_id: po.value.supplier_id ?? null,
      pickup_address_id: po.value.pickup_address_id ?? null,
      reference: po.value.reference ?? '',
      order_date: po.value.order_date || null,
      expected_delivery: po.value.expected_delivery || null,
      lines: (po.value.lines ?? []).map(mapLineToDraft),
      label: po.value.reference || po.value.supplier || 'Untitled PO',
      supplier: po.value.supplier || '',
      po_number: po.value.po_number,
    })

    if (!draftId.value && savedId) {
      draftId.value = savedId
      router.replace({ query: { ...route.query, draft: savedId } })
    }
    lastDraftSavedAt.value = new Date()
  } catch (err) {
    debugLog('Failed to persist PO create draft', err)
  }
}

const restoreCreateDraft = () => {
  if (!isCreateMode.value || typeof localStorage === 'undefined') return
  try {
    const drafts = listPoDrafts()
    const targetDraft = (draftId.value && getPoDraft(draftId.value)) || drafts[0] || null
    if (!targetDraft) return

    po.value = {
      ...po.value,
      ...targetDraft,
      lines: (targetDraft.lines ?? []).map(mapDraftLineToPoLine),
      po_number: targetDraft.po_number || po.value.po_number || nextPoNumber.value || 'Local Draft',
      order_date: targetDraft.order_date || '',
      expected_delivery: targetDraft.expected_delivery || '',
    }
    originalLines.value = JSON.parse(JSON.stringify(po.value.lines))
  } catch (err) {
    debugLog('Failed to restore PO create draft', err)
  }
}

const ensureCreateDraft = () => {
  if (!isCreateMode.value) return
  if (draftId.value) {
    // Already have an id, just persist current state to refresh updatedAt
    persistCreateDraft()
    return
  }
  // Create a new empty draft entry immediately so it shows on the list
  persistCreateDraft()
}

const removeDraftLocally = () => {
  const drafts = listPoDrafts()
  const targetId =
    draftId.value ||
    (route.query.draft as string | undefined) ||
    drafts.find(
      (d) =>
        d.po_number === po.value.po_number ||
        (po.value.reference && d.reference === po.value.reference),
    )?.draftId

  if (targetId) {
    deletePoDraft(targetId)
    // Notify other views (list) to refresh their in-memory draft cache
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'po-drafts', storageArea: localStorage }),
    )
  }
  draftId.value = undefined
}

const promoteDraftToBackend = async () => {
  if (!isCreateMode.value || isPromoting.value) return
  if (!po.value.supplier_id) return

  try {
    isPromoting.value = true
    blockDraftPersist.value = true
    const payload: PurchaseOrderCreatePayload = {
      supplier_id: po.value.supplier_id,
      pickup_address_id: po.value.pickup_address_id ?? null,
      reference: po.value.reference ?? '',
      order_date: po.value.order_date || null,
      expected_delivery: po.value.expected_delivery || null,
      lines: (po.value.lines ?? []).map((line) => ({
        job_id: line.job_id ?? null,
        description: line.description || '',
        quantity: line.quantity ?? 0,
        unit_cost: line.unit_cost ?? null,
        price_tbc: line.price_tbc ?? false,
        item_code: line.item_code || '',
        metal_type: (line.metal_type as string | undefined) || undefined,
        alloy: line.alloy || undefined,
        specifics: line.specifics || undefined,
        location: line.location || undefined,
        dimensions: line.dimensions || undefined,
      })),
    }

    const created = await store.createOrder(payload)
    // Drop local draft and redirect to the real PO
    removeDraftLocally()
    toast.success('Purchase order created')
    router.replace(`/purchasing/po/${created.id}`)
  } catch (err) {
    debugLog('Failed to promote local draft to backend', err)
    toast.error('Failed to create purchase order. Please try again.')
  } finally {
    isPromoting.value = false
    // If promotion failed, allow draft saves again
    if (!router.currentRoute.value.path.includes('/purchasing/po/')) {
      blockDraftPersist.value = false
    }
  }
}

const clearCreateDraft = () => {
  if (typeof localStorage === 'undefined') return
  const targetId =
    draftId.value || (route.query.draft as string | undefined) || listPoDrafts()[0]?.draftId
  if (targetId) {
    deletePoDraft(targetId)
  }
  draftId.value = undefined
  po.value = createEmptyPo()
  originalLines.value = []
  const nextQuery = { ...route.query }
  delete (nextQuery as Record<string, unknown>).draft
  router.replace({ query: nextQuery })
}

const refreshLastPoNumber = async () => {
  if (!isCreateMode.value) return
  isLoadingLastPoNumber.value = true
  lastPoNumberError.value = null
  try {
    const latest = await store.fetchLastPoNumber()
    lastPoNumber.value = latest
    if (!po.value.po_number && latest) {
      po.value.po_number = nextPoNumber.value || latest
    }
  } catch (err) {
    lastPoNumberError.value =
      err instanceof Error ? err.message : 'Failed to load last purchase order number'
  } finally {
    isLoadingLastPoNumber.value = false
  }
}

async function fetchJobs() {
  if (isLoadingJobs.value) return

  isLoadingJobs.value = true
  error.value = null

  try {
    debugLog('Loading jobs for purchase order...')
    // Use the all-jobs endpoint which returns the expected format with jobs array
    const response = await api.purchasing_rest_all_jobs_retrieve()
    debugLog('Zodios response:', response)

    if (!response.success) {
      throw new Error('Failed to fetch jobs from server')
    }

    jobs.value = response.jobs || []
    debugLog(`Loaded ${jobs.value.length} jobs for purchase order`)

    if (jobs.value.length === 0) {
      toast.warning('No jobs available for purchase order creation')
    } else {
      debugLog('First job sample:', jobs.value[0])
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load jobs'
    debugLog('Error loading jobs for purchasing:', err)
    toast.error(
      `Failed to load jobs: ${errorMessage}. Job selection is required for purchase orders.`,
    )

    jobs.value = []
  } finally {
    isLoadingJobs.value = false
  }
}

async function loadExistingAllocations() {
  if (!orderId || isCreateMode.value) return

  try {
    const response = await receiptStore
      .fetchExistingAllocations(orderId)
      .catch(() => ({ allocations: {} }))
    existingAllocations.value = response.allocations || {}
  } catch (err) {
    debugLog('Error loading existing allocations:', err)
    existingAllocations.value = {}
  }
}

async function loadJobsForReceipt() {
  if (isCreateMode.value) return
  try {
    const { stockHolding } = await receiptStore.fetchJobs()
    stockHoldingJobId.value = stockHolding?.id || null
  } catch (err) {
    debugLog('Error loading jobs for receipt:', err)
    stockHoldingJobId.value = null
  }
}

async function load() {
  if (isCreateMode.value) {
    debugLog('Create mode - skipping server load, using local draft')
    return
  }

  if (!orderId) {
    error.value = 'Purchase order ID is required'
    return
  }

  debugLog('Loading PO data...')
  isLoading.value = true
  isReloading.value = true
  error.value = null

  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
    debugLog('Cancelled pending autosave during reload')
  }

  try {
    const data = await api.retrievePurchaseOrder({ params: { po_id: orderId } })
    po.value = data
    originalLines.value = JSON.parse(JSON.stringify(po.value.lines))

    debugLog('PO loaded successfully. Lines:', po.value.lines.length)

    if (po.value.status === 'deleted') {
      toast.warning('This purchase order has been deleted and cannot be edited', {
        duration: 5000,
        description: 'You can view the details but all editing functions are disabled.',
      })
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load purchase order'
    error.value = errorMessage
    debugLog('Error loading purchase order:', err)

    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      toast.error('Purchase order not found')
      setTimeout(() => {
        router.push('/purchasing/po')
      }, 2000)
    } else {
      toast.error(`Failed to load purchase order: ${errorMessage}`)
    }
  } finally {
    isLoading.value = false
    setTimeout(() => {
      isReloading.value = false
      debugLog('Reload complete, watchers re-enabled')
    }, 200)
  }
}

async function saveSummary() {
  if (isCreateMode.value) {
    persistCreateDraft()
    toast.success('Draft saved locally')
    return
  }

  if (isPoDeleted.value) {
    toast.error('Cannot save changes - this purchase order has been deleted')
    return
  }

  const updateData = {
    reference: po.value.reference,
    expected_delivery: po.value.expected_delivery,
  } as Record<string, unknown>

  const currentStatus = po.value.status as UiPurchaseOrderStatus | undefined
  if (currentStatus && currentStatus !== 'local_draft') {
    updateData.status = currentStatus
  }

  if (canEditSupplier.value) {
    if (po.value.supplier) {
      updateData.supplier = po.value.supplier
    }
    if (po.value.supplier_id) {
      updateData.supplier_id = po.value.supplier_id
    }
    // Include pickup_address_id (can be null to clear)
    updateData.pickup_address_id = po.value.pickup_address_id || null
  }

  try {
    await store.patch(orderId, updateData)
    toast.success('Summary saved')
    await load()
    await loadExistingAllocations()
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    debugLog('Error saving summary:', err)

    // Listen for retry events if this was a concurrency conflict
    if (
      errorMessage.includes('412') ||
      errorMessage.includes('Precondition Failed') ||
      errorMessage.includes('updated elsewhere') ||
      errorMessage.includes('Data reloaded')
    ) {
      // Immediately reload data so user can see what changed
      await load()
      await loadExistingAllocations()

      const unsubscribe = onPoConcurrencyRetry(orderId, async () => {
        unsubscribe() // Clean up listener
        try {
          await store.patch(orderId, updateData)
          toast.success('Summary saved')
          await load() // Reload to show latest data
          await loadExistingAllocations()
        } catch (retryErr) {
          toast.error('Retry failed. Please try again.')
          debugLog('Retry failed:', retryErr)
        }
      })
    }
    throw err // Re-throw to maintain existing error handling
  }
}

function handlePickupAddressChange(addressId: string | null) {
  // Pickup address can be changed even on submitted POs (only blocked when deleted)
  if (isPoDeleted.value) return
  po.value.pickup_address_id = addressId
  // Trigger save
  saveSummary()
}

function handleStatusChange(newStatus: UiPurchaseOrderStatus) {
  if (!canEditStatus.value) return

  // Block setting to fully_received if there are TBC items
  if (newStatus === 'fully_received' && hasUnknownCosts.value) {
    toast.error(
      'Cannot mark as fully received until all costs are known. Please untick "Price TBC" on all line items first.',
    )
    return
  }

  po.value.status = newStatus
}

const handleAddLineEvent = () => {
  debugLog('handleAddLineEvent triggered from PoLinesTable')
  debugLog('canEditLineItems:', canEditLineItems.value)

  if (!canEditLineItems.value) {
    debugLog('Cannot edit line items - permission denied')
    return
  }

  addLine()
}

function addLine() {
  debugLog('addLine function called')
  debugLog('Current PO lines:', po.value.lines.length)
  debugLog('Is PO deleted:', isPoDeleted.value)
  debugLog('Is PO submitted:', isPoSubmitted.value)

  if (isPoDeleted.value) {
    debugLog('Blocked: PO is deleted')
    toast.error('Cannot add lines - this purchase order has been deleted')
    return
  }
  if (isPoSubmitted.value) {
    debugLog('Blocked: PO is submitted')
    toast.error('Cannot add lines - this purchase order has been submitted to supplier')
    return
  }

  const newLine: PurchaseOrderLine = {
    id: '',
    description: '',
    quantity: 1,
    dimensions: undefined,
    unit_cost: 0,
    price_tbc: false,
    supplier_item_code: undefined,
    item_code: '',
    received_quantity: undefined,
    metal_type: undefined,
    alloy: undefined,
    specifics: undefined,
    location: undefined,
    job_id: null,
  }

  debugLog('Adding new line:', newLine)

  try {
    po.value.lines = [...po.value.lines, newLine]
    debugLog('Line added successfully. New count:', po.value.lines.length)
  } catch (error) {
    debugLog('Error adding line:', error)
    toast.error('Failed to add line: ' + error)
  }
}

function deleteLine(idOrIdx: string | number) {
  if (isPoDeleted.value) {
    toast.error('Cannot delete lines - this purchase order has been deleted')
    return
  }
  if (isPoSubmitted.value) {
    toast.error('Cannot delete lines - this purchase order has been submitted to supplier')
    return
  }

  debugLog('Deleting line:', idOrIdx)

  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
    debugLog('Cancelled pending autosave timer')
  }

  isDeletingLine.value = true

  try {
    if (typeof idOrIdx === 'string') {
      const lineToDelete = po.value.lines.find((l: PurchaseOrderLine) => l.id === idOrIdx)

      if (lineToDelete && hasAnyContent(lineToDelete)) {
        linesToDelete.value.push(idOrIdx)
        debugLog('Added line to delete list:', idOrIdx)
      }

      po.value.lines = po.value.lines.filter((l: PurchaseOrderLine) => l.id !== idOrIdx)
    } else {
      po.value.lines = po.value.lines.filter((_: PurchaseOrderLine, idx: number) => idx !== idOrIdx)
    }

    debugLog('Line deleted. Remaining lines:', po.value.lines.length)
  } finally {
    setTimeout(() => {
      isDeletingLine.value = false
      debugLog('Deletion flag cleared, autosave re-enabled')

      // Trigger autosave after deletion if there are lines to delete
      if (linesToDelete.value.length > 0) {
        debugLog('Triggering save for deleted lines')
        saveLines()
      }
    }, 500)
  }
}

function hasAnyContent(line: PurchaseOrderLine) {
  return (
    (line.item_code && line.item_code.trim() !== '') ||
    (line.description && line.description.trim() !== '') ||
    (line.unit_cost != null && line.unit_cost > 0) ||
    line.price_tbc === true ||
    line.quantity > 0 ||
    (line.job_id && line.job_id.trim() !== '')
  )
}

function lineChanged(line: PurchaseOrderLine) {
  if (!line.id) return true

  const orig = originalLines.value.find((o) => o.id === line.id)
  if (!orig) return true

  // If PO is submitted, only job changes are allowed
  if (isPoSubmitted.value) {
    return orig.job_id !== line.job_id
  }

  // For draft/other statuses, check all fields
  return (
    orig.item_code !== line.item_code ||
    orig.description !== line.description ||
    orig.quantity !== line.quantity ||
    (orig.unit_cost ?? 0) !== (line.unit_cost ?? 0) ||
    orig.price_tbc !== line.price_tbc ||
    orig.job_id !== line.job_id ||
    orig.metal_type !== line.metal_type ||
    orig.alloy !== line.alloy ||
    orig.specifics !== line.specifics ||
    orig.location !== line.location ||
    orig.dimensions !== line.dimensions
  )
}

function isValidLine(line: PurchaseOrderLine) {
  const hasContent =
    (line.item_code && line.item_code.trim() !== '') ||
    (line.description && line.description.trim() !== '')

  if (!hasContent) {
    return false
  }

  const hasPrice = (line.unit_cost != null && line.unit_cost > 0) || line.price_tbc === true

  return hasPrice
}

async function saveLines() {
  if (isCreateMode.value) {
    originalLines.value = JSON.parse(JSON.stringify(po.value.lines))
    persistCreateDraft()
    toast.success('Draft saved locally')
    return
  }

  if (isPoDeleted.value) {
    debugLog('Cannot save - PO is deleted')
    toast.error('Cannot save changes - this purchase order has been deleted')
    return
  }

  if (isReloading.value || isDeletingLine.value) {
    debugLog('Skipping save - reloading:', isReloading.value, 'deleting:', isDeletingLine.value)
    return
  }

  // Take snapshot for rollback
  const snapshot = JSON.parse(JSON.stringify(po.value.lines))

  linesToDelete.value = linesToDelete.value.filter((id) => {
    const l = po.value.lines.find((x: PurchaseOrderLine) => x.id === id)
    return l ? isValidLine(l) : true
  })

  // For submitted POs, we allow all existing lines with IDs (since they're already valid)
  // For draft POs, we validate using isValidLine
  const validLines = isPoSubmitted.value
    ? po.value.lines.filter((line) => line.id) // Submitted: only existing lines with IDs
    : po.value.lines.filter(isValidLine) // Draft: full validation

  // Skip incomplete line validation for submitted POs (only job changes allowed)
  if (!isPoSubmitted.value) {
    const incompleteLines = po.value.lines.filter((line) => {
      const hasContent =
        (line.item_code && line.item_code.trim() !== '') ||
        (line.description && line.description.trim() !== '')
      return hasContent && !isValidLine(line)
    })

    if (incompleteLines.length > 0) {
      const missingPrices = incompleteLines.filter(
        (line) => (!line.unit_cost || line.unit_cost <= 0) && !line.price_tbc,
      )

      if (missingPrices.length > 0) {
        toast.error(
          `${missingPrices.length} line(s) missing price information. Please set unit cost or mark as TBC.`,
        )
        return
      }
    }
  }

  if (!validLines.length && !linesToDelete.value.length) {
    debugLog('No valid lines or deletes to save')
    return
  }

  const changedLines = validLines.filter(lineChanged)

  if (!changedLines.length && !linesToDelete.value.length) {
    debugLog('No changes detected - skipping save')
    return
  }

  debugLog('Saving lines...', {
    isSubmitted: isPoSubmitted.value,
    validLines: validLines.length,
    changedLines: changedLines.length,
    toDelete: linesToDelete.value.length,
    changedLinesDetails: changedLines.map((l) => ({ id: l.id, job_id: l.job_id })),
  })

  // Transform lines to match API schema requirements
  const transformedLines = changedLines.map((line) => {
    const sanitizedId =
      line.id && typeof line.id === 'string' && line.id.trim() !== '' ? line.id : null

    // If PO is submitted, only send job_id and id (minimal update)
    if (isPoSubmitted.value) {
      const transformed = {
        id: sanitizedId, // Explicitly preserve the ID
        job_id: line.job_id && line.job_id.trim() !== '' ? line.job_id : null,
      }

      debugLog('Transformed line (submitted PO - job only):', {
        hasId: !!transformed.id,
        id: transformed.id,
        job_id: transformed.job_id,
      })

      return transformed
    }

    // For draft/other statuses, send all fields
    const transformed = {
      id: sanitizedId, // Explicitly preserve the ID
      job_id: line.job_id && line.job_id.trim() !== '' ? line.job_id : null,
      description: line.description,
      quantity: line.quantity,
      unit_cost: line.unit_cost,
      price_tbc: line.price_tbc,
      item_code: line.item_code || '',
      metal_type: line.metal_type || '',
      alloy: line.alloy || '',
      specifics: line.specifics || '',
      location: line.location || '',
      dimensions: line.dimensions || '',
    }

    debugLog('Transformed line (full):', {
      hasId: !!transformed.id,
      id: transformed.id,
      description: transformed.description?.substring(0, 20),
      dimensions: transformed.dimensions,
      hasAllFields: {
        dimensions: 'dimensions' in transformed,
        alloy: 'alloy' in transformed,
        specifics: 'specifics' in transformed,
        location: 'location' in transformed,
      },
    })

    return transformed
  })

  try {
    const linesToDeleteBackup = [...linesToDelete.value]

    await store.patch(orderId, {
      lines: transformedLines,
      lines_to_delete: linesToDelete.value.length ? linesToDelete.value : undefined,
    })

    linesToDelete.value = []

    const needsReload = changedLines.some((line) => !line.id) || linesToDeleteBackup.length > 0

    if (needsReload) {
      debugLog('Reloading PO after save to ensure consistency...')
      await load()
    } else {
      originalLines.value = JSON.parse(JSON.stringify(po.value.lines))
      debugLog('Updated original lines without reload')
    }

    toast.success('Lines saved')
  } catch (error) {
    debugLog('Error saving lines:', error)
    // Rollback on error
    po.value.lines = snapshot
    toast.error(
      'Failed to save lines. Changes have been reverted: ' +
        extractErrorMessage(error, 'Unknown error'),
    )
  }
}

async function syncWithXero() {
  if (isSyncing.value) return

  if (isPoDeleted.value) {
    toast.error('Cannot sync with Xero - this purchase order has been deleted')
    return
  }

  isSyncing.value = true
  toast.info('Syncing with Xero…', { id: 'po-sync-loading' })

  try {
    const data = await api.api_xero_create_purchase_order_create(undefined, {
      params: { purchase_order_id: orderId },
    })

    switch (true) {
      case data.success:
        if (data.online_url) po.value.online_url = data.online_url
        if (data.xero_id) po.value.xero_id = data.xero_id
        toast.dismiss('po-sync-loading')
        toast.success('Purchase Order synced with Xero successfully')
        debugLog('Xero sync successful:', data)
        break
      case data.error:
        toast.dismiss('po-sync-loading')
        const errorMessage = extractErrorMessage(data.error, 'Xero sync failed')
        toast.error(`Xero sync failed: ${errorMessage}`, createErrorToast())
        debugLog('Xero sync error:', data.error)
        break
      default:
        toast.dismiss('po-sync-loading')
        toast.error('Xero sync failed: Unknown response format', createErrorToast())
        debugLog('Xero sync unexpected response:', data)
    }
  } catch (err: unknown) {
    toast.dismiss('po-sync-loading')
    const errorMessage = extractErrorMessage(err, 'Sync failed')
    toast.error(`Xero sync failed: ${errorMessage}`, createErrorToast())
  } finally {
    isSyncing.value = false
  }
}

function viewInXero() {
  if (!po.value.online_url) {
    toast.error('No Xero URL available. Please sync with Xero first.')
    return
  }

  try {
    window.open(po.value.online_url, '_blank', 'noopener,noreferrer')
    toast.success('Opened Purchase Order in Xero')
  } catch (error) {
    debugLog('Failed to open Xero URL:', error)
    toast.error('Failed to open Xero. Please check if pop-ups are blocked.')
  }
}

function printPo() {
  showPdfDialog.value = true
}

function emailPo() {
  if (isPoDeleted.value) {
    toast.error('Cannot email - this purchase order has been deleted')
    return
  }
  emailPurchaseOrder()
}

async function resolveSupplierEmail(): Promise<string | null> {
  const supplierId = po.value.supplier_id
  if (!supplierId) {
    return null
  }

  if (supplierEmailCache.value[supplierId] !== undefined) {
    return supplierEmailCache.value[supplierId]
  }

  try {
    const contacts = await api.clients_contacts_list({
      queries: { client_id: supplierId },
    })

    const contactsArray: ClientContact[] = Array.isArray(contacts) ? contacts : []
    const primaryContact = contactsArray.find((contact) => contact.is_primary && !!contact.email)
    const fallbackContact = contactsArray.find((contact) => !!contact.email)
    const resolvedEmail = primaryContact?.email ?? fallbackContact?.email ?? null

    supplierEmailCache.value = {
      ...supplierEmailCache.value,
      [supplierId]: resolvedEmail,
    }

    return resolvedEmail
  } catch (err) {
    debugLog('Failed to resolve supplier contacts for email:', err)
    supplierEmailCache.value = {
      ...supplierEmailCache.value,
      [supplierId]: null,
    }
    return null
  }
}

async function emailPurchaseOrder() {
  if (isPoDeleted.value) {
    toast.error('Cannot email - this purchase order has been deleted')
    return
  }
  try {
    toast.info('Preparing email...', { id: 'po-email-loading' })

    const recipientEmail = await resolveSupplierEmail()
    const emailData: PurchaseOrderEmailResponse = await store.emailPurchaseOrder(
      orderId,
      recipientEmail ?? undefined,
    )

    if (!emailData.success) {
      throw new Error(emailData.message || 'Failed to prepare email')
    }

    const recipientAddress =
      recipientEmail ?? (emailData as PurchaseOrderEmailResponseWithLegacy).email ?? ''
    if (!recipientAddress) {
      toast.warning(
        'No supplier email could be resolved. Please enter the recipient address manually inside Gmail.',
      )
    }

    openGmailCompose({
      to: recipientAddress,
      subject: emailData.email_subject || `Purchase Order ${po.value.po_number || orderId}`,
      body: emailData.email_body || '',
    })

    toast.dismiss('po-email-loading')
    toast.success('Gmail opened with the prepared draft')
  } catch (error) {
    toast.dismiss('po-email-loading')
    const errorMessage = extractErrorMessage(error, 'Failed to prepare email')
    toast.error(`Email failed: ${errorMessage}`, createErrorToast())
    debugLog('Error preparing email:', error)
  }
}

async function close() {
  if (isCreateMode.value) {
    persistCreateDraft()
    toast.success('Draft saved locally')
    router.push('/purchasing/po')
    return
  }

  if (isPoDeleted.value) {
    debugLog('Closing without save - PO is deleted')
    router.push('/purchasing/po')
    return
  }

  let hasAuthError = false

  try {
    debugLog('Closing PO form - triggering autosave...')

    // Clear any pending debounce timers to force immediate save
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
      debugLog('Cleared pending autosave timer for immediate save')
    }

    // Always try to save lines (function will check for actual changes internally)
    debugLog('Saving line changes before close...')
    await saveLines()

    // Always try to save summary to ensure consistency
    debugLog('Saving summary changes before close...')
    await saveSummary()

    debugLog('Autosave completed, navigating to PO list')
    toast.success('Changes saved automatically')
  } catch (error) {
    debugLog('Error during autosave on close:', error)

    // Check if it's an authentication error
    const possibleErrorObject = typeof error === 'object' && error !== null ? error : null
    const responseStatus =
      possibleErrorObject && 'response' in possibleErrorObject
        ? (possibleErrorObject as { response?: { status?: number } }).response?.status
        : undefined
    const messageValue =
      typeof error === 'string'
        ? error
        : possibleErrorObject && 'message' in possibleErrorObject
          ? (possibleErrorObject as { message?: unknown }).message
          : undefined
    const messageText = typeof messageValue === 'string' ? messageValue : undefined

    const isAuthError = responseStatus === 401 || messageText?.includes('auth')

    if (isAuthError) {
      debugLog('Authentication error detected during save')
      toast.error('Session expired. Please login again.')
      hasAuthError = true
      return
    }

    toast.error('Failed to save changes: ' + extractErrorMessage(error, 'Unknown error'))
    // Still navigate to PO list even if save fails (non-auth errors)
  } finally {
    // Always navigate back to PO list unless there was an auth error
    if (!hasAuthError) {
      debugLog('Navigating to purchase orders list')
      router.push('/purchasing/po')
    }
  }
}

const canSync = computed(() => {
  if (isCreateMode.value) return false
  if (!po.value.supplier_has_xero_id) return false

  return po.value.lines.some(
    (l: PurchaseOrderLine) => l.description && l.unit_cost !== null && l.unit_cost !== undefined,
  )
})

const isReloading = ref(false)
const isDeletingLine = ref(false)
const isEditingAdditionalFields = ref(false)

const handleReceiptSave = async (payload: {
  lineId: string
  editorState: {
    rows: {
      target: 'job' | 'stock'
      job_id?: string
      quantity: number
      retail_rate?: number
      stock_location?: string
    }[]
  }
}) => {
  if (!po.value) return

  const allowedStatuses = [
    'submitted',
    'submitted_to_supplier',
    'partially_received',
    'fully_received',
  ]

  const currentStatus = po.value.status ?? 'draft'

  if (!allowedStatuses.includes(currentStatus)) {
    toast.error('The purchase order must be sent to the supplier before creating receipts')
    return
  }

  const lineId = payload.lineId
  const newRows = payload.editorState.rows

  if (!lineId || lineId === 'undefined') {
    debugLog('Invalid lineId:', lineId)
    return
  }

  const validNewRows = newRows.filter((r) => {
    const quantity = Number(r.quantity) || 0
    const hasValidJobId = r.target === 'stock' ? !!stockHoldingJobId.value : !!r.job_id
    return quantity > 0 && hasValidJobId
  })

  // Maps NEW allocations received from the publisher to the API format.
  const newApiAllocations: DeliveryAllocation[] = validNewRows.map((r) => {
    const isStock = r.target === 'stock'
    return {
      job_id: isStock ? (stockHoldingJobId.value as string) : (r.job_id as string),
      quantity: Number(r.quantity) || 0,
    }
  })

  if (newApiAllocations.length === 0) {
    debugLog('No valid allocations to save.')
    return
  }

  const byJob: Record<string, number> = {}
  for (const a of newApiAllocations) {
    byJob[a.job_id] = (byJob[a.job_id] ?? 0) + a.quantity
  }
  const consolidated: DeliveryAllocation[] = Object.entries(byJob).map(([job_id, quantity]) => ({
    job_id,
    quantity,
  }))

  // Validate against remaining quantity
  const ordered = po.value.lines.find((l) => l.id === lineId)?.quantity ?? 0
  const already = po.value.lines.find((l) => l.id === lineId)?.received_quantity ?? 0
  const remaining = Math.max(0, ordered - already)
  const totalNew = consolidated.reduce((s, a) => s + a.quantity, 0)
  if (totalNew > remaining) {
    toast.error('Allocation exceeds remaining quantity for this line')
    return
  }

  const map: Record<string, DeliveryAllocation[]> = { [lineId]: consolidated }
  const request = transformDeliveryReceiptForAPI(po.value.id, map)

  try {
    debugLog('Saving receipt for line:', lineId, 'with NEW allocations:', consolidated)
    await receiptStore.submitDeliveryReceipt(po.value.id, request.allocations)
    toast.success('Receipt saved')

    await Promise.all([load(), loadExistingAllocations()])
    await updatePoStatusAfterReceipt()
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    debugLog('Error saving receipt:', err)

    // Check if this is a concurrency conflict (handled by the store)
    const isConcurrencyError =
      errorMessage.includes('412') ||
      errorMessage.includes('Precondition Failed') ||
      errorMessage.includes('(ETag mismatch)') ||
      errorMessage.includes('updated elsewhere') ||
      errorMessage.includes('Data reloaded') ||
      errorMessage.includes('This purchase order was updated elsewhere')

    if (isConcurrencyError) {
      // Immediately reload allocations to show latest data
      await loadExistingAllocations()
      await load()

      // Concurrency errors are handled by the store with toast and reload
      // Just set up the retry listener
      const unsubscribe = onPoConcurrencyRetry(po.value.id, async () => {
        unsubscribe() // Clean up listener
        try {
          await receiptStore.submitDeliveryReceipt(po.value.id, request.allocations)
          toast.success('Receipt saved')
          await Promise.all([load(), loadExistingAllocations()]) // Reload to show latest data
          await updatePoStatusAfterReceipt()
        } catch (retryErr) {
          toast.error('Retry failed. Please try again.')
          debugLog('Retry failed:', retryErr)
        }
      })
    } else {
      // Only show generic error if it's not a concurrency conflict
      if (!errorMessage.includes('not a valid UUID') && !errorMessage.includes('validation')) {
        toast.error('Failed to save receipt')
      }
    }
  }
}

const updatePoStatusAfterReceipt = async () => {
  if (!po.value) return

  try {
    // Calculate if PO is fully or partially received
    let totalOrdered = 0
    let totalReceived = 0

    for (const line of po.value.lines) {
      totalOrdered += line.quantity || 0
      totalReceived += line.received_quantity || 0
    }

    // Determine new status (backend-only statuses)
    const currentStatus = (
      po.value.status === 'local_draft' || !po.value.status ? 'draft' : po.value.status
    ) as BackendPurchaseOrderStatus
    let newStatus: BackendPurchaseOrderStatus = currentStatus
    if (totalReceived >= totalOrdered) {
      // Block fully_received if there are TBC items
      if (hasUnknownCosts.value) {
        toast.error(
          'Cannot mark as fully received until all costs are known. Please untick "Price TBC" on all line items first.',
        )
        newStatus = 'partially_received'
      } else {
        newStatus = 'fully_received'
      }
    } else if (totalReceived > 0) {
      newStatus = 'partially_received'
    }

    // Update status if it changed
    if (newStatus !== currentStatus) {
      await store.patch(orderId, { status: newStatus })
      po.value.status = newStatus
      toast.success(`Purchase order status updated to ${newStatus.replace('_', ' ')}`)
    }
  } catch (err) {
    debugLog('Error updating PO status after receipt:', err)
    // Don't show error toast for this as the receipt was successful
  }
}

const handleAllocationDeleted = async (data: { allocationId: string; allocationType: string }) => {
  debugLog('Allocation deleted:', data)

  // Reload allocations and PO data to reflect changes
  await Promise.all([load(), loadExistingAllocations()])

  // Show success message
  toast.success('Allocation deleted successfully')
}

onMounted(async () => {
  try {
    if (isCreateMode.value) {
      restoreCreateDraft()
      ensureCreateDraft()
      await Promise.all([xeroItemStore.fetchItems(), fetchJobs(), refreshLastPoNumber()])
    } else {
      await Promise.all([
        xeroItemStore.fetchItems(),
        fetchJobs(),
        load(),
        loadJobsForReceipt(),
        loadExistingAllocations(),
      ])
    }
  } catch (err) {
    debugLog('Error during component initialization:', err)
  }

  watch(
    () => [po.value.reference, po.value.expected_delivery, po.value.pickup_address_id],
    () => {
      if (isCreateMode.value) {
        persistCreateDraft()
      }
    },
    { deep: true },
  )

  watch(
    () => po.value.lines,
    (newLines, oldLines) => {
      if (
        isReloading.value ||
        isDeletingLine.value ||
        isEditingAdditionalFields.value ||
        isSavingReceipt.value
      ) {
        debugLog(
          '⏸️ Skipping autosave - reloading:',
          isReloading.value,
          'deleting:',
          isDeletingLine.value,
          'editing additional fields:',
          isEditingAdditionalFields.value,
        )
        return
      }

      if (!newLines || newLines.length === 0) {
        debugLog('Skipping autosave - no lines to save')
        return
      }

      if (po.value.status !== 'draft' && oldLines) {
        const jobChanges = newLines.some((newLine, index) => {
          const oldLine = oldLines[index]
          return oldLine && newLine.job_id !== oldLine.job_id
        })

        if (jobChanges) {
          toast.warning(
            'Warning: Changing job assignments on a non-draft purchase order may affect cost tracking',
          )
        }
      }

      debugLog('Lines changed, scheduling autosave in 500ms')
      if (debounceTimer) {
        clearTimeout(debounceTimer)
        debugLog('Cleared previous timer')
      }
      debounceTimer = setTimeout(() => {
        debugLog('Executing scheduled autosave')
        saveLines()
      }, 500)
    },
    { deep: true, flush: 'post' },
  )

  watch(
    () => [po.value.supplier, po.value.supplier_id],
    (newVals, oldVals) => {
      if (isCreateMode.value) {
        persistCreateDraft()
        return
      }
      if (newVals[0] && (newVals[0] !== oldVals?.[0] || newVals[1] !== oldVals?.[1])) {
        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(async () => {
          try {
            await store.patch(orderId, {
              supplier_id: po.value.supplier_id ?? null,
            })
            toast.success('Supplier updated')
            await load()
          } catch (error) {
            const errorMessage = extractErrorMessage(error, 'Failed to update supplier')
            toast.error(`Update failed: ${errorMessage}`)
          }
        }, 1000)
      }
    },
    { deep: true },
  )
})
</script>
