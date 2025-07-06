<template>
  <div class="job-actual-tab h-full flex flex-col">
    <div class="flex-shrink-0 mb-6">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">
          Actual Costs
          <span v-if="isLoading" class="ml-2 text-sm text-gray-500">Loading...</span>
        </h2>
        <div class="text-sm text-gray-500">
          View only - costs from delivery receipts and timesheets
        </div>
      </div>
    </div>

    <div class="flex-1 flex gap-6 min-h-0">
      <!-- Left side: Cost Lines Grid -->
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
          <div v-else class="h-full overflow-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50 sticky top-0">
                <tr>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Kind
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Description
                  </th>
                  <th
                    class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Quantity
                  </th>
                  <th
                    class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Unit Cost
                  </th>
                  <th
                    class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Unit Rev
                  </th>
                  <th
                    class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Total Cost
                  </th>
                  <th
                    class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Total Rev
                  </th>
                  <th
                    class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Source
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="line in costLines" :key="line.id" class="hover:bg-gray-50">
                  <td class="px-4 py-4 whitespace-nowrap">
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="
                        line.kind === 'material'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      "
                    >
                      {{ line.kind === 'time' ? 'Labour' : 'Material' }}
                    </span>
                  </td>
                  <td class="px-4 py-4">
                    <div class="text-sm font-medium text-gray-900">{{ line.desc }}</div>
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {{ formatNumber(line.quantity) }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    ${{ formatCurrency(line.unit_cost) }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    ${{ formatCurrency(line.unit_rev) }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    ${{
                      formatCurrency(
                        line.total_cost || Number(line.quantity) * Number(line.unit_cost),
                      )
                    }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    ${{
                      formatCurrency(
                        line.total_rev || Number(line.quantity) * Number(line.unit_rev),
                      )
                    }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-center">
                    <!-- Material from Delivery Receipt -->
                    <button
                      v-if="
                        line.kind === 'material' &&
                        line.meta?.source === 'delivery_receipt' &&
                        line.ext_refs?.purchase_order_id
                      "
                      @click="navigateToDeliveryReceipt(line.ext_refs.purchase_order_id)"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-md text-sm font-medium transition-colors"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      {{ line.meta.po_number || 'Delivery Receipt' }}
                    </button>

                    <!-- Time from Timesheet -->
                    <button
                      v-else-if="line.kind === 'time' && line.meta?.staff_id"
                      @click="navigateToTimesheet(line.meta.staff_id, line.meta.date)"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-md text-sm font-medium transition-colors"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {{ staffMap[line.meta.staff_id]?.name || 'Timesheet' }}
                    </button>

                    <!-- No source info -->
                    <span v-else class="text-gray-400 text-sm">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="flex-1">
        <CostSetSummaryCard
          title="Actual Summary"
          :summary="props.actualSummaryFromBackend || actualSummary"
          :costLines="costLines"
          :isLoading="isLoading"
          :revision="revision"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import CostSetSummaryCard from '@/components/shared/CostSetSummaryCard.vue'
import { fetchCostSet } from '@/services/costing.service'
import type { CostLine, CostSet } from '@/types/costing.types'
import api from '@/plugins/axios'

interface Props {
  jobId: string
  actualSummaryFromBackend?: { cost: number; rev: number; hours: number; created?: string }
}

interface Staff {
  id: string
  name: string
  email?: string
}

const props = defineProps<Props>()
const router = useRouter()

const costLines = ref<CostLine[]>([])
const staffMap = ref<Record<string, Staff>>({})
const isLoading = ref(false)
const revision = ref(0)

// Utility functions
function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return num.toFixed(2)
}

function formatNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return num.toFixed(3)
}

// Load staff data for time entries
async function loadStaff() {
  try {
    const response = await api.get('/api/staff/')
    const staff: Staff[] = response.data || []
    staffMap.value = staff.reduce(
      (acc, s) => {
        acc[s.id] = s
        return acc
      },
      {} as Record<string, Staff>,
    )
  } catch (error) {
    console.error('Failed to load staff data:', error)
  }
}

async function loadActualCosts() {
  isLoading.value = true
  try {
    const costSet: CostSet = await fetchCostSet(props.jobId, 'actual')

    // Process cost lines
    costLines.value = costSet.cost_lines.map((line) => ({
      ...line,
      quantity: typeof line.quantity === 'string' ? Number(line.quantity) : line.quantity,
      unit_cost: typeof line.unit_cost === 'string' ? Number(line.unit_cost) : line.unit_cost,
      unit_rev: typeof line.unit_rev === 'string' ? Number(line.unit_rev) : line.unit_rev,
    }))

    revision.value = costSet.rev || 0
  } catch (error) {
    console.error('Failed to load actual cost lines:', error)
  } finally {
    isLoading.value = false
  }
}

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
    const quantity = typeof line.quantity === 'string' ? Number(line.quantity) : line.quantity
    const unitCost = typeof line.unit_cost === 'string' ? Number(line.unit_cost) : line.unit_cost
    const unitRev = typeof line.unit_rev === 'string' ? Number(line.unit_rev) : line.unit_rev

    // Add to cost and revenue for all types of cost lines
    cost += quantity * unitCost
    rev += quantity * unitRev

    // Only add to hours if it's time-based
    if (line.kind === 'time') {
      hours += quantity
    }
  }

  return {
    cost,
    rev,
    hours,
    created: undefined,
  }
})

function navigateToDeliveryReceipt(purchaseOrderId: string) {
  router.push({
    name: 'delivery-receipt-form',
    params: { poId: purchaseOrderId },
  })
}

function navigateToTimesheet(staffId: string, date?: string) {
  const routeParams = {
    name: 'timesheet-entry',
    params: { staffId },
  } as { name: string; params: { staffId: string }; query?: { date: string } }

  if (date) {
    routeParams.query = { date }
  }

  router.push(routeParams)
}
</script>
