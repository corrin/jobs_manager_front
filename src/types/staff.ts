export interface Staff {
  id: string
  first_name: string
  last_name: string
  email: string
  wage_rate: string | number
  icon?: string
  [key: string]: unknown
}
