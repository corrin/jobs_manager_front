<template>
  <div class="space-y-6">
    <!-- Header com Seleção de CostSet -->
    <div class="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">Cost Analysis</h2>
        <p class="text-sm text-gray-500">
          Analyze cost lines by category across different cost sets
        </p>
      </div>

      <!-- CostSet Selector -->
      <div class="flex items-center space-x-3">
        <label class="text-sm font-medium text-gray-700">Cost Set:</label>
        <select
          v-model="selectedCostSetKind"
          @change="handleCostSetChange"
          class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="estimate">Estimate</option>
          <option value="quote">Quote</option>
          <option value="actual">Actual</option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="costingStore.loading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"
        ></div>
        <p class="text-gray-500">Loading cost data...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="costingStore.error" class="bg-red-50 border border-red-200 rounded-md p-4">
      <div class="flex">
        <AlertCircle class="h-5 w-5 text-red-400 mr-2" />
        <div>
          <h3 class="text-sm font-medium text-red-800">Error Loading Data</h3>
          <p class="text-sm text-red-700 mt-1">{{ costingStore.error }}</p>
        </div>
      </div>
    </div>

    <!-- Content when data is loaded -->
    <div v-else-if="costingStore.isLoaded" class="space-y-6">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex items-center">
            <DollarSign class="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p class="text-sm font-medium text-blue-800">Total Cost</p>
              <p class="text-2xl font-bold text-blue-900">
                {{ formatCurrency(costingStore.totalCost) }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <div class="flex items-center">
            <TrendingUp class="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p class="text-sm font-medium text-green-800">Total Revenue</p>
              <p class="text-2xl font-bold text-green-900">
                {{ formatCurrency(costingStore.totalRevenue) }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div class="flex items-center">
            <Clock class="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <p class="text-sm font-medium text-orange-800">Total Hours</p>
              <p class="text-2xl font-bold text-orange-900">
                {{ formatHours(costingStore.totalHours) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Cost Lines by Category -->
      <div class="bg-white rounded-lg border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Cost Lines by Category</h3>
        </div>

        <div class="p-6">
          <!-- Time Entries -->
          <div v-if="groupedData.time.length > 0" class="mb-8">
            <h4 class="text-md font-semibold text-gray-800 mb-4 flex items-center">
              <Clock class="h-5 w-5 text-blue-600 mr-2" />
              Time Entries ({{ groupedData.time.length }})
            </h4>
            <div class="space-y-3">
              <div
                v-for="costLine in groupedData.time"
                :key="costLine.id"
                class="flex justify-between items-start p-4 bg-blue-50 rounded-lg border border-blue-200"
              >
                <div class="flex-1">
                  <p class="font-medium text-gray-900">{{ costLine.desc || 'No description' }}</p>
                  <div class="text-sm text-gray-600 mt-1">
                    <span class="inline-block mr-4">{{ formatTimeEntry(costLine) }}</span>
                    <span
                      v-if="costLine.meta?.category"
                      class="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                    >
                      {{ costLine.meta.category }}
                    </span>
                  </div>
                </div>
                <div class="text-right">
                  <p class="font-semibold text-gray-900">
                    {{ formatCurrency(costLine.total_rev) }}
                  </p>
                  <p class="text-sm text-gray-500">
                    Cost: {{ formatCurrency(costLine.total_cost) }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Material Entries -->
          <div v-if="groupedData.material.length > 0" class="mb-8">
            <h4 class="text-md font-semibold text-gray-800 mb-4 flex items-center">
              <Package class="h-5 w-5 text-green-600 mr-2" />
              Material Entries ({{ groupedData.material.length }})
            </h4>
            <div class="space-y-3">
              <div
                v-for="costLine in groupedData.material"
                :key="costLine.id"
                class="flex justify-between items-start p-4 bg-green-50 rounded-lg border border-green-200"
              >
                <div class="flex-1">
                  <p class="font-medium text-gray-900">{{ costLine.desc || 'No description' }}</p>
                  <div class="text-sm text-gray-600 mt-1">
                    <span class="inline-block mr-4">Qty: {{ costLine.quantity }}</span>
                    <span class="inline-block mr-4"
                      >Unit: {{ formatCurrency(parseFloat(costLine.unit_cost)) }}</span
                    >
                    <span
                      v-if="costLine.meta?.category"
                      class="inline-block px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs"
                    >
                      {{ costLine.meta.category }}
                    </span>
                  </div>
                </div>
                <div class="text-right">
                  <p class="font-semibold text-gray-900">
                    {{ formatCurrency(costLine.total_rev) }}
                  </p>
                  <p class="text-sm text-gray-500">
                    Cost: {{ formatCurrency(costLine.total_cost) }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Adjustment Entries -->
          <div v-if="groupedData.adjust.length > 0" class="mb-8">
            <h4 class="text-md font-semibold text-gray-800 mb-4 flex items-center">
              <Settings class="h-5 w-5 text-purple-600 mr-2" />
              Adjustments ({{ groupedData.adjust.length }})
            </h4>
            <div class="space-y-3">
              <div
                v-for="costLine in groupedData.adjust"
                :key="costLine.id"
                class="flex justify-between items-start p-4 bg-purple-50 rounded-lg border border-purple-200"
              >
                <div class="flex-1">
                  <p class="font-medium text-gray-900">{{ costLine.desc || 'No description' }}</p>
                  <div class="text-sm text-gray-600 mt-1">
                    <span
                      v-if="costLine.meta?.category"
                      class="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs"
                    >
                      {{ costLine.meta.category }}
                    </span>
                  </div>
                </div>
                <div class="text-right">
                  <p class="font-semibold text-gray-900">
                    {{ formatCurrency(costLine.total_rev) }}
                  </p>
                  <p class="text-sm text-gray-500">
                    Cost: {{ formatCurrency(costLine.total_cost) }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="!hasAnyData" class="text-center py-12">
            <Package class="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 class="text-lg font-medium text-gray-900 mb-2">No Cost Data Found</h3>
            <p class="text-gray-500">This cost set doesn't have any cost lines yet.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- No Data State -->
    <div v-else class="text-center py-12">
      <Package class="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">Select a Cost Set</h3>
      <p class="text-gray-500">Choose a cost set above to analyze the cost breakdown.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { DollarSign, TrendingUp, Clock, Package, Settings, AlertCircle } from 'lucide-vue-next'
import { useCostingStore } from '@/stores/costing'
import type { CostLine } from '@/schemas/costing.schemas'

interface Props {
  jobId: string
}

const props = defineProps<Props>()

// Store e estado reativo
const costingStore = useCostingStore()
const selectedCostSetKind = ref<'estimate' | 'quote' | 'actual'>('estimate')

// Recuperar seleção do localStorage
const STORAGE_KEY = 'jobCostAnalysis_selectedKind'

// Early return patterns e guard clauses
const loadStoredSelection = () => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && ['estimate', 'quote', 'actual'].includes(stored)) {
    selectedCostSetKind.value = stored as 'estimate' | 'quote' | 'actual'
  }
}

const saveSelection = (kind: 'estimate' | 'quote' | 'actual') => {
  localStorage.setItem(STORAGE_KEY, kind)
}

// Computed para agrupar cost lines por kind
const groupedData = computed(() => {
  // Early return se não há dados
  if (!costingStore.costSet?.cost_lines) {
    return { time: [], material: [], adjust: [] }
  }

  return costingStore.groupedByKind
})

const hasAnyData = computed(() => {
  const { time, material, adjust } = groupedData.value
  return time.length > 0 || material.length > 0 || adjust.length > 0
})

// Handle mudança de cost set usando switch-case
const handleCostSetChange = async () => {
  // Guard clause
  if (!props.jobId) {
    console.warn('No jobId provided for cost set change')
    return
  }

  try {
    await costingStore.load(props.jobId, selectedCostSetKind.value)
    saveSelection(selectedCostSetKind.value)
    console.log(`✅ Switched to ${selectedCostSetKind.value} cost set`)
  } catch (error) {
    console.error(`❌ Error switching to ${selectedCostSetKind.value}:`, error)
  }
}

// Utility functions seguindo SRP
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

const formatTimeEntry = (costLine: CostLine): string => {
  // Tentar usar meta.labour_minutes primeiro
  if (costLine.meta && typeof costLine.meta.labour_minutes === 'number') {
    const minutes = costLine.meta.labour_minutes
    if (minutes === 0) return '0h'

    const hours = minutes / 60
    if (hours < 1) return `${minutes}min`

    const wholeHours = Math.floor(hours)
    const remainingMinutes = minutes % 60

    return remainingMinutes > 0 ? `${wholeHours}h ${remainingMinutes}min` : `${wholeHours}h`
  }

  // Fallback para quantity como horas
  const hours = parseFloat(costLine.quantity) || 0
  return formatHours(hours)
}

const formatHours = (hours: number): string => {
  // Early return para casos especiais
  if (hours === 0) return '0h'
  if (hours < 1) return `${Math.round(hours * 60)}m`

  const wholeHours = Math.floor(hours)
  const minutes = Math.round((hours - wholeHours) * 60)

  return minutes > 0 ? `${wholeHours}h ${minutes}m` : `${wholeHours}h`
}

// Lifecycle hooks
onMounted(() => {
  // Carregar seleção salva
  loadStoredSelection()

  // Carregar dados iniciais
  if (props.jobId) {
    costingStore.load(props.jobId, selectedCostSetKind.value)
  }
})

// Watch para mudanças no jobId
watch(
  () => props.jobId,
  (newJobId) => {
    if (newJobId) {
      costingStore.load(newJobId, selectedCostSetKind.value)
    }
  },
  { immediate: true },
)
</script>

<style scoped>
/* Animações suaves para transições */
.space-y-3 > * + * {
  transition: all 0.2s ease-in-out;
}

/* Hover effects para cards de cost lines */
.bg-blue-50:hover,
.bg-green-50:hover,
.bg-purple-50:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Loading animation */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
