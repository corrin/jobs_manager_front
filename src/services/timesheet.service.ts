import api from '@/plugins/axios'
import type {
  Staff,
  TimeEntry,
  Job,
  WeeklyOverviewData,
  CreateTimeEntryRequest,
  UpdateTimeEntryRequest,
} from '@/types/timesheet.types'

export class TimesheetService {
  private static readonly BASE_URL = '/timesheets/api'

  static async getStaff(): Promise<Staff[]> {
    try {
      const response = await api.get(`${this.BASE_URL}/staff/`)
      return response.data.staff
    } catch (error) {
      console.error('Error fetching staff:', error)
      throw error
    }
  }

  static async getTimeEntries(staffId: string, date: string): Promise<TimeEntry[]> {
    try {
      const response = await api.get(`${this.BASE_URL}/entries/`, {
        params: { staff_id: staffId, date },
      })
      return response.data.time_entries
    } catch (error) {
      console.error('Error fetching time entries:', error)
      throw error
    }
  }

  static async getTimeEntriesRange(
    staffId: string,
    startDate: string,
    endDate: string,
  ): Promise<TimeEntry[]> {
    try {
      const response = await api.get(`${this.BASE_URL}/entries/`, {
        params: { staff_id: staffId, start_date: startDate, end_date: endDate },
      })
      return response.data.time_entries
    } catch (error) {
      console.error('Error fetching time entries for range:', error)
      throw error
    }
  }

  static async createTimeEntry(data: CreateTimeEntryRequest): Promise<TimeEntry> {
    try {
      const requestData = {
        staff_id: data.staffId,
        job_pricing_id: data.jobPricingId,
        date: data.date,
        description: data.description,
        hours: data.hours,
        items: data.items || 0,
        minutes_per_item: data.minsPerItem || 0,
        wage_rate: data.wageRate || 0,
        charge_out_rate: data.chargeOutRate || 0,
        is_billable: data.isBillable,
        notes: data.notes || '',
        rate_multiplier: data.rateMultiplier || 1.0,
      }

      const response = await api.post(`${this.BASE_URL}/entries/`, requestData)
      return response.data.time_entry
    } catch (error) {
      console.error('Error creating time entry:', error)
      throw error
    }
  }

  static async updateTimeEntry(entryId: string, data: UpdateTimeEntryRequest): Promise<TimeEntry> {
    try {
      const response = await api.put(`${this.BASE_URL}/entries/${entryId}/`, data)
      return response.data.time_entry
    } catch (error) {
      console.error('Error updating time entry:', error)
      throw error
    }
  }

  static async deleteTimeEntry(entryId: string): Promise<void> {
    try {
      await api.delete(`${this.BASE_URL}/entries/${entryId}/`)
    } catch (error) {
      console.error('Error deleting time entry:', error)
      throw error
    }
  }

  static async getJobs(): Promise<Job[]> {
    try {
      const response = await api.get(`${this.BASE_URL}/jobs/`)
      return response.data.jobs
    } catch (error) {
      console.error('Error fetching jobs:', error)
      throw error
    }
  }

  static async getWeeklyOverview(startDate: string): Promise<WeeklyOverviewData> {
    try {
      const response = await api.get(`${this.BASE_URL}/weekly-overview/`, {
        params: { start_date: startDate },
      })
      return response.data
    } catch (error) {
      console.error('Error fetching weekly overview:', error)
      throw error
    }
  }

  static async autosaveTimeEntry(
    entryId: string,
    data: Partial<UpdateTimeEntryRequest>,
  ): Promise<void> {
    try {
      await api.post(`${this.BASE_URL}/autosave/`, {
        entry_id: entryId,
        ...data,
      })
    } catch (error) {
      console.error('Error auto-saving time entry:', error)
    }
  }

  static getCurrentWeekRange(): { startDate: string; endDate: string } {
    const today = new Date()
    const monday = new Date(today)
    monday.setDate(today.getDate() - today.getDay() + 1)

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    return {
      startDate: monday.toISOString().split('T')[0],
      endDate: sunday.toISOString().split('T')[0],
    }
  }

  static formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-NZ', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  static formatHours(hours: number): string {
    return hours.toFixed(2)
  }

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
        params: { start_date: start, end_date: end },
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
      jobPricingId: entryData.jobPricingId || '',
      date: entryData.timesheetDate,
      description: entryData.description,
      hours: entryData.hours,
      items: entryData.items,
      minsPerItem: entryData.minsPerItem,
      wageRate: entryData.wageRate,
      chargeOutRate: entryData.chargeOutRate,
      isBillable: entryData.isBillable,
      notes: entryData.notes,
      rateMultiplier: entryData.rateMultiplier,
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
      jobPricingId: entry.jobPricingId,
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
      rateMultiplier: entryData.rateMultiplier,
    }

    return this.autosaveTimeEntry(entryData.id, updateData)
  }

  static async exportToIMS(weekStart: Date): Promise<string> {
    console.log('IMS export not yet implemented for:', weekStart)
    return 'IMS export functionality coming soon'
  }

  static async bulkUpdateEntries(entries: TimeEntry[]): Promise<TimeEntry[]> {
    const updatedEntries: TimeEntry[] = []

    for (const entry of entries) {
      try {
        const updated = await this.updateEntry(entry)
        updatedEntries.push(updated)
      } catch (error) {
        console.error('Error updating entry:', entry.id, error)
      }
    }

    return updatedEntries
  }
}
