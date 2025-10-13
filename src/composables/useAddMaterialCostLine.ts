import type { Ref } from 'vue'
import { toast } from 'vue-sonner'
import { costlineService } from '../services/costline.service'
import { schemas } from '../api/generated/api'
import type { z } from 'zod'

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
      const now = new Date().toISOString()
      const accountingDate = new Date().toISOString().split('T')[0]
      const createPayload: CostLineCreateUpdate = {
        kind: 'material' as const,
        desc: payload.desc,
        quantity: payload.quantity,
        unit_cost: payload.unit_cost ?? 0,
        unit_rev: payload.unit_rev ?? 0,
        accounting_date: accountingDate,
        ext_refs: (payload.ext_refs as Record<string, unknown>) || {},
        meta: (payload.meta as Record<string, unknown>) || {},
        created_at: now,
        updated_at: now,
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
      console.error('Failed to add material:', error)
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
