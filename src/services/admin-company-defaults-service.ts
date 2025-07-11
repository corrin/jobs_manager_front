import axios from 'axios'

/**

 * @deprecated Use generated types from src/api/generated instead

 * This interface will be removed after migration to openapi-zod-client generated types

 */

export interface AIProvider {
  id?: string
  name: string
  provider_type: string
  model_name: string
  api_key: string
  default: boolean
}

/**

 * @deprecated Use generated types from src/api/generated instead

 * This interface will be removed after migration to openapi-zod-client generated types

 */

export interface CompanyDefaults {
  company_name: string
  charge_out_rate: number
  wage_rate: number
  time_markup: number
  materials_markup: number
  starting_job_number: number
  po_prefix: string
  shop_client_name?: string
  ai_providers?: AIProvider[]
}

export async function getCompanyDefaults(): Promise<CompanyDefaults> {
  const { data } = await axios.get('/api/company-defaults/')
  return data
}

export async function updateCompanyDefaults(payload: CompanyDefaults): Promise<CompanyDefaults> {
  const { data } = await axios.put('/api/company-defaults/', payload)
  return data
}
