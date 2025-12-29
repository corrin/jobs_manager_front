import { schemas } from '@/api/generated/api'
import { api } from '@/api/client'
import { debugLog } from '@/utils/debug'
import { z } from 'zod'

export type PayrollCategory = z.infer<typeof schemas.PayrollCategory>
export type PayrollCategoryCreateUpdate = z.infer<typeof schemas.PayrollCategoryCreateUpdateRequest>

export class PayrollCategoryService {
  private static instance: PayrollCategoryService

  public static getInstance(): PayrollCategoryService {
    if (!PayrollCategoryService.instance) {
      PayrollCategoryService.instance = new PayrollCategoryService()
    }
    return PayrollCategoryService.instance
  }

  private constructor() {}

  async getCategories(): Promise<PayrollCategory[]> {
    try {
      return await api.api_workflow_payroll_categories_list()
    } catch (error) {
      debugLog('Failed to fetch payroll categories:', error)
      throw error
    }
  }

  async getCategory(id: number): Promise<PayrollCategory> {
    try {
      return await api.api_workflow_payroll_categories_retrieve({ params: { id } })
    } catch (error) {
      debugLog(`Failed to get payroll category ${id}:`, error)
      throw error
    }
  }

  async createCategory(data: PayrollCategoryCreateUpdate): Promise<PayrollCategory> {
    try {
      const created = await api.api_workflow_payroll_categories_create(data)
      return schemas.PayrollCategory.parse(created)
    } catch (error) {
      debugLog('Failed to create payroll category:', error)
      throw error
    }
  }

  async updateCategory(
    id: number,
    data: Partial<PayrollCategoryCreateUpdate>,
  ): Promise<PayrollCategory> {
    try {
      const updated = await api.api_workflow_payroll_categories_partial_update(data, {
        params: { id },
      })
      return schemas.PayrollCategory.parse(updated)
    } catch (error) {
      debugLog(`Failed to update payroll category ${id}:`, error)
      throw error
    }
  }

  async deleteCategory(id: number): Promise<void> {
    try {
      await api.api_workflow_payroll_categories_destroy(undefined, { params: { id } })
    } catch (error) {
      debugLog(`Failed to delete payroll category ${id}:`, error)
      throw error
    }
  }
}

export const payrollCategoryService = PayrollCategoryService.getInstance()
