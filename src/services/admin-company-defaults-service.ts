import { api, schemas } from '@/api/generated/api'
import type { z } from 'zod'

// Generate TypeScript types from Zod schemas
export type CompanyDefaults = z.infer<typeof schemas.CompanyDefaults>
export type AIProvider = z.infer<typeof schemas.AIProvider>

export async function getCompanyDefaults(): Promise<CompanyDefaults> {
  return await api.api_company_defaults_retrieve()
}

export async function updateCompanyDefaults(payload: CompanyDefaults): Promise<CompanyDefaults> {
  return await api.api_company_defaults_update({ body: payload })
}
