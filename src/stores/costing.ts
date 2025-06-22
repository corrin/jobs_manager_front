import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchCostSet } from '@/services/costing.service'
import type { CostSet, CostLine } from '@/types/costing.types'

// Helper functions
function createEmptyGrouping() {
  return {
    time: [] as CostLine[],
    material: [] as CostLine[],
    adjust: [] as CostLine[],
  }
}

function getCategoryFromKind(kind: string, metaCategory?: string): 'time' | 'material' | 'adjust' {
  // Primeiro, tentar usar meta.category se disponível
  if (metaCategory) {
    const normalizedCategory = metaCategory.toLowerCase()
    switch (normalizedCategory) {
      case 'fabrication':
        return 'time'
      case 'mainwork':
        return 'material'
    }
  }

  // Fallback para kind original
  const normalizedKind = kind.toLowerCase()
  switch (normalizedKind) {
    case 'time':
      return 'time'
    case 'adjust':
    case 'adjustment':
      return 'adjust'
    case 'material':
    default:
      return 'material'
  }
}

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
      } catch {
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
    if (!costSet.value || !costSet.value.cost_lines) {
      return createEmptyGrouping()
    }
    return costSet.value.cost_lines.reduce((groups, costLine) => {
      // Usar meta.category como prioridade principal, com fallback para kind
      const kind = costLine.kind || ''
      const metaCategory = costLine.meta?.category

      // Determinar categoria usando meta.category primeiro, depois kind
      const category = getCategoryFromKind(kind, metaCategory)
      groups[category].push(costLine)
      return groups
    }, createEmptyGrouping())
  })

  // Helper para somar valores de costlines
  function sumCostLines(fn: (cl: CostLine) => number) {
    if (!costSet.value || !costSet.value.cost_lines) return 0
    return costSet.value.cost_lines.reduce((acc, cl) => acc + (fn(cl) || 0), 0)
  }

  // Total Cost: usa summary se válido, senão soma costlines
  const totalCost = computed(() => {
    if (
      costSet.value &&
      costSet.value.summary &&
      typeof costSet.value.summary.cost === 'number' &&
      !isNaN(costSet.value.summary.cost) &&
      costSet.value.summary.cost > 0
    ) {
      return costSet.value.summary.cost
    }
    // Fallback: soma total_cost das costlines
    return sumCostLines((cl) => Number(cl.total_cost) || 0)
  })

  // Total Revenue: usa summary se válido, senão soma costlines
  const totalRevenue = computed(() => {
    if (
      costSet.value &&
      costSet.value.summary &&
      typeof costSet.value.summary.rev === 'number' &&
      !isNaN(costSet.value.summary.rev) &&
      costSet.value.summary.rev > 0
    ) {
      return costSet.value.summary.rev
    }
    // Fallback: soma total_rev das costlines
    return sumCostLines((cl) => Number(cl.total_rev) || 0)
  })

  // Total Hours: usa summary se válido, senão soma labour_minutes das costlines de fabricação
  const totalHours = computed(() => {
    if (
      costSet.value &&
      costSet.value.summary &&
      typeof costSet.value.summary.hours === 'number' &&
      !isNaN(costSet.value.summary.hours) &&
      costSet.value.summary.hours > 0
    ) {
      return costSet.value.summary.hours
    }
    // Fallback: soma labour_minutes/60 das costlines de fabricação (tempo)
    return sumCostLines((cl) => {
      // Verificar se é linha de tempo usando meta.category ou kind
      const isTimeEntry =
        cl.meta?.category === 'fabrication' || String(cl.kind || '').toLowerCase() === 'time'

      if (isTimeEntry) {
        // Usar meta.labour_minutes se existir
        if (cl.meta && typeof cl.meta.labour_minutes === 'number') {
          return cl.meta.labour_minutes / 60
        }
        // Fallback: quantity pode ser horas
        return Number(cl.quantity) || 0
      }
      return 0
    })
  })

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
    isLoaded,
  }
})
