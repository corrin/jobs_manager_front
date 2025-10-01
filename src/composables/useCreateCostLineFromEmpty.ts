import type { Ref } from 'vue'
import { toast } from 'vue-sonner'
import { costlineService } from '../services/costline.service'
import { schemas } from '../api/generated/api'
import type { z } from 'zod'
import { debugLog } from '../utils/debug'

type CostLine = z.infer<typeof schemas.CostLine>
type CostLineCreateUpdate = z.infer<typeof schemas.CostLineCreateUpdate>
type CostSetKind = 'estimate' | 'quote' | 'actual'

export interface UseCreateCostLineFromEmptyOptions {
  costLines: Ref<CostLine[]>
  jobId: string
  costSetKind: CostSetKind
  onSuccess?: (created: CostLine) => void | Promise<void>
  beforeCreate?: () => boolean // Return false to prevent creation
}

export function useCreateCostLineFromEmpty(options: UseCreateCostLineFromEmptyOptions) {
  const { costLines, jobId, costSetKind, onSuccess, beforeCreate } = options

  /**
   * Create a cost line from an empty line that meets baseline criteria
   */
  async function handleCreateFromEmpty(line: CostLine) {
    // Run pre-creation check if provided
    if (beforeCreate && !beforeCreate()) {
      return
    }

    debugLog(`Creating cost line from empty line (${costSetKind}):`, line)

    try {
      const now = new Date().toISOString()
      const createPayload: CostLineCreateUpdate = {
        kind: line.kind as 'material' | 'time' | 'adjust',
        desc: line.desc || '',
        quantity: line.quantity || 1,
        unit_cost: line.unit_cost ?? 0,
        unit_rev: line.unit_rev ?? 0,
        ext_refs: (line.ext_refs as Record<string, unknown>) || {},
        meta: (line.meta as Record<string, unknown>) || {},
        created_at: now,
        updated_at: now,
      }

      const created = await costlineService.createCostLine(jobId, costSetKind, createPayload)

      // Replace the empty line with the created one
      const index = costLines.value.findIndex((l) => l === line)
      if (index !== -1) {
        costLines.value[index] = created
      }

      toast.success('Cost line created!')
      debugLog('✅ Successfully created cost line:', created)

      // Call success callback if provided
      if (onSuccess) {
        await onSuccess(created)
      }

      return created
    } catch (error) {
      debugLog('Failed to create cost line:', error)
      toast.error('Failed to create cost line')
      throw error
    }
  }

  return {
    handleCreateFromEmpty,
  }
}
