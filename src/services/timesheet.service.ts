import api from '@/services/api'
import type {
  Staff,
  TimeEntry,
  Job,
  WeeklyOverviewData,
  CreateTimeEntryRequest,
  UpdateTimeEntryRequest
} from '@/types/timesheet'

export class TimesheetService {
  private static readonly BASE_URL = '/api/timesheet'

  /**
   * Get list of staff members
   */
  static async getStaff(): Promise<Staff[]> {
    try {
      const response = await api.get(`${this.BASE_URL}/staff/`)
      return response.data.staff
    } catch (error) {
      console.error('Error fetching staff:', error)
      throw error
    }
  }

  /**
   * Get time entries for a specific staff member and date
   */
  static async getTimeEntries(staffId: string, date: string): Promise<TimeEntry[]> {
    try {
      const response = await api.get(`${this.BASE_URL}/entries/`, {
        params: { staff_id: staffId, date }
      })
      return response.data.time_entries
    } catch (error) {
      console.error('Error fetching time entries:', error)
      throw error
    }
  }

  /**
   * Get time entries for a date range
   */
  static async getTimeEntriesRange(staffId: string, startDate: string, endDate: string): Promise<TimeEntry[]> {
    try {
      const response = await api.get(`${this.BASE_URL}/entries/`, {
        params: { staff_id: staffId, start_date: startDate, end_date: endDate }
      })
      return response.data.time_entries
    } catch (error) {
      console.error('Error fetching time entries for range:', error)
      throw error
    }
  }

  /**
   * Create a new time entry
   */
  static async createTimeEntry(data: CreateTimeEntryRequest): Promise<TimeEntry> {
    try {
      const response = await api.post(`${this.BASE_URL}/entries/`, data)
      return response.data.time_entry
    } catch (error) {
      console.error('Error creating time entry:', error)
      throw error
    }
  }

  /**
   * Update an existing time entry
   */
  static async updateTimeEntry(entryId: string, data: UpdateTimeEntryRequest): Promise<TimeEntry> {
    try {
      const response = await api.put(`${this.BASE_URL}/entries/${entryId}/`, data)
      return response.data.time_entry
    } catch (error) {
      console.error('Error updating time entry:', error)
      throw error
    }
  }

  /**
   * Delete a time entry
   */
  static async deleteTimeEntry(entryId: string): Promise<void> {
    try {
      await api.delete(`${this.BASE_URL}/entries/${entryId}/`)
    } catch (error) {
      console.error('Error deleting time entry:', error)
      throw error
    }
  }

  /**
   * Get available jobs for timesheet entries
   */
  static async getJobs(): Promise<Job[]> {
    try {
      const response = await api.get(`${this.BASE_URL}/jobs/`)
      return response.data.jobs
    } catch (error) {
      console.error('Error fetching jobs:', error)
      throw error
    }
  }

  /**
   * Get weekly overview data for all staff
   */
  static async getWeeklyOverview(startDate: string): Promise<WeeklyOverviewData> {
    try {
      const response = await api.get(`${this.BASE_URL}/weekly-overview/`, {
        params: { start_date: startDate }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching weekly overview:', error)
      throw error
    }
  }

  /**
   * Auto-save time entry changes
   */
  static async autosaveTimeEntry(entryId: string, data: Partial<UpdateTimeEntryRequest>): Promise<void> {
    try {
      await api.post(`${this.BASE_URL}/autosave/`, {
        entry_id: entryId,
        ...data
      })
    } catch (error) {
      console.error('Error auto-saving time entry:', error)
      // Don't throw for autosave - just log the error
    }
  }

  /**
   * Get current week date range
   */
  static getCurrentWeekRange(): { startDate: string; endDate: string } {
    const today = new Date()
    const monday = new Date(today)
    monday.setDate(today.getDate() - today.getDay() + 1)

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    return {
      startDate: monday.toISOString().split('T')[0],
      endDate: sunday.toISOString().split('T')[0]
    }
  }

  /**
   * Format date for display
   */
  static formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-NZ', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  /**
   * Format hours for display
   */
  static formatHours(hours: number): string {
    return hours.toFixed(2)
  }

  // Legacy methods for compatibility with existing store code  // Legacy methods for compatibility with existing store code
  static async getStaffList(): Promise<Staff[]> {
    return this.getStaff()
  }

  static async getAvailableJobs(): Promise<Job[]> {
    return this.getJobs()
  }

  static async getEntriesForDateRange(startDate: Date, endDate: Date): Promise<TimeEntry[]> {
    const start = startDate.toISOString().split('T')[0]
    const end = endDate.toISOString().split('T')[0]

    try {
      const response = await api.get(`${this.BASE_URL}/entries/`, {
        params: { start_date: start, end_date: end }
      })
      return response.data.time_entries
    } catch (error) {
      console.error('Error fetching entries for date range:', error)
      throw error
    }
  }

  static async getEntriesForStaffAndDate(staffId: string, date: Date): Promise<TimeEntry[]> {
    const dateStr = date.toISOString().split('T')[0]
    return this.getTimeEntries(staffId, dateStr)
  }

  static async createEntry(entryData: Omit<TimeEntry, 'id'>): Promise<TimeEntry> {
    const createRequest: CreateTimeEntryRequest = {
      staffId: entryData.staffId,
      jobPricingId: entryData.jobPricingId,
      date: entryData.timesheetDate,
      description: entryData.description,
      hours: entryData.hours,
      items: entryData.items,
      minsPerItem: entryData.minsPerItem,
      wageRate: entryData.wageRate,
      chargeOutRate: entryData.chargeOutRate,
      isBillable: entryData.isBillable,
      notes: entryData.notes,
      rateMultiplier: entryData.rateMultiplier
    }

    return this.createTimeEntry(createRequest)
  }

  static async updateEntry(entry: TimeEntry): Promise<TimeEntry> {
    const updateRequest: UpdateTimeEntryRequest = {
      description: entry.description,
      hours: entry.hours,
      items: entry.items,
      minsPerItem: entry.minsPerItem,
      wageRate: entry.wageRate,
      chargeOutRate: entry.chargeOutRate,
      isBillable: entry.isBillable,
      notes: entry.notes,
      rateMultiplier: entry.rateMultiplier,
      jobPricingId: entry.jobPricingId
    }

    return this.updateTimeEntry(entry.id, updateRequest)
  }

  static async deleteEntry(entryId: string): Promise<void> {
    return this.deleteTimeEntry(entryId)
  }

  static async autosaveEntry(entryData: Partial<TimeEntry>): Promise<void> {
    if (!entryData.id) {
      throw new Error('Entry ID is required for autosave')
    }

    const updateData: Partial<UpdateTimeEntryRequest> = {
      description: entryData.description,
      hours: entryData.hours,
      items: entryData.items,
      minsPerItem: entryData.minsPerItem,
      wageRate: entryData.wageRate,
      chargeOutRate: entryData.chargeOutRate,
      isBillable: entryData.isBillable,
      notes: entryData.notes,
      rateMultiplier: entryData.rateMultiplier
    }

    return this.autosaveTimeEntry(entryData.id, updateData)
  }

  static async exportToIMS(weekStart: Date): Promise<string> {
    // TODO: Implement IMS export functionality
    console.log('IMS export not yet implemented for:', weekStart)
    return 'IMS export functionality coming soon'
  }

  static async bulkUpdateEntries(entries: TimeEntry[]): Promise<TimeEntry[]> {
    // TODO: Implement bulk update - for now, update one by one
    const updatedEntries: TimeEntry[] = []

    for (const entry of entries) {
      try {
        const updated = await this.updateEntry(entry)
        updatedEntries.push(updated)
      } catch (error) {
        console.error('Error updating entry:', entry.id, error)
        // Continue with other entries
      }
    }

    return updatedEntries
  }
}
