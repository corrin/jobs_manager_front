import api from '@/plugins/axios'
import type { SalesForecastReportResponse } from '@/types/sales-forecast.types'

export const salesForecastReportService = {
  async getSalesForecast(): Promise<SalesForecastReportResponse> {
    const response = await api.get<SalesForecastReportResponse>(
      '/accounting/api/reports/sales-forecast/',
    )
    return response.data
  },
}
