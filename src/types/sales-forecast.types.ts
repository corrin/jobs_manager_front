export interface SalesForecastMonth {
  month: string // Format: "YYYY-MM"
  month_label: string // Format: "MMM YYYY"
  xero_sales: number
  jm_sales: number
  variance: number
  variance_pct: number
}

export interface SalesForecastReportResponse {
  months: SalesForecastMonth[]
}
