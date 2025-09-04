<template>
  <div class="job-actual-tab h-full flex flex-col">
    <div class="flex-shrink-0 mb-6">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">
          Actual Costs
          <span v-if="isLoading" class="ml-2 text-sm text-gray-500">Loading...</span>
        </h2>
        <div class="flex items-center gap-4">
          <div class="text-sm text-gray-500">
            View and add actual costs from stock consumption and adjustments
          </div>
          <ActualCostDropdown
            :disabled="isLoading"
            @add-material="handleAddMaterial"
            @add-adjustment="handleAddAdjustment"
          />
        </div>
      </div>
    </div>

    <div class="flex-1 flex gap-6 min-h-0">
      <!-- Cost Lines Grid -->
      <div class="flex-1 bg-white rounded-lg border border-gray-200 flex flex-col">
        <div class="flex-shrink-0 p-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Actual Details</h3>
        </div>
        <div class="flex-1 overflow-hidden">
          <div v-if="isLoading" class="flex-1 flex items-center justify-center">
            <div class="flex items-center space-x-2 text-gray-500">
              <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Loading cost lines...</span>
            </div>
          </div>
          <div
            v-else-if="!costLines || costLines.length === 0"
            class="flex-1 flex items-center justify-center"
          >
            <div class="text-center py-8">
              <svg
                class="w-12 h-12 mx-auto mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p class="text-gray-500">No actual costs recorded yet</p>
            </div>
          </div>
          <div v-else>
            <SmartCostLinesTable
              :lines="costLines"
              tabKind="actual"
              :readOnly="true"
              :showItemColumn="false"
              :showSourceColumn="true"
              :sourceResolver="resolveSource"
              @delete-line="handleSmartDelete"
              @add-line="() => {}"
              @duplicate-line="() => {}"
              @move-line="() => {}"
              @create-line="() => {}"
            ></SmartCostLinesTable>
          </div>
        </div>
      </div>

      <div class="w-64 flex-shrink-0">
        <CompactSummaryCard
          title="Actual Summary"
          :summary="props.actualSummaryFromBackend || actualSummary"
          :costLines="costLines"
          :isLoading="isLoading"
          :revision="revision"
          @expand="showDetailedSummary = true"
        />
      </div>
    </div>

    <!-- Detailed Summary Dialog -->
    <Dialog :open="showDetailedSummary" @update:open="showDetailedSummary = $event">
      <DialogContent class="sm:max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Detailed Actual Summary</DialogTitle>
          <DialogDescription>Complete breakdown of actual costs and revenue</DialogDescription>
        </DialogHeader>
        <div class="max-h-[60vh] overflow-y-auto">
          <CostSetSummaryCard
            title="Actual Summary"
            :summary="props.actualSummaryFromBackend || actualSummary"
            :costLines="costLines"
            :isLoading="isLoading"
            :revision="revision"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showDetailedSummary = false">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Stock Consumption Modal -->
    <StockConsumptionModal
      v-if="showStockModal"
      @close="closeStockModal"
      @submit="submitStockConsumption"
    />

    <!-- Adjustment Modal -->
    <CostLineAdjustmentModal
      v-if="showAdjustmentModal"
      :initial="null"
      mode="create"
      @close="closeAdjustmentModal"
      @submit="submitAdjustment"
    />
  </div>
</template>

<script setup lang="ts">
import { debugLog } from '../../utils/debug'

import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import CostSetSummaryCard from '../shared/CostSetSummaryCard.vue'
import CompactSummaryCard from '../shared/CompactSummaryCard.vue'
import { fetchCostSet } from '../../services/costing.service'
import { costlineService } from '../../services/costline.service'
import { schemas } from '../../api/generated/api'
import { useSmartCostLineDelete } from '../../composables/useSmartCostLineDelete'
import { api } from '../../api/client'
import { z } from 'zod'
import ActualCostDropdown from './ActualCostDropdown.vue'
import StockConsumptionModal from './StockConsumptionModal.vue'
import CostLineAdjustmentModal from './CostLineAdjustmentModal.vue'
import SmartCostLinesTable from '../shared/SmartCostLinesTable.vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog'
import { Button } from '../ui/button'

type CostLine = z.infer<typeof schemas.CostLine>
type CostLineCreateUpdate = z.infer<typeof schemas.CostLineCreateUpdate>
type CostSet = z.infer<typeof schemas.CostSet>
type KanbanStaff = z.infer<typeof schemas.KanbanStaff>
type StockItem = z.infer<typeof schemas.StockItem>
type StockConsumeRequest = z.infer<typeof schemas.StockConsumeRequest>

// Type guard functions to safely access meta and ext_refs
function isDeliveryReceiptMeta(meta: unknown): meta is { source: string; po_number?: string } {
  return (
    typeof meta === 'object' &&
    meta !== null &&
    'source' in meta &&
    typeof (meta as Record<string, unknown>).source === 'string' &&
    (meta as Record<string, unknown>).source === 'delivery_receipt'
  )
}

function isTimesheetMeta(meta: unknown): meta is { staff_id: string; date?: string } {
  return (
    typeof meta === 'object' &&
    meta !== null &&
    'staff_id' in meta &&
    typeof (meta as Record<string, unknown>).staff_id === 'string'
  )
}

function isDeliveryReceiptExtRefs(extRefs: unknown): extRefs is { purchase_order_id: string } {
  return (
    typeof extRefs === 'object' &&
    extRefs !== null &&
    'purchase_order_id' in extRefs &&
    typeof (extRefs as Record<string, unknown>).purchase_order_id === 'string'
  )
}

function isStockExtRefs(extRefs: unknown): extRefs is { stock_id: string } {
  return (
    typeof extRefs === 'object' &&
    extRefs !== null &&
    'stock_id' in extRefs &&
    typeof (extRefs as Record<string, unknown>).stock_id === 'string'
  )
}

const props = defineProps<{
  jobId: string
  actualSummaryFromBackend?: { cost: number; rev: number; hours: number; created?: string }
}>()

const emit = defineEmits<{
  'cost-line-changed': []
}>()

const router = useRouter()

const costLines = ref<CostLine[]>([])
const staffMap = ref<Record<string, KanbanStaff>>({})
const isLoading = ref(false)
const revision = ref(0)
const showStockModal = ref(false)
const showAdjustmentModal = ref(false)
const showDetailedSummary = ref(false)

async function loadStaff() {
  try {
    const staff: KanbanStaff[] = await api.accounts_api_staff_all_list()
    staffMap.value = staff.reduce(
      (acc: Record<string, KanbanStaff>, s: KanbanStaff) => {
        acc[s.id] = s
        return acc
      },
      {} as Record<string, KanbanStaff>,
    )
  } catch (error) {
    debugLog('Failed to load staff data:', error)
  }
}

async function loadActualCosts() {
  isLoading.value = true
  try {
    const costSet: CostSet = await fetchCostSet(props.jobId, 'actual')

    costLines.value = costSet.cost_lines

    revision.value = costSet.rev || 0
  } catch (error) {
    debugLog('Failed to load actual cost lines:', error)
  } finally {
    isLoading.value = false
  }
}

// Use the smart delete composable
const { handleSmartDelete } = useSmartCostLineDelete({
  costLines,
  onCostLineChanged: () => emit('cost-line-changed'),
  isLoading,
})

onMounted(async () => {
  await Promise.all([loadStaff(), loadActualCosts()])
})

const actualSummary = computed(() => {
  if (props.actualSummaryFromBackend) {
    return props.actualSummaryFromBackend
  }

  let cost = 0
  let rev = 0
  let hours = 0

  for (const line of costLines.value) {
    const quantity = line.quantity || 0
    const unitCost = line.unit_cost || 0
    const unitRev = line.unit_rev || 0

    cost += quantity * unitCost
    rev += quantity * unitRev

    // Count hours for time entries
    if (line.kind === 'time') {
      hours += quantity
    }

    // For adjustments, the revenue calculation is already included above,
    // but we might want to handle them specially in the future
  }

  return {
    cost,
    rev,
    hours,
    created: undefined,
  }
})

function navigateToDeliveryReceipt(purchaseOrderId: string) {
  console.log('Received po id: ', purchaseOrderId)
  router.push({
    name: 'purchase-order-form',
    params: { id: purchaseOrderId },
  })
}

function navigateToTimesheet(staffId: string, date?: string) {
  const routeParams = {
    name: 'timesheet-entry',
    query: { staffId },
  } as { name: string; query: { staffId: string; date?: string } }

  if (date) {
    routeParams.query.date = date
  }

  router.push(routeParams)
}

// TODO: add better navigation flow with front-end path parameter to prepopulate the search bar with the stock name
function navigateToStock(/*stockId: string*/) {
  router.push({
    name: 'stock',
    // params: { stockId },
  })
}

// Resolver for Source column used by SmartCostLinesTable
function resolveSource(
  line: CostLine,
): { visible: boolean; label: string; onClick?: () => void } | null {
  // Material from Delivery Receipt
  if (
    String(line.kind) === 'material' &&
    isDeliveryReceiptMeta(line.meta) &&
    isDeliveryReceiptExtRefs(line.ext_refs)
  ) {
    const label = line.meta.po_number || 'Delivery Receipt'
    console.log('Line data: ', line)
    return {
      visible: true,
      label,
      onClick: () => navigateToDeliveryReceipt(line.ext_refs.purchase_order_id),
    }
  }

  // Material from Stock
  if (String(line.kind) === 'material' && isStockExtRefs(line.ext_refs)) {
    return {
      visible: true,
      label: 'Stock',
      onClick: () => navigateToStock(/* line.ext_refs.stock_id as string */),
    }
  }

  // Time from Timesheet
  if (String(line.kind) === 'time' && isTimesheetMeta(line.meta)) {
    const staffName = staffMap.value[line.meta.staff_id]?.display_name || 'Timesheet'
    const date = line.meta.date
    return {
      visible: true,
      label: staffName,
      onClick: () => navigateToTimesheet(line.meta.staff_id, date),
    }
  }

  // Adjustment entry
  if (String(line.kind) === 'adjust') {
    return { visible: true, label: 'Adjustment' }
  }

  // No source info
  return null
}

// Modal handlers
function handleAddMaterial() {
  showStockModal.value = true
}

function handleAddAdjustment() {
  showAdjustmentModal.value = true
}

function closeStockModal() {
  showStockModal.value = false
}

function closeAdjustmentModal() {
  showAdjustmentModal.value = false
}

async function submitStockConsumption(payload: {
  stockItem: StockItem
  quantity: number
  unit_cost: number
  unit_rev: number
}) {
  isLoading.value = true
  toast.info('Consuming stock...', { id: 'add-stock' })

  // Check if consuming more than available stock
  const isOverConsumption = payload.quantity > (payload.stockItem.quantity as number) // I'm asserting the type here because when comparing the quantity will never be null or undefined

  try {
    // The consumeStock endpoint automatically:
    // 1. Reduces stock quantity
    // 2. Creates "Consumed: " stock record with source = "stock"
    // 3. Creates cost line for the job
    const consumeRequest: StockConsumeRequest = {
      job_id: props.jobId,
      quantity: payload.quantity,
      unit_cost: payload.unit_cost,
      unit_rev: payload.unit_rev,
    }

    await api.consumeStock(consumeRequest, {
      params: { stock_id: payload.stockItem.id as string },
    })

    // Reload cost lines to show the automatically created cost line
    await loadActualCosts()

    // Show appropriate success message based on stock consumption
    if (isOverConsumption) {
      toast.success('Stock consumed successfully! Note: This resulted in negative inventory.', {
        duration: 6000,
      })
    } else {
      toast.success('Stock consumed successfully!')
    }

    emit('cost-line-changed')
    closeStockModal()
  } catch (error) {
    toast.error('Failed to consume stock.')
    debugLog('Failed to consume stock:', error)
  } finally {
    isLoading.value = false
    toast.dismiss('add-stock')
  }
}

async function submitAdjustment(payload: CostLine | CostLineCreateUpdate): Promise<void> {
  if (!payload || payload.kind !== 'adjust') return
  isLoading.value = true
  toast.info('Adding adjustment...', { id: 'add-adjustment' })
  try {
    const createPayload = {
      kind: 'adjust' as const,
      desc: payload.desc,
      quantity: payload.quantity,
      unit_cost: payload.unit_cost,
      unit_rev: payload.unit_rev,
      ext_refs: {
        source: 'manual_adjustment',
      },
      meta: {
        source: 'manual_adjustment',
      },
    }

    const created = await costlineService.createCostLine(props.jobId, 'actual', createPayload)
    costLines.value = [...costLines.value, created]
    toast.success('Adjustment added!')
    emit('cost-line-changed')
    closeAdjustmentModal()
  } catch (error) {
    toast.error('Failed to add adjustment.')
    debugLog('Failed to add adjustment:', error)
  } finally {
    isLoading.value = false
    toast.dismiss('add-adjustment')
  }
}
</script>
