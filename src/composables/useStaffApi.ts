import { ref } from 'vue'
import { z } from 'zod'
import { api, schemas } from '../api/generated/api'

type Staff = z.infer<typeof schemas.Staff>

export function useStaffApi() {
  const error = ref<string | null>(null)

  async function listStaff(): Promise<Staff[]> {
    error.value = null
    try {
      return await api.accounts_api_staff_list()
    } catch (e: unknown) {
      if (e instanceof Error) {
        error.value = e.message
      } else {
        error.value = 'Failed to fetch staff.'
      }
      return []
    }
  }

  async function createStaff(data: Record<string, unknown>): Promise<Staff> {
    error.value = null
    try {
      return await api.accounts_api_staff_create(data as z.infer<typeof schemas.Staff>)
    } catch (e: unknown) {
      if (e instanceof Error) {
        error.value = e.message
      } else {
        error.value = 'Failed to create staff.'
      }
      throw e
    }
  }

  async function updateStaff(id: string | number, data: Record<string, unknown>): Promise<Staff> {
    error.value = null
    try {
      return await api.accounts_api_staff_update(data as z.infer<typeof schemas.Staff>, {
        params: { id: String(id) },
      })
    } catch (e: unknown) {
      if (e instanceof Error) {
        error.value = e.message
      } else {
        error.value = 'Failed to update staff.'
      }
      throw e
    }
  }

  async function removeStaff(id: string | number): Promise<void> {
    error.value = null
    try {
      await api.accounts_api_staff_destroy(undefined, { params: { id: String(id) } })
    } catch (e: unknown) {
      if (e instanceof Error) {
        error.value = e.message
      } else {
        error.value = 'Failed to delete staff.'
      }
      throw e
    }
  }

  return {
    listStaff,
    createStaff,
    updateStaff,
    removeStaff,
    error,
  }
}
