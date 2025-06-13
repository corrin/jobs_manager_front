import { computed, type Ref } from 'vue'
import type { CompanyDefaults } from '@/services/companyDefaults.service'
import type { Staff, Job } from '@/types/timesheet'
import type { TimeEntryCreationForm } from '@/schemas/timeEntrySchemas'

/**
 * Composable for time entry cost calculations
 * Follows SRP by handling only calculation logic
 */
export function useTimeEntryCalculations(
  formData: Ref<TimeEntryCreationForm>,
  staff: Ref<Staff | null>,
  job: Ref<Job | null>,
  companyDefaults: Ref<CompanyDefaults | null>
) {
  
  /**
   * Get effective wage rate with fallback hierarchy
   */
  const effectiveWageRate = computed((): number => {
    return staff.value?.wageRate 
      || companyDefaults.value?.wage_rate 
      || 32.0
  })

  /**
   * Get effective charge out rate with fallback hierarchy
   */
  const effectiveChargeOutRate = computed((): number => {
    return job.value?.chargeOutRate 
      || companyDefaults.value?.charge_out_rate 
      || 105.0
  })

  /**
   * Calculate wage cost (staff cost)
   */
  const wageCost = computed((): number => {
    const hours = formData.value.hours || 0
    const rate = effectiveWageRate.value
    const multiplier = formData.value.rateMultiplier || 1.0

    if (hours <= 0 || rate <= 0) return 0
    
    return hours * rate * multiplier
  })

  /**
   * Calculate bill amount (client charge)
   */
  const billAmount = computed((): number => {
    const hours = formData.value.hours || 0
    const rate = effectiveChargeOutRate.value

    if (hours <= 0 || rate <= 0) return 0
    
    return hours * rate
  })

  /**
   * Calculate profit margin
   */
  const profitMargin = computed((): number => {
    const bill = billAmount.value
    const cost = wageCost.value

    if (bill <= 0) return 0
    
    return bill - cost
  })

  /**
   * Calculate profit percentage
   */
  const profitPercentage = computed((): number => {
    const bill = billAmount.value
    const margin = profitMargin.value

    if (bill <= 0) return 0
    
    return (margin / bill) * 100
  })

  return {
    effectiveWageRate,
    effectiveChargeOutRate,
    wageCost,
    billAmount,
    profitMargin,
    profitPercentage
  }
}
