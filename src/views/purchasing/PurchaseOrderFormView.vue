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
          :show-actions="canEdit"
          :sync-enabled="canSync && canEdit"
          :supplier-readonly="!canEditSupplier"
          :class="{
            'opacity-75': isPoDeleted,
            'opacity-90': isPoSubmitted,
          }"
          @update:supplier="canEditSupplier ? (po.supplier = $event) : null"
          @update:supplier_id="canEditSupplier ? (po.supplier_id = $event) : null"
          @update:reference="canEdit ? (po.reference = $event) : null"
          @update:order_date="canEdit ? (po.order_date = $event) : null"
          @update:expected_delivery="canEdit ? (po.expected_delivery = $event) : null"
          @update:status="canEdit ? (po.status = $event) : null"
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
              :items="xeroItemStore.items"
              :jobs="jobs"
              :read-only="!canEditLineItems"
              @update:lines="canEditLineItems ? (po.lines = $event) : null"
              @add-line="handleAddLineEvent"
              @delete-line="deleteLine"
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

      <div class="flex flex-wrap gap-2 justify-end">
        <Button aria-label="Close" @click="close">Close</Button>
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
import { ref, watch, onMounted, computed } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PoSummaryCard from '@/components/purchasing/PoSummaryCard.vue'
import PoLinesTable from '@/components/purchasing/PoLinesTable.vue'
import PoPdfDialog from '@/components/purchasing/PoPdfDialog.vue'
import { useRoute, useRouter } from 'vue-router'
import { usePurchaseOrderStore } from '@/stores/purchaseOrderStore'
import { useXeroItemStore } from '@/stores/xeroItemStore'
import { extractErrorMessage, createErrorToast } from '@/utils/errorHandler'
import { toast } from 'vue-sonner'
import axios from 'axios'

type Status = 'draft' | 'submitted' | 'partially_received' | 'fully_received' | 'deleted'

interface PurchaseOrderLine {
  id?: string
  item_code: string
  description: string
  quantity: number
  unit_cost: number | null
  price_tbc: boolean
  job_id?: string // Job is now optional
  metal_type?: string
  alloy?: string
  specifics?: string
  location?: string
  dimensions?: string
}

interface PurchaseOrder {
  po_number: string
  supplier: string
  supplier_id?: string
  supplier_has_xero_id: boolean
  reference: string
  order_date: string
  expected_delivery: string
  status: Status
  lines: PurchaseOrderLine[]
  online_url?: string
  xero_id?: string
}

interface XeroSyncResponse {
  success: boolean
  error?: string
  is_incomplete_po?: boolean
  online_url?: string
  xero_id?: string
}

const route = useRoute()
const router = useRouter()
const orderId = route.params.id as string
const store = usePurchaseOrderStore()
const xeroItemStore = useXeroItemStore()
const originalLines = ref<PurchaseOrderLine[]>([])
const isSyncing = ref(false)
const showPdfDialog = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)
const jobs = ref<Job[]>([])
const isLoadingJobs = ref(false)

// Interface for Job optimized for purchasing with cost-related fields
interface Job {
  id: string
  job_number: string
  name: string
  client_name: string
  status: string
  charge_out_rate: number
  cost_set_id?: string
  cost_centre?: string
  budget_code?: string
  job_display_name?: string
}

const po = ref<PurchaseOrder>({
  po_number: '',
  supplier: '',
  supplier_id: undefined,
  supplier_has_xero_id: false,
  reference: '',
  order_date: '',
  expected_delivery: '',
  status: 'draft',
  lines: [],
})

const linesToDelete = ref<string[]>([])
let debounceTimer: ReturnType<typeof setTimeout> | null = null

// Computed property to check if PO is deleted
const isPoDeleted = computed(() => po.value.status === 'deleted')

// Computed property to check if PO is submitted to supplier
const isPoSubmitted = computed(() => po.value.status === 'submitted')

// Computed property to check if editing is allowed (not deleted and not submitted)
const canEdit = computed(() => !isPoDeleted.value && !isPoSubmitted.value)

// Computed property to check if supplier can be changed (not deleted and not submitted)
const canEditSupplier = computed(() => !isPoDeleted.value && !isPoSubmitted.value)

// Computed property to check if line items can be edited (not deleted and not submitted)
const canEditLineItems = computed(() => !isPoDeleted.value && !isPoSubmitted.value)

async function fetchJobs() {
  if (isLoadingJobs.value) return

  isLoadingJobs.value = true
  error.value = null

  try {
    console.log('📊 Loading jobs for purchase order...')
    // Use purchasing-specific endpoint for job data with cost information
    const response = await axios.get('/purchasing/rest/jobs/')
    console.log('📊 Raw response:', response)
    const rawJobs = response.data || []
    console.log('📊 Raw jobs data:', rawJobs)

    // Convert to format suitable for purchasing (with cost-related fields)
    const convertedJobs = rawJobs.map(
      (job: {
        id: string
        job_number: string
        name?: string
        job_name?: string
        client_name?: string
        charge_out_rate?: number
        status?: string
        job_display_name?: string
      }) => ({
        id: job.id,
        job_number: job.job_number,
        number: job.job_number, // For JobSelect component
        name: job.name || job.job_name || '',
        description: job.name || job.job_name || '', // For JobSelect component
        client_name: job.client_name || '',
        charge_out_rate: job.charge_out_rate || 0,
        status: job.status || 'active',
        job_display_name:
          job.job_display_name || `${job.job_number} - ${job.name || job.job_name || ''}`,
      }),
    )

    jobs.value = convertedJobs

    // Make jobs available globally for JobSelect component (legacy support)
    ;(window as unknown as Record<string, unknown>).purchasingJobs = convertedJobs

    if (jobs.value.length === 0) {
      toast.warning('No jobs available for purchase order creation')
    } else {
      console.log(`✅ Loaded ${jobs.value.length} jobs for purchase order`)
      console.log('🔧 First job sample:', jobs.value[0])
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load jobs'
    console.error('❌ Error loading jobs for purchasing:', err)
    toast.error(
      `Failed to load jobs: ${errorMessage}. Job selection is required for purchase orders.`,
    )

    // Set empty array on error to prevent undefined issues
    jobs.value = []
  } finally {
    isLoadingJobs.value = false
  }
}

async function load() {
  if (!orderId) {
    error.value = 'Purchase order ID is required'
    return
  }

  console.log('🔄 Loading PO data...')
  isLoading.value = true
  isReloading.value = true // Prevent watcher from triggering during reload
  error.value = null

  // Cancel any pending autosave to prevent conflicts
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
    console.log('⏰ Cancelled pending autosave during reload')
  }

  try {
    const data = await store.fetchOne(orderId)
    po.value = {
      ...data,
      lines: Array.isArray(data.lines) ? data.lines : [],
    }
    originalLines.value = JSON.parse(JSON.stringify(po.value.lines))

    console.log('✅ PO loaded successfully. Lines:', po.value.lines.length)

    // Show warning toast if PO is deleted
    if (po.value.status === 'deleted') {
      toast.warning('This purchase order has been deleted and cannot be edited', {
        duration: 5000,
        description: 'You can view the details but all editing functions are disabled.',
      })
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load purchase order'
    error.value = errorMessage
    console.error('Error loading purchase order:', err)

    // Navigate back to list if PO not found
    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      toast.error('Purchase order not found')
      setTimeout(() => {
        router.push('/purchasing')
      }, 2000)
    } else {
      toast.error(`Failed to load purchase order: ${errorMessage}`)
    }
  } finally {
    isLoading.value = false
    // Wait a bit before allowing watchers again to ensure data is settled
    setTimeout(() => {
      isReloading.value = false
      console.log('🔓 Reload complete, watchers re-enabled')
    }, 200) // Increased from 100ms to 200ms for more stability
  }
}

async function saveSummary() {
  if (isPoDeleted.value) {
    toast.error('Cannot save changes - this purchase order has been deleted')
    return
  }

  const updateData = {
    reference: po.value.reference,
    order_date: po.value.order_date,
    expected_delivery: po.value.expected_delivery,
    status: po.value.status,
  } as Record<string, unknown>

  // Include supplier data only if supplier changes are allowed (not submitted)
  if (canEditSupplier.value) {
    if (po.value.supplier) {
      updateData.supplier = po.value.supplier
    }
    if (po.value.supplier_id) {
      updateData.supplier_id = po.value.supplier_id
    }
  }

  await store.patch(orderId, updateData)
  toast.success('Summary saved')
  await load()
}

const handleAddLineEvent = () => {
  console.log('🎯 handleAddLineEvent triggered from PoLinesTable')
  console.log('🔑 canEditLineItems:', canEditLineItems.value)

  if (!canEditLineItems.value) {
    console.log('❌ Cannot edit line items - permission denied')
    return
  }

  addLine()
}

function addLine() {
  console.log('🏗️ addLine function called')
  console.log('📊 Current PO lines:', po.value.lines.length)
  console.log('🔒 Is PO deleted:', isPoDeleted.value)
  console.log('📤 Is PO submitted:', isPoSubmitted.value)

  if (isPoDeleted.value) {
    console.log('❌ Blocked: PO is deleted')
    toast.error('Cannot add lines - this purchase order has been deleted')
    return
  }
  if (isPoSubmitted.value) {
    console.log('❌ Blocked: PO is submitted')
    toast.error('Cannot add lines - this purchase order has been submitted to supplier')
    return
  }

  const newLine = {
    item_code: '',
    description: '',
    quantity: 1,
    unit_cost: 0,
    price_tbc: false,
    job_id: '', // Job is required but user must select one
    metal_type: undefined,
    alloy: undefined,
    specifics: undefined,
    location: undefined,
    dimensions: undefined,
  }

  console.log('➕ Adding new line:', newLine)

  try {
    po.value.lines = [...po.value.lines, newLine]
    console.log('✅ Line added successfully. New count:', po.value.lines.length)
  } catch (error) {
    console.error('❌ Error adding line:', error)
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

  console.log('🗑️ Deleting line:', idOrIdx)

  // Cancel any pending autosave
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
    console.log('⏰ Cancelled pending autosave timer')
  }

  isDeletingLine.value = true // Prevent autosave during deletion

  try {
    if (typeof idOrIdx === 'string') {
      // Find the line being deleted
      const lineToDelete = po.value.lines.find((l: PurchaseOrderLine) => l.id === idOrIdx)

      // Add to linesToDelete if the line has any meaningful content
      if (lineToDelete && hasAnyContent(lineToDelete)) {
        linesToDelete.value.push(idOrIdx)
        console.log('📝 Added line to delete list:', idOrIdx)
      }

      po.value.lines = po.value.lines.filter((l: PurchaseOrderLine) => l.id !== idOrIdx)
    } else {
      po.value.lines = po.value.lines.filter((_: PurchaseOrderLine, idx: number) => idx !== idOrIdx)
    }

    console.log('✅ Line deleted. Remaining lines:', po.value.lines.length)
  } finally {
    // Allow autosave again after a longer delay to prevent watcher activation
    setTimeout(() => {
      isDeletingLine.value = false
      console.log('🔓 Deletion flag cleared, autosave re-enabled')
    }, 500)
  }
}

function hasAnyContent(line: PurchaseOrderLine) {
  return (
    (line.item_code && line.item_code.trim() !== '') ||
    (line.description && line.description.trim() !== '') ||
    (line.unit_cost != null && Number(line.unit_cost) > 0) ||
    line.price_tbc === true ||
    line.quantity > 0 ||
    (line.job_id && line.job_id.trim() !== '')
  )
}

function lineChanged(line: PurchaseOrderLine) {
  // If line has no ID, it's a new line and should be saved
  if (!line.id) return true

  const orig = originalLines.value.find((o) => o.id === line.id)
  if (!orig) return true

  return (
    orig.item_code !== line.item_code ||
    orig.description !== line.description ||
    +orig.quantity !== +line.quantity ||
    +(orig.unit_cost ?? 0) !== +(line.unit_cost ?? 0) ||
    orig.price_tbc !== line.price_tbc ||
    orig.job_id !== line.job_id ||
    // Compare new additional fields
    orig.metal_type !== line.metal_type ||
    orig.alloy !== line.alloy ||
    orig.specifics !== line.specifics ||
    orig.location !== line.location ||
    orig.dimensions !== line.dimensions
  )
}

function isValidLine(line: PurchaseOrderLine) {
  // A line is valid if it has content AND price information
  const hasContent =
    (line.item_code && line.item_code.trim() !== '') ||
    (line.description && line.description.trim() !== '')

  // Don't save empty lines (no content)
  if (!hasContent) {
    return false
  }

  // If line has content, it must have price information
  const hasPrice = (line.unit_cost != null && Number(line.unit_cost) > 0) || line.price_tbc === true

  return hasPrice
}

async function saveLines() {
  if (isPoDeleted.value) {
    console.log('❌ Cannot save - PO is deleted')
    toast.error('Cannot save changes - this purchase order has been deleted')
    return
  }

  // Skip save if we're currently reloading or deleting
  if (isReloading.value || isDeletingLine.value) {
    console.log(
      '⏸️ Skipping save - reloading:',
      isReloading.value,
      'deleting:',
      isDeletingLine.value,
    )
    return
  }

  // Filter out lines that should be deleted (invalid lines with IDs)
  linesToDelete.value = linesToDelete.value.filter((id) => {
    const l = po.value.lines.find((x: PurchaseOrderLine) => x.id === id)
    return l ? isValidLine(l) : true
  })

  // Get valid lines that should be saved
  const validLines = po.value.lines.filter(isValidLine)

  // Get lines that have content but are missing required fields
  const incompleteLines = po.value.lines.filter((line) => {
    const hasContent =
      (line.item_code && line.item_code.trim() !== '') ||
      (line.description && line.description.trim() !== '')
    return hasContent && !isValidLine(line)
  })

  // Show specific error for incomplete lines
  if (incompleteLines.length > 0) {
    const missingPrices = incompleteLines.filter(
      (line) => (!line.unit_cost || Number(line.unit_cost) <= 0) && !line.price_tbc,
    )

    if (missingPrices.length > 0) {
      toast.error(
        `${missingPrices.length} line(s) missing price information. Please set unit cost or mark as TBC.`,
      )
      return
    }
  }

  // Only save if there are valid lines to save or lines to delete
  if (!validLines.length && !linesToDelete.value.length) {
    console.log('⏸️ No valid lines or deletes to save')
    return
  }

  // Only send changed lines to reduce payload
  const changedLines = validLines.filter(lineChanged)

  // Only make API call if there are actual changes
  if (!changedLines.length && !linesToDelete.value.length) {
    console.log('⏸️ No changes detected - skipping save')
    return
  }

  console.log('💾 Saving lines...', {
    validLines: validLines.length,
    changedLines: changedLines.length,
    toDelete: linesToDelete.value.length,
  })

  try {
    const linesToDeleteBackup = [...linesToDelete.value] // Backup before clearing

    await store.patch(orderId, {
      lines: changedLines,
      lines_to_delete: linesToDelete.value.length ? linesToDelete.value : undefined,
    })

    // Clear the delete list after successful save
    linesToDelete.value = []

    // Only reload if we saved lines with IDs or deleted lines
    // This prevents unnecessary reloads for simple field updates
    const needsReload = changedLines.some((line) => !line.id) || linesToDeleteBackup.length > 0

    if (needsReload) {
      console.log('🔄 Reloading PO after save to ensure consistency...')
      await load()
    } else {
      // Update originalLines to reflect saved state without full reload
      originalLines.value = JSON.parse(JSON.stringify(po.value.lines))
      console.log('✅ Updated original lines without reload')
    }

    toast.success('Lines saved')
  } catch (error) {
    console.error('❌ Error saving lines:', error)
    toast.error('Failed to save lines: ' + extractErrorMessage(error, 'Unknown error'))
  }
}

async function syncWithXero() {
  if (isSyncing.value) return

  if (isPoDeleted.value) {
    toast.error('Cannot sync with Xero - this purchase order has been deleted')
    return
  }

  isSyncing.value = true
  toast.loading('Syncing with Xero…', { id: 'po-sync-loading' })

  try {
    const { data: res } = await axios.post<XeroSyncResponse>(
      `/api/xero/create_purchase_order/${orderId}`,
    )

    switch (true) {
      case res.success:
        if (res.online_url) po.value.online_url = res.online_url
        if (res.xero_id) po.value.xero_id = res.xero_id
        toast.dismiss('po-sync-loading')
        toast.success('Synced with Xero successfully!')
        break
      case res.is_incomplete_po:
        toast.dismiss('po-sync-loading')
        toast.warning(res.error || 'Purchase order incomplete - missing required fields')
        break
      default:
        toast.dismiss('po-sync-loading')
        throw new Error(res.error || 'Unknown sync error')
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
    console.error('Failed to open Xero URL:', error)
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

async function emailPurchaseOrder() {
  if (isPoDeleted.value) {
    toast.error('Cannot email - this purchase order has been deleted')
    return
  }
  try {
    toast.loading('Preparing email...', { id: 'po-email-loading' })

    const emailData = await store.emailPurchaseOrder(orderId)

    if (emailData.success && emailData.mailto_url) {
      // Open Gmail compose in new tab
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailData.email)}&su=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`
      window.open(gmailUrl, '_blank', 'noopener,noreferrer')

      toast.dismiss('po-email-loading')
      toast.success(`Gmail opened for ${emailData.email}`)
    } else {
      toast.dismiss('po-email-loading')
      throw new Error(emailData.error || 'Failed to prepare email')
    }
  } catch (error) {
    toast.dismiss('po-email-loading')
    const errorMessage = extractErrorMessage(error, 'Failed to prepare email')
    toast.error(`Email failed: ${errorMessage}`, createErrorToast())
    console.error('Error preparing email:', error)
  }
}

function close() {
  router.back()
}

const canSync = computed(() => {
  if (!po.value.supplier_has_xero_id) return false

  return po.value.lines.some(
    (l: PurchaseOrderLine) => l.description && l.unit_cost !== null && l.unit_cost !== undefined,
  )
})

const isReloading = ref(false)
const isDeletingLine = ref(false)

onMounted(async () => {
  try {
    await Promise.all([xeroItemStore.fetchItems(), fetchJobs(), load()])
  } catch (err) {
    console.error('Error during component initialization:', err)
    // Error handling is already done in individual functions
  }

  watch(
    () => po.value.lines,
    (newLines, oldLines) => {
      // Skip autosave during reloading or deleting operations
      if (isReloading.value || isDeletingLine.value) {
        console.log(
          '⏸️ Skipping autosave - reloading:',
          isReloading.value,
          'deleting:',
          isDeletingLine.value,
        )
        return
      }

      // Don't autosave if there are no lines or if lines are empty
      if (!newLines || newLines.length === 0) {
        console.log('⏸️ Skipping autosave - no lines to save')
        return
      }

      // Check for job changes when status is not draft
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

      console.log('⏱️ Lines changed, scheduling autosave in 500ms')
      if (debounceTimer) {
        clearTimeout(debounceTimer)
        console.log('⏰ Cleared previous timer')
      }
      debounceTimer = setTimeout(() => {
        console.log('💾 Executing scheduled autosave')
        saveLines()
      }, 500)
    },
    { deep: true, flush: 'post' },
  )

  // Watch for supplier changes and auto-save
  watch(
    () => [po.value.supplier, po.value.supplier_id],
    (newVals, oldVals) => {
      // Only auto-save if values actually changed and we have a supplier name
      if (newVals[0] && (newVals[0] !== oldVals?.[0] || newVals[1] !== oldVals?.[1])) {
        // Debounce supplier changes
        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(async () => {
          try {
            await store.patch(orderId, {
              supplier: po.value.supplier,
              supplier_id: po.value.supplier_id,
            })
            toast.success('Supplier updated')
            // Reload to get updated supplier_has_xero_id status
            await load()
          } catch (error) {
            const errorMessage = extractErrorMessage(error, 'Failed to update supplier')
            toast.error(`Update failed: ${errorMessage}`)
          }
        }, 1000) // Longer debounce for supplier changes
      }
    },
    { deep: true },
  )
})
</script>
