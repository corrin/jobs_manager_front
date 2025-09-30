import type { Ref } from 'vue'
import { toast } from 'vue-sonner'
import { costlineService } from '../services/costline.service'
import { schemas } from '../api/generated/api'
import type { z } from 'zod'
import { debugLog } from '../utils/debug'

type CostLine = z.infer<typeof schemas.CostLine>
type CostLineCreateUpdate = z.infer<typeof schemas.CostLineCreateUpdate>
type CostSetKind = 'estimate' | 'quote' | 'actual'

export interface UseAddMaterialCostLineOptions {
  costLines: Ref<CostLine[]>
  jobId: string
  costSetKind: CostSetKind
  isLoading?: Ref<boolean>
  beforeAdd?: () => boolean // Return false to prevent adding
  onSuccess?: (created: CostLine) => void | Promise<void>
}

export function useAddMaterialCostLine(options: UseAddMaterialCostLineOptions) {
  const { costLines, jobId, costSetKind, isLoading, beforeAdd, onSuccess } = options

  /**
   * Add a material cost line
   */
  async function handleAddMaterial(payload: CostLine) {
    // Run pre-add check if provided
    if (beforeAdd && !beforeAdd()) {
      return
    }

    // Validate payload
    if (!payload || payload.kind !== 'material') return

    if (isLoading) isLoading.value = true
    toast.info('Adding material cost line...', { id: 'add-material' })

    try {
      const createPayload: CostLineCreateUpdate = {
        kind: 'material' as const,
        desc: payload.desc,
        quantity: payload.quantity,
        unit_cost: payload.unit_cost ?? 0,
        unit_rev: payload.unit_rev ?? 0,
        ext_refs: (payload.ext_refs as Record<string, unknown>) || {},
        meta: (payload.meta as Record<string, unknown>) || {},
      }

      const created = await costlineService.createCostLine(jobId, costSetKind, createPayload)

      // Add to cost lines array
      costLines.value = [...costLines.value, created]

      toast.success('Material cost line added!')

      // Call success callback if provided
      if (onSuccess) {
        await onSuccess(created)
      }

      return created
    } catch (error) {
      toast.error('Failed to add material cost line.')
      debugLog('Failed to add material:', error)
      throw error
    } finally {
      if (isLoading) isLoading.value = false
      toast.dismiss('add-material')
    }
  }

  return {
    handleAddMaterial,
  }
}
