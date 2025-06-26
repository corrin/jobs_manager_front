import { ref } from 'vue'
import axios from 'axios'
import type { Staff } from '@/types/staff'

const API_URL = '/accounts/api/staff/'

export function useStaffApi() {
  const error = ref<string | null>(null)

  // Lists all staff members
  async function listStaff(): Promise<Staff[]> {
    error.value = null
    try {
      const res = await axios.get(API_URL)
      return res.data
    } catch (e: unknown) {
      if (e instanceof Error) {
        error.value = e.message
      } else {
        error.value = 'Failed to fetch staff.'
      }
      return []
    }
  }

  // Creates a new staff member
  async function createStaff(data: Record<string, unknown>): Promise<Staff> {
    error.value = null
    try {
      const formData = new FormData()
      for (const key in data) {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key] as string | Blob)
        }
      }
      const res = await axios.post(API_URL, formData)
      return res.data
    } catch (e: unknown) {
      if (e instanceof Error) {
        error.value = e.message
      } else {
        error.value = 'Failed to create staff.'
      }
      throw e
    }
  }

  // Updates an existing staff member
  async function updateStaff(id: string | number, data: Record<string, unknown>): Promise<Staff> {
    error.value = null
    try {
      const formData = new FormData()
      for (const key in data) {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key] as string | Blob)
        }
      }
      const res = await axios.put(`${API_URL}${id}/`, formData)
      return res.data
    } catch (e: unknown) {
      if (e instanceof Error) {
        error.value = e.message
      } else {
        error.value = 'Failed to update staff.'
      }
      throw e
    }
  }

  // Removes a staff member
  async function removeStaff(id: string | number): Promise<void> {
    error.value = null
    try {
      await axios.delete(`${API_URL}${id}/`)
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
