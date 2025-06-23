import api from '@/plugins/axios'

export interface Staff {
  id: number
  first_name: string
  last_name: string
  display_name: string
  email: string
  initials?: string
  avatar_url?: string
}

export interface StaffAssignment {
  id: number
  job_id: number
  staff_id: number
  assigned_at: string
  assigned_by: number
}

export class StaffService {
  private static instance: StaffService
  private baseUrl = '/accounts/api/staff'

  static getInstance(): StaffService {
    if (!StaffService.instance) {
      StaffService.instance = new StaffService()
    }
    return StaffService.instance
  }

  async getAllStaff(): Promise<Staff[]> {
    try {
      const response = await api.get(`${this.baseUrl}/all/`, {
        params: {
          actual_users: 'true',
        },
      })

      return Array.isArray(response.data) ? response.data : []
    } catch (error) {
      console.error('Error fetching staff:', error)
      throw new Error('Failed to load staff members')
    }
  }

  async assignStaffToJob(
    jobId: number,
    staffId: number,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.post(`/job/api/job/${jobId}/assignment`, {
        job_id: jobId,
        staff_id: staffId,
      })

      return { success: response.data.success, message: response.data.message }
    } catch (error) {
      console.error('Error assigning staff to job:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to assign staff to job')
    }
  }

  async removeStaffFromJob(
    jobId: number,
    staffId: number,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.delete(`/job/api/job/${jobId}/assignment`, {
        data: {
          job_id: jobId,
          staff_id: staffId,
        },
      })

      return { success: response.data.success, message: response.data.message }
    } catch (error) {
      console.error('Error removing staff from job:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to remove staff from job')
    }
  }

  async getJobStaffAssignments(jobId: number): Promise<StaffAssignment[]> {
    try {
      const response = await api.get(`/api/job/${jobId}/assignments/`)

      return Array.isArray(response.data.assignments) ? response.data.assignments : []
    } catch (error) {
      console.error('Error fetching job staff assignments:', error)
      throw new Error('Failed to load job staff assignments')
    }
  }

  searchStaff(staffList: Staff[], searchTerm: string): Staff[] {
    if (!searchTerm.trim()) {
      return staffList
    }

    const term = searchTerm.toLowerCase()
    return staffList.filter(
      (staff) =>
        staff.display_name.toLowerCase().includes(term) ||
        staff.first_name.toLowerCase().includes(term) ||
        staff.last_name.toLowerCase().includes(term) ||
        staff.email.toLowerCase().includes(term),
    )
  }

  generateInitials(staff: Staff): string {
    if (staff.initials) {
      return staff.initials
    }

    const firstInitial = staff.first_name?.charAt(0)?.toUpperCase() || ''
    const lastInitial = staff.last_name?.charAt(0)?.toUpperCase() || ''
    return firstInitial + lastInitial || '??'
  }

  getAvatarColor(staffId: number): string {
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FFEAA7',
      '#DDA0DD',
      '#98D8C8',
      '#F7DC6F',
      '#BB8FCE',
      '#85C1E9',
    ]
    return colors[staffId % colors.length]
  }
}

export const staffService = StaffService.getInstance()
