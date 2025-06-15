import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchCostSet } from '@/services/costing.service'
import type { CostSet, CostLine } from '@/types/costing'

export const useCostingStore = defineStore('costing', () => {
  // State
  const currentKind = ref<'estimate' | 'quote' | 'actual'>('estimate')
  const costSet = ref<CostSet | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  const load = async (jobId: string) => {
    loading.value = true
    error.value = null

    try {
      console.log(`Loading costing data for job ${jobId}, kind: ${currentKind.value}`)

      const data = await fetchCostSet(jobId, currentKind.value)
      costSet.value = data

      console.log('Costing data loaded successfully')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load costing data'
      console.error('Error loading costing data:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const setCurrentKind = (kind: 'estimate' | 'quote' | 'actual') => {
    currentKind.value = kind
  }

  const clearData = () => {
    costSet.value = null
    error.value = null
  }

  // Getters
  const groupedByKind = computed(() => {
    if (!costSet.value) {
      return createEmptyGrouping()
    }

    return costSet.value.cost_lines.reduce(
      (groups, costLine) => {
        const category = getCategoryFromKind(costLine.kind)
        groups[category].push(costLine)
        return groups
      },
      createEmptyGrouping()
    )
  })

  // Helper functions following SRP
  const createEmptyGrouping = () => ({
    time: [] as CostLine[],
    material: [] as CostLine[],
    adjust: [] as CostLine[]
  })

  const getCategoryFromKind = (kind: string): 'time' | 'material' | 'adjust' => {
    switch (kind) {
      case 'time':
        return 'time'
      case 'material':
        return 'material'
      case 'adjust':
        return 'adjust'
      default:
        console.warn(`Unknown cost line kind: ${kind}, defaulting to 'adjust'`)
        return 'adjust'
    }
  }

  const totalCost = computed(() => costSet.value?.summary.cost || 0)
  const totalRevenue = computed(() => costSet.value?.summary.rev || 0)
  const totalHours = computed(() => costSet.value?.summary.hours || 0)

  const isLoaded = computed(() => costSet.value !== null)

  return {
    // State
    currentKind,
    costSet,
    loading,
    error,

    // Actions
    load,
    setCurrentKind,
    clearData,

    // Getters
    groupedByKind,
    totalCost,
    totalRevenue,
    totalHours,
    isLoaded
  }
})
