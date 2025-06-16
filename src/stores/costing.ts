import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchCostSet } from '@/services/costing.service'
import type { CostSet, CostLine } from '@/types/costing.types'

export const useCostingStore = defineStore('costing', () => {
  // State
  const currentKind = ref<'estimate' | 'quote' | 'actual'>('estimate')
  const costSet = ref<CostSet | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  const load = async (jobId: string, kind?: 'estimate' | 'quote' | 'actual') => {
    loading.value = true
    error.value = null

    // Se um kind específico foi passado, use-o, senão use o currentKind
    const targetKind = kind || currentKind.value

    try {
      console.log(`Loading costing data for job ${jobId}, kind: ${targetKind}`)

      const data = await fetchCostSet(jobId, targetKind)
      costSet.value = data

      // Atualizar o currentKind para refletir o que foi carregado
      currentKind.value = targetKind

      console.log('Costing data loaded successfully')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load costing data'
      console.error(`Error loading costing data for ${targetKind}:`, err)

      // Se falhou ao carregar 'actual' ou 'quote', tentar 'estimate' como fallback
      if (targetKind !== 'estimate') {
        console.log('Trying to fallback to estimate data...')
        try {
          const fallbackData = await fetchCostSet(jobId, 'estimate')
          costSet.value = fallbackData
          currentKind.value = 'estimate'
          console.log('Fallback to estimate successful')
          error.value = null // Limpar erro já que o fallback funcionou
        } catch (fallbackErr) {
          console.error('Fallback to estimate also failed:', fallbackErr)
          // Manter o erro original
        }
      }

      if (error.value) {
        throw err
      }
    } finally {
      loading.value = false
    }
  }

  const setCurrentKind = async (kind: 'estimate' | 'quote' | 'actual', jobId?: string) => {
    const previousKind = currentKind.value
    currentKind.value = kind

    // Se temos um jobId e o kind mudou, tentar carregar os novos dados
    if (jobId && previousKind !== kind) {
      try {
        await load(jobId, kind)
      } catch (err) {
        console.warn(`Failed to load ${kind} data, keeping current data`)
        // O load já tenta fallback para estimate se necessário
      }
    }
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
