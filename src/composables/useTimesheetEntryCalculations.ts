/**
 * Optimized Timesheet Calculations Composable
 *
 * Handles all calculations for the timesheet system following SRP
 * Centralizes business logic for cost calculations
 */

import { type Ref } from 'vue'
import type { CostLine } from '@/types/costing.types'
import type {
  TimesheetEntry,
  TimesheetEntryJobSelectionItem,
  TimesheetEntryStaffMember,
} from '@/types/timesheet.types'
import type { CompanyDefaults } from '@/types/timesheet.types'

export function useTimesheetEntryCalculations(companyDefaults: Ref<CompanyDefaults | null>) {
  /**
   * Get rate multiplier from rate type
   */
  const getRateMultiplier = (rateType: string): number => {
    switch (rateType) {
      case '1.5':
        return 1.5
      case '2.0':
        return 2.0
      case 'Unpaid':
        return 0.0
      default:
        return 1.0 // 'Ord'
    }
  }

  /**
   * Calculate wage amount (staff cost)
   */
  const calculateWage = (hours: number, rateType: string, wageRate: number): number => {
    // Guard clause - early return for invalid inputs
    if (hours <= 0 || wageRate <= 0) return 0

    const multiplier = getRateMultiplier(rateType)
    return Math.round(hours * wageRate * multiplier * 100) / 100
  }

  /**
   * Calculate bill amount (client charge)
   */
  const calculateBill = (hours: number, chargeOutRate: number, billable: boolean): number => {
    // Guard clause - early return for non-billable or invalid inputs
    if (!billable || hours <= 0 || chargeOutRate <= 0) return 0

    return Math.round(hours * chargeOutRate * 100) / 100
  }
  /**
   * Auto-populate job fields when job is selected
   */
  const populateJobFields = (
    entry: TimesheetEntry,
    job: TimesheetEntryJobSelectionItem,
  ): TimesheetEntry => {
    console.log('🔧 Populating job fields:', {
      entry: entry,
      job: job,
    })

    // Auto-set billable based on job status using switch-case
    const billable = (() => {
      switch (job.status) {
        case 'special':
        case 'shop':
          return false
        default:
          return true
      }
    })()

    const result = {
      ...entry,
      jobId: job.id,
      jobNumber: job.job_number,
      client: job.client_name,
      jobName: job.name,
      chargeOutRate: job.charge_out_rate,
      billable,
    }

    console.log('✨ Populated job fields result:', result)
    return result
  }

  /**
   * Create new empty row with smart defaults
   */
  const createNewRow = (staffMember: TimesheetEntryStaffMember, date: string): TimesheetEntry => {
    const defaultWageRate = staffMember.wageRate || companyDefaults.value?.wage_rate || 32.0
    const defaultChargeOutRate = companyDefaults.value?.charge_out_rate || 105.0

    return {
      id: null,
      jobNumber: '',
      client: '',
      jobName: '',
      hours: 0,
      billable: true,
      description: '',
      rate: 'Ord',
      wage: 0,
      bill: 0,
      staffId: staffMember.id,
      date,
      wageRate: defaultWageRate,
      chargeOutRate: defaultChargeOutRate,
      rateMultiplier: 1.0,
      isNewRow: true,
      isModified: false,
    }
  }

  /**
   * Recalculate all amounts for an entry
   */
  const recalculateEntry = (entry: TimesheetEntry): TimesheetEntry => {
    const updatedEntry = { ...entry }

    // Calculate wage
    updatedEntry.wage = calculateWage(entry.hours, entry.rate, entry.wageRate)

    // Calculate bill
    updatedEntry.bill = calculateBill(entry.hours, entry.chargeOutRate, entry.billable)

    return updatedEntry
  }

  /**
   * Validate entry data before saving
   */
  const validateEntry = (entry: TimesheetEntry): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    // Early return guard clauses for validation
    if (!entry.jobNumber.trim()) {
      errors.push('Job is required')
    }

    if (entry.hours <= 0) {
      errors.push('Hours must be greater than 0')
    }

    if (entry.hours > 24) {
      errors.push('Hours cannot exceed 24 per day')
    }

    if (!entry.description.trim()) {
      errors.push('Description is required')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Convert OptimizedTimeEntry to CostLine payload format
   */
  const toCostLinePayload = (entry: TimesheetEntry, jobId: string) => {
    return {
      kind: 'time' as const,
      desc: entry.description,
      quantity: entry.hours.toString(),
      unit_cost: entry.wageRate.toString(),
      unit_rev: entry.chargeOutRate.toString(),
      meta: {
        date: entry.date,
        staff_id: entry.staffId,
        rate_type: entry.rate,
        is_billable: entry.billable,
        job_id: jobId,
        client_name: entry.client,
        job_name: entry.jobName,
      },
    }
  }

  /**
   * Convert CostLine to OptimizedTimeEntry format
   */
  const fromCostLine = (costLine: CostLine, staffId: string): TimesheetEntry => {
    // Guard clause - early return for invalid cost line
    if (!costLine || costLine.kind !== 'time') {
      throw new Error('Invalid cost line for time entry conversion')
    }

    return {
      id: typeof costLine.id === 'number' ? costLine.id : null,
      jobNumber: typeof costLine.meta?.job_number === 'string' ? costLine.meta.job_number : '',
      client: typeof costLine.meta?.client_name === 'string' ? costLine.meta.client_name : '',
      jobName: typeof costLine.meta?.job_name === 'string' ? costLine.meta.job_name : '',
      hours: parseFloat(costLine.quantity) || 0,
      billable: typeof costLine.meta?.is_billable === 'boolean' ? costLine.meta.is_billable : false,
      description: typeof costLine.desc === 'string' ? costLine.desc : '',
      rate: typeof costLine.meta?.rate_type === 'string' ? costLine.meta.rate_type : 'Ord',
      wage: typeof costLine.total_cost === 'number' ? costLine.total_cost : 0,
      bill: typeof costLine.total_rev === 'number' ? costLine.total_rev : 0,
      staffId: typeof staffId === 'string' ? staffId : '',
      date: typeof costLine.meta?.date === 'string' ? costLine.meta.date : '',
      wageRate: typeof costLine.unit_cost === 'string' ? parseFloat(costLine.unit_cost) : 0,
      chargeOutRate: typeof costLine.unit_rev === 'string' ? parseFloat(costLine.unit_rev) : 0,
      rateMultiplier: getRateMultiplier(
        typeof costLine.meta?.rate_type === 'string' ? costLine.meta.rate_type : 'Ord',
      ),
    }
  }

  return {
    // Calculation functions
    calculateWage,
    calculateBill,
    recalculateEntry,

    // Data transformation
    populateJobFields,
    createNewRow,
    toCostLinePayload,
    fromCostLine,

    // Validation
    validateEntry,

    // Utilities
    getRateMultiplier,
  }
}
