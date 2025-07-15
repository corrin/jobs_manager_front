import apiClient from './api'
import { debugLog } from '@/utils/debug'
import { IMSExportDataSchema, type IMSStaffData, type IMSExportData } from '@/api/local/schemas'

export { type IMSStaffData, type IMSExportData }

class IMSService {
  private baseUrl = '/timesheets/api'

  async exportToIMS(startDate: Date): Promise<IMSExportData> {
    try {
      const formattedDate = this.formatDateForAPI(startDate)

      debugLog('📊 Exporting to IMS for date:', formattedDate)

      const response = await apiClient.get(`${this.baseUrl}/ims-export/`, {
        params: {
          start_date: formattedDate,
        },
      })

      const validation = IMSExportDataSchema.safeParse(response.data)
      if (validation.success) {
        debugLog('✅ IMS export successful:', validation.data)
        return validation.data
      } else {
        debugLog('❌ Invalid IMS export data:', validation.error)
        throw new Error('Invalid data structure received from IMS export endpoint.')
      }
    } catch (error) {
      debugLog('❌ Error exporting to IMS:', error)
      throw error
    }
  }

  private formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  getIMSWeekStart(date: Date): Date {
    const tuesday = new Date(date)

    if (date.getDay() === 1) {
      tuesday.setDate(date.getDate() - 6)
    } else {
      const daysToTuesday = (date.getDay() - 2 + 7) % 7
      tuesday.setDate(date.getDate() - daysToTuesday)
    }

    return tuesday
  }

  getIMSWeekDays(startDate: Date): Date[] {
    const tuesday = this.getIMSWeekStart(startDate)

    return [
      new Date(tuesday),
      new Date(tuesday.getTime() + 24 * 60 * 60 * 1000),
      new Date(tuesday.getTime() + 2 * 24 * 60 * 60 * 1000),
      new Date(tuesday.getTime() + 3 * 24 * 60 * 60 * 1000),
      new Date(tuesday.getTime() + 6 * 24 * 60 * 60 * 1000),
    ]
  }

  isIMSModeFromURL(): boolean {
    const params = new URLSearchParams(window.location.search)
    return params.get('export_to_ims') === '1'
  }

  updateURLForIMSMode(enabled: boolean): void {
    const url = new URL(window.location.href)

    if (enabled) {
      url.searchParams.set('export_to_ims', '1')
    } else {
      url.searchParams.delete('export_to_ims')
    }

    window.history.replaceState({}, '', url)
  }
}

export const imsService = new IMSService()
