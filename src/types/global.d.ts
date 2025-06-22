import type { CompanyDefaults } from '@/services/company-defaults.service'

declare global {
  interface Window {
    companyDefaults: CompanyDefaults | null
  }
}
