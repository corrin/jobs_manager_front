<template>
  <div class="job-actual-tab h-full grid grid-rows-[auto_1fr] gap-4">
    <!-- HEADER COM KPIs COMPACTOS -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">
          Actual Costs
          <span v-if="isLoading" class="ml-2 text-sm text-gray-500">Loading...</span>
        </h2>
        <p class="text-sm text-gray-500">
          View and add actual costs from stock consumption and adjustments
        </p>
      </div>

      <!-- KPIs como chips (uma linha, densos) -->
      <ul class="hidden xl:flex items-center gap-2 shrink-0">
        <li class="h-10 px-3 rounded-lg border border-slate-200 bg-white flex items-center gap-2">
          <span class="w-1.5 h-6 rounded-full bg-blue-500"></span>
          <span class="text-[11px] uppercase tracking-wide text-slate-600">Estimate</span>
          <strong class="tabular-nums text-slate-900">{{
            finances.formatCurrency(finances.estimateTotal.value)
          }}</strong>
        </li>
        <li class="h-10 px-3 rounded-lg border border-slate-200 bg-white flex items-center gap-2">
          <span class="w-1.5 h-6 rounded-full bg-emerald-500"></span>
          <span class="text-[11px] uppercase tracking-wide text-slate-600">Time & Expenses</span>
          <strong class="tabular-nums text-slate-900">{{
            finances.formatCurrency(finances.timeAndExpenses.value)
          }}</strong>
        </li>
        <li class="h-10 px-3 rounded-lg border border-slate-200 bg-white flex items-center gap-2">
          <span class="w-1.5 h-6 rounded-full bg-orange-500"></span>
          <span class="text-[11px] uppercase tracking-wide text-slate-600">Invoiced</span>
          <strong class="tabular-nums text-slate-900">{{
            finances.formatCurrency(finances.invoiceTotal.value)
          }}</strong>
        </li>
        <li class="h-10 px-3 rounded-lg border border-slate-200 bg-white flex items-center gap-2">
          <span class="w-1.5 h-6 rounded-full bg-violet-500"></span>
          <span class="text-[11px] uppercase tracking-wide text-slate-600">To Be Invoiced</span>
          <strong class="tabular-nums text-slate-900">{{
            finances.formatCurrency(finances.toBeInvoiced.value)
          }}</strong>
        </li>
      </ul>

      <div class="flex items-center gap-2">
        <ActualCostDropdown
          class="w-full"
          :disabled="isLoading"
          @add-material="handleAddMaterial"
          @add-adjustment="handleAddAdjustment"
        />
      </div>
    </div>

    <!-- CONTEÚDO: GRID COM ASIDE STICKY + MAIN -->
    <div class="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 min-h-0">
      <!-- ASIDE (STICKY): Summary + Invoices -->
      <aside class="space-y-4 lg:sticky lg:top-16 self-start">
        <div class="bg-white rounded-xl border border-slate-200">
          <div class="p-3 w-full">
            <CompactSummaryCard
              title="Actual Summary"
              class="w-full"
              :summary="props.actualSummaryFromBackend || actualSummary"
              :costLines="costLines"
              :isLoading="isLoading"
              :revision="revision"
              @expand="showDetailedSummary = true"
            />
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200">
          <Card class="border-0 shadow-none">
            <CardHeader class="pb-2">
              <CardTitle>Invoices</CardTitle>
              <CardDescription>Manage invoices for this job.</CardDescription>
            </CardHeader>
            <!-- altura limitada + scroll: elimina branco gigante -->
            <CardContent class="max-h-80 overflow-y-auto">
              <div
                v-if="finances.invoices.value.length === 0"
                class="text-center py-6 text-gray-500"
              >
                No invoices for this project
              </div>
              <Table v-else>
                <TableHeader>
                  <TableRow>
                    <TableHead>Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead class="text-right">Total</TableHead>
                    <TableHead class="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="invoice in finances.invoices.value" :key="invoice.id">
                    <TableCell class="font-medium">{{ invoice.number }}</TableCell>
                    <TableCell>{{ finances.formatDate(invoice.date) }}</TableCell>
                    <TableCell>
                      <Badge :variant="invoice.status === 'PAID' ? 'default' : 'secondary'">{{
                        invoice.status
                      }}</Badge>
                    </TableCell>
                    <TableCell class="text-right">{{
                      finances.formatCurrency(invoice.total_incl_tax)
                    }}</TableCell>
                    <TableCell class="text-right">
                      <div class="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          @click="finances.goToInvoiceOnXero(invoice.online_url)"
                          :disabled="!invoice.online_url"
                        >
                          <ExternalLink class="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          @click="finances.deleteInvoiceOnXero(invoice.xero_id)"
                          :disabled="!!finances.deletingInvoiceId.value"
                        >
                          <svg
                            v-if="finances.deletingInvoiceId.value === invoice.xero_id"
                            class="animate-spin h-4 w-4"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              class="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              stroke-width="4"
                            />
                            <path
                              class="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          <Trash2 v-else class="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter
              class="flex justify-center border-t pt-4"
              v-if="!props.jobData?.fully_invoiced"
            >
              <button
                @click="finances.createInvoice()"
                :disabled="finances.isCreatingInvoice.value"
                class="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 flex items-center gap-2"
              >
                <svg
                  v-if="finances.isCreatingInvoice.value"
                  class="animate-spin -ml-1 mr-1 h-4 w-4"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {{ finances.isCreatingInvoice.value ? 'Creating...' : 'Create Invoice' }}
              </button>
            </CardFooter>
          </Card>
        </div>
      </aside>

      <!-- MAIN (GRID) -->
      <main class="bg-white rounded-xl border border-slate-200 flex flex-col min-h-0">
        <div class="px-4 py-3 border-b border-slate-200">
          <h3 class="text-lg font-semibold text-gray-900">Actual Details</h3>
        </div>

        <!-- sem min-h gigante: deixa o container controlar a altura -->
        <div class="flex-1 min-h-0 overflow-auto">
          <div v-if="isLoading" class="h-full flex items-center justify-center text-gray-500 gap-2">
            <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading cost lines...</span>
          </div>

          <div
            v-else-if="!costLines || costLines.length === 0"
            class="h-full flex items-center justify-center"
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
            />
          </div>
        </div>
      </main>
    </div>

    <!-- DIALOGS -->
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

    <StockConsumptionModal
      v-if="showStockModal"
      @close="closeStockModal"
      @submit="submitStockConsumption"
    />
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
import { useFinances } from '../../composables/useFinances'
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

type Job = z.infer<typeof schemas.Job>

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
import { Card, CardHeader, CardFooter, CardContent, CardDescription, CardTitle } from '../ui/card'
import { ExternalLink, Trash2 } from 'lucide-vue-next'
import { Table, TableBody, TableHeader, TableRow, TableCell, TableHead } from '../ui/table'
import { Badge } from '../ui/badge'

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
  jobData?: Job
  actualSummaryFromBackend?: { cost: number; rev: number; hours: number; created?: string }
}>()

const emit = defineEmits<{
  'cost-line-changed': []
  'quote-created': []
  'quote-accepted': []
  'invoice-created': []
  'quote-deleted': []
  'invoice-deleted': []
}>()

// Initialize finances composable
const finances = useFinances(
  { jobData: props.jobData || null, jobId: props.jobId },
  {
    'quote-created': () => emit('quote-created'),
    'quote-accepted': () => emit('quote-accepted'),
    'invoice-created': () => emit('invoice-created'),
    'quote-deleted': () => emit('quote-deleted'),
    'invoice-deleted': () => emit('invoice-deleted'),
  },
)

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
    profitMargin: rev - cost,
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
      onClick: () => navigateToDeliveryReceipt(line.ext_refs.purchase_order_id as string),
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
      onClick: () => navigateToTimesheet(line.meta.staff_id as string, date),
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
