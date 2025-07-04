<template>
  <AppLayout>
    <div class="p-4 md:p-8 flex flex-col gap-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-bold flex items-center gap-2">
          <Package class="w-6 h-6 text-indigo-600" />
          Delivery Receipt - PO {{ purchaseOrder?.po_number || 'Loading...' }}
        </h1>
        <div class="flex gap-2">
          <Button variant="outline" @click="goBack">
            <ArrowLeft class="w-4 h-4 mr-2" />
            Back to List
          </Button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center py-8">
        <div class="text-gray-600">Loading purchase order...</div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-red-800">{{ error }}</p>
        <Button @click="loadData" class="mt-2" variant="outline" size="sm"> Try Again </Button>
      </div>

      <!-- Main Content -->
      <div v-else-if="purchaseOrder" class="flex flex-col gap-6">
        <!-- PO Summary -->
        <Card>
          <CardHeader>
            <h2 class="font-semibold">Purchase Order Details</h2>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span class="font-medium text-gray-600">Supplier:</span>
                <div>{{ purchaseOrder.supplier }}</div>
              </div>
              <div>
                <span class="font-medium text-gray-600">Order Date:</span>
                <div>{{ formatDate(purchaseOrder.order_date) }}</div>
              </div>
              <div>
                <span class="font-medium text-gray-600">Status:</span>
                <div>{{ purchaseOrder.status }}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Action Buttons -->
        <div class="flex justify-between items-center">
          <div class="flex gap-2">
            <Button
              @click="moveSelectedToPending"
              :disabled="selectedReceivedLines.length === 0"
              variant="outline"
              size="sm"
            >
              <ArrowUp class="w-4 h-4 mr-2" />
              Move Selected to Pending
            </Button>
            <Button
              @click="moveAllToPending"
              :disabled="receivedLines.length === 0"
              variant="outline"
              size="sm"
            >
              <ArrowUpToLine class="w-4 h-4 mr-2" />
              Move All to Pending
            </Button>
          </div>
          <div class="flex gap-2">
            <Button
              @click="moveSelectedToReceived"
              :disabled="selectedPendingLines.length === 0"
              variant="outline"
              size="sm"
            >
              <ArrowDown class="w-4 h-4 mr-2" />
              Move Selected to Received
            </Button>
            <Button
              @click="moveAllToReceived"
              :disabled="pendingLines.length === 0"
              variant="outline"
              size="sm"
            >
              <ArrowDownToLine class="w-4 h-4 mr-2" />
              Move All to Received
            </Button>
          </div>
        </div>

        <!-- Tables Container -->
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <!-- Pending Items -->
          <Card class="flex flex-col">
            <CardHeader>
              <h2 class="font-semibold">Pending Items ({{ pendingLines.length }})</h2>
            </CardHeader>
            <CardContent class="flex-1">
              <PendingItemsTable
                :lines="pendingLines"
                :selected-lines="selectedPendingLines"
                @update:selected-lines="selectedPendingLines = $event"
                @move-selected-to-received="moveSelectedToReceived"
                @move-all-to-received="moveAllToReceived"
              />
            </CardContent>
          </Card>

          <!-- Received Items -->
          <Card class="flex flex-col">
            <CardHeader>
              <h2 class="font-semibold">Received Items ({{ receivedLines.length }})</h2>
            </CardHeader>
            <CardContent class="flex-1">
              <ReceivedItemsTable
                :lines="receivedLines"
                :selected-lines="selectedReceivedLines"
                :jobs="availableJobs"
                :stock-holding-job="stockHoldingJob"
                @update:selected-lines="selectedReceivedLines = $event"
                @update:line="updateReceivedLine"
                @move-selected-to-pending="moveSelectedToPending"
                @move-all-to-pending="moveAllToPending"
              />
            </CardContent>
          </Card>
        </div>

        <!-- Save Actions -->
        <div class="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" @click="goBack"> Cancel </Button>
          <Button @click="saveChanges" :disabled="!hasChanges || isSaving" class="min-w-32">
            <div v-if="isSaving" class="flex items-center">
              <div
                class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"
              ></div>
              Saving...
            </div>
            <div v-else>Save Changes</div>
          </Button>
        </div>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <div
      v-if="successMessage"
      class="fixed top-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg z-50"
    >
      <div class="flex items-center">
        <CheckCircle class="w-5 h-5 text-green-600 mr-2" />
        <span class="text-green-800">{{ successMessage }}</span>
      </div>
    </div>

    <div
      v-if="errorMessage"
      class="fixed top-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg z-50"
    >
      <div class="flex items-center">
        <XCircle class="w-5 h-5 text-red-600 mr-2" />
        <span class="text-red-800">{{ errorMessage }}</span>
      </div>
    </div>
  </AppLayout>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PendingItemsTable from '@/components/purchasing/PendingItemsTable.vue'
import ReceivedItemsTable from '@/components/purchasing/ReceivedItemsTable.vue'
import {
  Package,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ArrowUpToLine,
  ArrowDownToLine,
  CheckCircle,
  XCircle,
} from 'lucide-vue-next'
import {
  useDeliveryReceiptStore,
  type PurchaseOrder,
  type PurchaseOrderLine,
  type DeliveryReceiptData,
  type AllocationData,
} from '@/stores/deliveryReceiptStore'

interface PendingLine extends PurchaseOrderLine {
  selected?: boolean
}

interface ReceivedLine extends PurchaseOrderLine {
  selected?: boolean
  total_received: number
  job_allocation: number
  stock_allocation: number
  allocated_job_id: string
  retail_rate: number
}

const route = useRoute()
const router = useRouter()
const deliveryReceiptStore = useDeliveryReceiptStore()

// Reactive state
const isLoading = ref(true)
const isSaving = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const errorMessage = ref<string | null>(null)
const purchaseOrder = ref<PurchaseOrder | null>(null)
const pendingLines = ref<PendingLine[]>([])
const receivedLines = ref<ReceivedLine[]>([])
const selectedPendingLines = ref<string[]>([])
const selectedReceivedLines = ref<string[]>([])

// Computed properties
const availableJobs = computed(() => deliveryReceiptStore.allocatableJobs)
const stockHoldingJob = computed(() => deliveryReceiptStore.stockHoldingJob)

const hasChanges = computed(() => {
  return (
    receivedLines.value.length > 0 && receivedLines.value.some((line) => line.total_received > 0)
  )
})

// Helper functions
function formatDate(dateString: string): string {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString()
}

function clearMessages() {
  successMessage.value = null
  errorMessage.value = null
}

function showSuccess(message: string) {
  clearMessages()
  successMessage.value = message
  setTimeout(() => {
    successMessage.value = null
  }, 3000)
}

function showError(message: string) {
  clearMessages()
  errorMessage.value = message
  setTimeout(() => {
    errorMessage.value = null
  }, 5000)
}

function goBack() {
  router.push({ name: 'delivery-receipts' })
}

function getRemainingQuantity(line: PurchaseOrderLine): number {
  return Math.max(0, line.quantity - line.received_quantity)
}

function createPendingLine(line: PurchaseOrderLine): PendingLine {
  return {
    ...line,
    selected: false,
  }
}

function createReceivedLine(line: PurchaseOrderLine): ReceivedLine {
  const remaining = getRemainingQuantity(line)
  const defaultJobId = availableJobs.value[0]?.id || ''

  return {
    ...line,
    selected: false,
    total_received: remaining,
    job_allocation: remaining,
    stock_allocation: 0,
    allocated_job_id: defaultJobId,
    retail_rate: 20,
  }
}

// Line management functions
function moveSelectedToReceived() {
  const linesToMove = pendingLines.value.filter((line) =>
    selectedPendingLines.value.includes(line.id),
  )

  for (const line of linesToMove) {
    const receivedLine = createReceivedLine(line)
    receivedLines.value.push(receivedLine)
  }

  pendingLines.value = pendingLines.value.filter(
    (line) => !selectedPendingLines.value.includes(line.id),
  )

  selectedPendingLines.value = []
}

function moveAllToReceived() {
  for (const line of pendingLines.value) {
    const receivedLine = createReceivedLine(line)
    receivedLines.value.push(receivedLine)
  }

  pendingLines.value = []
  selectedPendingLines.value = []
}

function moveSelectedToPending() {
  const linesToMove = receivedLines.value.filter((line) =>
    selectedReceivedLines.value.includes(line.id),
  )

  for (const line of linesToMove) {
    const pendingLine = createPendingLine(line)
    pendingLines.value.push(pendingLine)
  }

  receivedLines.value = receivedLines.value.filter(
    (line) => !selectedReceivedLines.value.includes(line.id),
  )

  selectedReceivedLines.value = []
}

function moveAllToPending() {
  for (const line of receivedLines.value) {
    const pendingLine = createPendingLine(line)
    pendingLines.value.push(pendingLine)
  }

  receivedLines.value = []
  selectedReceivedLines.value = []
}

function updateReceivedLine(lineId: string, field: string, value: unknown) {
  const lineIndex = receivedLines.value.findIndex((line) => line.id === lineId)
  if (lineIndex === -1) return

  const line = receivedLines.value[lineIndex]
  const remaining = getRemainingQuantity(line)

  // Update the field
  if (typeof field === 'string') {
    ;(line as Record<string, unknown>)[field] = value
  }

  // Recalculate allocations quando total_received muda
  if (field === 'total_received') {
    const totalReceived = Math.min(Number(value), remaining)
    line.total_received = totalReceived
    if (totalReceived === 0) {
      line.job_allocation = 0
      line.stock_allocation = 0
    } else {
      line.job_allocation = totalReceived
      line.stock_allocation = 0
    }
  }

  // Ensure allocations don't exceed total received
  if (field === 'job_allocation' || field === 'stock_allocation') {
    const maxAllocation = line.total_received
    line.job_allocation = Math.min(line.job_allocation, maxAllocation)
    line.stock_allocation = Math.min(line.stock_allocation, maxAllocation)

    // Ensure sum doesn't exceed total
    const sum = line.job_allocation + line.stock_allocation
    if (sum > maxAllocation) {
      if (field === 'job_allocation') {
        line.stock_allocation = maxAllocation - line.job_allocation
      } else {
        line.job_allocation = maxAllocation - line.stock_allocation
      }
    }
  }
}

function validateReceiptData(): string | null {
  for (const line of receivedLines.value) {
    const remaining = getRemainingQuantity(line)

    if (line.total_received <= 0) {
      return `Line "${line.description}" has zero or negative received quantity`
    }

    if (line.total_received > remaining) {
      return `Line "${line.description}" received quantity (${line.total_received}) exceeds remaining quantity (${remaining})`
    }

    const totalAllocated = line.job_allocation + line.stock_allocation
    if (totalAllocated !== line.total_received) {
      return `Line "${line.description}" allocations (${totalAllocated}) don't match total received (${line.total_received})`
    }

    if (line.job_allocation > 0 && !line.allocated_job_id) {
      return `Line "${line.description}" has job allocation but no job selected`
    }
  }

  return null
}

async function saveChanges() {
  if (!purchaseOrder.value) return

  const validationError = validateReceiptData()
  if (validationError) {
    showError(validationError)
    return
  }

  isSaving.value = true
  clearMessages()

  try {
    // Build receipt data
    const receiptData: DeliveryReceiptData = {}

    for (const line of receivedLines.value) {
      const allocations: AllocationData[] = []

      if (line.job_allocation > 0) {
        allocations.push({
          job_id: line.allocated_job_id,
          quantity: line.job_allocation,
          retail_rate: line.retail_rate,
        })
      }

      if (line.stock_allocation > 0 && stockHoldingJob.value) {
        allocations.push({
          job_id: stockHoldingJob.value.id,
          quantity: line.stock_allocation,
          retail_rate: line.retail_rate,
        })
      }

      receiptData[line.id] = {
        total_received: line.total_received,
        allocations,
      }
    }

    await deliveryReceiptStore.submitDeliveryReceipt(purchaseOrder.value.id, receiptData)

    showSuccess('Delivery receipt saved successfully!')

    // Redirect after a brief delay
    setTimeout(() => {
      goBack()
    }, 1500)
  } catch (err) {
    const errorMsg =
      err &&
      typeof err === 'object' &&
      'response' in err &&
      err.response &&
      typeof err.response === 'object' &&
      'data' in err.response &&
      err.response.data &&
      typeof err.response.data === 'object' &&
      'error' in err.response.data
        ? (err.response.data.error as string)
        : 'Failed to save delivery receipt'
    console.error('Error saving delivery receipt:', err)
    showError(errorMsg)
  } finally {
    isSaving.value = false
  }
}

async function loadData() {
  const poId = route.params.poId as string
  if (!poId) {
    error.value = 'Purchase Order ID is required'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    // Load PO and jobs in parallel
    const [po] = await Promise.all([
      deliveryReceiptStore.fetchPurchaseOrder(poId),
      deliveryReceiptStore.fetchJobs(),
    ])

    purchaseOrder.value = po

    // Initialize pending lines with all PO lines that have remaining quantity
    pendingLines.value = po.lines
      .filter((line) => getRemainingQuantity(line) > 0)
      .map(createPendingLine)

    receivedLines.value = []
    selectedPendingLines.value = []
    selectedReceivedLines.value = []
  } catch (err) {
    const errorMsg =
      err &&
      typeof err === 'object' &&
      'response' in err &&
      err.response &&
      typeof err.response === 'object' &&
      'data' in err.response &&
      err.response.data &&
      typeof err.response.data === 'object' &&
      'error' in err.response.data
        ? (err.response.data.error as string)
        : 'Failed to load purchase order'
    console.error('Error loading data:', err)
    error.value = errorMsg
  } finally {
    isLoading.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadData()
})

// Clear messages when navigating away
watch(
  () => route.path,
  () => {
    clearMessages()
  },
)
</script>
