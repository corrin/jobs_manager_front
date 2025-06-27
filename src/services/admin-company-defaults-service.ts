import axios from 'axios'

export interface CompanyDefaults {
  company_name: string
  charge_out_rate: number
  wage_rate: number
  time_markup: number
  materials_markup: number
  starting_job_number: number
  po_prefix: string
  shop_client_name?: string
}

export async function getCompanyDefaults(): Promise<CompanyDefaults> {
  const { data } = await axios.get('/api/company-defaults/')
  return data
}

export async function updateCompanyDefaults(payload: CompanyDefaults): Promise<CompanyDefaults> {
  const { data } = await axios.put('/api/company-defaults/', payload)
  return data
}
