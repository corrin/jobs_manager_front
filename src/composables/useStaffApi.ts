import axios from 'axios'
import type { Staff } from '@/types/staff'

export function useStaffApi() {
  const baseUrl = '/api/staff/'

  async function listStaff(): Promise<Staff[]> {
    const { data } = await axios.get(baseUrl)
    return data
  }

  async function getStaff(id: string): Promise<Staff> {
    const { data } = await axios.get(`${baseUrl}${id}/`)
    return data
  }

  async function createStaff(payload: FormData): Promise<Staff> {
    const { data } = await axios.post(baseUrl, payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  }

  async function updateStaff(id: string, payload: FormData): Promise<Staff> {
    const { data } = await axios.put(`${baseUrl}${id}/`, payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  }

  async function deleteStaffApi(id: string): Promise<void> {
    await axios.delete(`${baseUrl}${id}/`)
  }

  return { listStaff, getStaff, createStaff, updateStaff, deleteStaffApi }
}
