import { type Ref } from 'vue'
import { schemas } from '../api/generated/api'
import { debugLog } from '../utils/debug'
import type { z } from 'zod'
import { jobService } from '@/services/job.service'
import { useJobsStore } from '../stores/jobs'
import type { TimesheetEntryWithMeta, TimesheetEntryJobSelectionItem } from '@/constants/timesheet'
import { toast } from 'vue-sonner'

// Use the generated schemas
type CompanyDefaults = z.infer<typeof schemas.CompanyDefaults>
type CostLine = z.infer<typeof schemas.CostLine>
type Staff = z.infer<typeof schemas.Staff>

export function useTimesheetEntryCalculations(companyDefaults: Ref<CompanyDefaults | null>) {
  const getRateMultiplier = (rateType: string): number => {
    switch (rateType) {
      case '1.5':
        return 1.5
      case '2.0':
        return 2.0
      case 'Unpaid':
        return 0.0
      default:
        return 1.0
    }
  }

  const calculateWage = (hours: number, rateType: string, wageRate: number): number => {
    if (hours <= 0 || wageRate <= 0) return 0

    const multiplier = getRateMultiplier(rateType)

    const calculatedWage = Math.round(hours * multiplier * wageRate * 100) / 100

    debugLog('💰 Calculating wage:', {
      hours,
      rateType,
      multiplier,
      wageRate,
      calculatedWage,
      formula: `${hours} × ${multiplier} × ${wageRate} = ${calculatedWage}`,
    })

    return calculatedWage
  }

  const calculateBill = (hours: number, chargeOutRate: number, billable: boolean): number => {
    if (!billable || hours <= 0 || chargeOutRate <= 0) return 0

    return Math.round(hours * chargeOutRate * 100) / 100
  }

  const populateJobFields = (
    entry: TimesheetEntryWithMeta,
    job: TimesheetEntryJobSelectionItem,
  ): TimesheetEntryWithMeta => {
    debugLog('🔧 Populating job fields:', {
      entry: entry,
      job: job,
    })

    // Convert job selection item to the expected format for TimesheetEntryWithMeta
    const result = {
      ...entry,
      job_id: job.id,
      job_number: job.job_number,
      client_name: job.client_name,
      job_name: job.name,
      charge_out_rate: job.charge_out_rate.toString(),
    }

    debugLog('✨ Populated job fields result:', result)
    return result
  }

  const createNewRow = (staffMember: Staff, date: string): TimesheetEntryWithMeta => {
    if (
      companyDefaults.value?.charge_out_rate == undefined ||
      parseFloat(companyDefaults.value?.charge_out_rate || '0') <= 0
    ) {
      debugLog(
        'Invalid Company Defaults value when trying to create new row: ',
        companyDefaults.value,
      )
      toast.error('Invalid data detected when creating new row! Please contact Corrin.')
      return
    }

    if (staffMember.wageRate == undefined || parseFloat(staffMember.wageRate || '0') <= 0) {
      debugLog('Invalid Staff Data value when trying to create new row: ', staffMember)
      toast.error('Invalid data detected when creating new row! Please contact Corrin.')
      return
    }

    const staffWageRate = parseFloat(staffMember.wageRate)
    const defaultChargeOutRate = companyDefaults.value?.charge_out_rate
    const hours = 0
    const rateMultiplier = 1.0 // Default 'Ord' rate

    let calculatedWage = 0
    if (hours > 0 && staffWageRate > 0)
      calculatedWage = Math.round(hours * rateMultiplier * staffWageRate * 100) / 100

    debugLog('🏗️ Creating new row with correct wage calculation:', {
      staffId: staffMember.id,
      staffWageRate,
      hours,
      rateMultiplier,
      calculatedWage,
      formula: `${hours} × ${rateMultiplier} × ${staffWageRate} = ${calculatedWage}`,
      defaultChargeOutRate,
      companyDefaults: companyDefaults.value,
    })

    return {
      id: null, // Will be set by backend
      kind: 'time' as const,
      desc: '',
      quantity: hours.toString(),
      unit_cost: staffWageRate.toString(), // This is the hourly rate, not the total wage
      unit_rev: defaultChargeOutRate.toString(),
      total_cost: calculatedWage,
      total_rev: 0,
      ext_refs: {},
      meta: {
        date,
        staff_id: staffMember.id,
        rate_type: 'Ord',
        rate_multiplier: rateMultiplier,
        is_billable: true,
      },
      job_id: '',
      job_number: '',
      job_name: '',
      client_name: '',
      charge_out_rate: defaultChargeOutRate.toString(),
      // Add UI-specific metadata fields
      tempId: `temp_${Date.now()}`,
      _isSaving: false,
      isNewRow: true,
      isModified: false,
      // Include staff wage rate for grid calculations
      wageRate: staffWageRate,
      staffId: staffMember.id,
      staffName: staffMember.name || '',
      date,
      hours,
      description: '',
      rate: 'Ord',
      wage: calculatedWage,
      bill: 0,
      billable: true,
      chargeOutRate: defaultChargeOutRate,
      rateMultiplier,
    }
  }

  const recalculateEntry = (entry: TimesheetEntryWithMeta): TimesheetEntryWithMeta => {
    const updatedEntry = { ...entry }
    const hours = parseFloat(entry.quantity)
    const wageRate = parseFloat(entry.unit_cost)
    const chargeOutRate = parseFloat(entry.charge_out_rate)

    // Type-safe access to meta properties
    const meta = entry.meta as Record<string, unknown> | undefined
    const rateType = typeof meta?.rate_type === 'string' ? meta.rate_type : 'Ord'
    const billable = meta?.is_billable !== false

    updatedEntry.total_cost = calculateWage(hours, rateType, wageRate)
    updatedEntry.total_rev = calculateBill(hours, chargeOutRate, billable)

    return updatedEntry
  }

  const validateEntry = (entry: TimesheetEntryWithMeta): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []
    const hours = parseFloat(entry.quantity)

    if (!entry.job_number.trim()) {
      errors.push('Job is required')
    }

    if (hours <= 0) {
      errors.push('Hours must be greater than 0')
    }

    if (hours > 24) {
      errors.push('Hours cannot exceed 24 per day')
    }

    if (!entry.desc.trim()) {
      errors.push('Description is required')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  const toCostLinePayload = (entry: TimesheetEntryWithMeta, jobId: string) => {
    // Type guard for meta object
    const metaObj = entry.meta && typeof entry.meta === 'object' ? entry.meta : {}
    const job = jobService.serachJobsLocal(useJobsStore().allKanbanJobs, entry.job_number)
    const billable = (() => {
      // Shop jobs are never billable
      if (job.shop_job) {
        return false
      }

      // Special status jobs are also not billable
      if (job.status === 'special') {
        return false
      }

      return true
    })()
    if ((metaObj as Record<string, unknown>).is_billable) {
      ;(metaObj as Record<string, unknown>).is_billable = billable
    }

    return {
      kind: 'time' as const,
      desc: entry.desc,
      quantity: entry.quantity,
      unit_cost: entry.unit_cost,
      unit_rev: entry.unit_rev,
      meta: {
        ...metaObj,
        job_id: jobId,
        client_name: entry.client_name,
        job_name: entry.job_name,
      },
    }
  }

  const fromCostLine = (
    costLine: CostLine,
    staffId: string,
    staffData?: Staff,
  ): TimesheetEntryWithMeta => {
    if (!costLine || costLine.kind !== 'time') {
      throw new Error('Invalid cost line for time entry conversion')
    }

    // Type guard for meta object
    const metaObj = costLine.meta && typeof costLine.meta === 'object' ? costLine.meta : {}

    // Extract wage rate from unit_cost (which should be the staff wage rate)
    const wageRate =
      typeof costLine.unit_cost === 'string'
        ? parseFloat(costLine.unit_cost)
        : costLine.unit_cost || 0
    const staffWageRate = staffData?.wageRate
      ? typeof staffData.wageRate === 'string'
        ? parseFloat(staffData.wageRate)
        : staffData.wageRate
      : wageRate

    // Get rate multiplier from backend data (rate_multiplier in meta)
    const backendRateMultiplier =
      metaObj && 'rate_multiplier' in metaObj && typeof metaObj.rate_multiplier === 'number'
        ? metaObj.rate_multiplier
        : 1.0
    const hours = parseFloat(costLine.quantity || '0')

    // ✅ ALWAYS USE CORRECT FORMULA: hours × rate_multiplier × staff_wage_rate
    const calculatedWage =
      hours > 0 && staffWageRate > 0
        ? Math.round(hours * backendRateMultiplier * staffWageRate * 100) / 100
        : 0

    debugLog('🔄 Converting from CostLine with correct wage calculation:', {
      costLineId: costLine.id,
      hours,
      staffWageRate,
      backendRateMultiplier,
      calculatedWage,
      formula: `${hours} × ${backendRateMultiplier} × ${staffWageRate} = ${calculatedWage}`,
      backendWage: costLine.total_cost,
    })

    // Determine rate type from multiplier
    const rateType = (() => {
      switch (backendRateMultiplier) {
        case 1.5:
          return '1.5'
        case 2.0:
          return '2.0'
        case 0.0:
          return 'Unpaid'
        default:
          return 'Ord'
      }
    })()

    return {
      id: costLine.id || null,
      kind: 'time' as const,
      desc: costLine.desc || '',
      quantity: costLine.quantity || '0',
      unit_cost: costLine.unit_cost || '0',
      unit_rev: costLine.unit_rev || '0',
      total_cost: calculatedWage, // ✅ ALWAYS use calculated wage
      total_rev: costLine.total_rev || 0,
      ext_refs: costLine.ext_refs || {},
      meta: {
        ...metaObj,
        staff_id: staffId,
        rate_multiplier: backendRateMultiplier,
      },
      job_id:
        metaObj && 'job_id' in metaObj && typeof metaObj.job_id === 'string' ? metaObj.job_id : '',
      job_number:
        metaObj && 'job_number' in metaObj && typeof metaObj.job_number === 'string'
          ? metaObj.job_number
          : '',
      job_name:
        metaObj && 'job_name' in metaObj && typeof metaObj.job_name === 'string'
          ? metaObj.job_name
          : '',
      client_name:
        metaObj && 'client_name' in metaObj && typeof metaObj.client_name === 'string'
          ? metaObj.client_name
          : '',
      charge_out_rate: costLine.unit_rev || '0',
      // Add UI-specific metadata fields
      tempId: undefined,
      _isSaving: false,
      isNewRow: false,
      isModified: false,
      // Include staff wage rate for consistent grid calculations
      wageRate: staffWageRate,
      staffId: staffId,
      staffName: staffData?.name || '',
      date: metaObj && 'date' in metaObj && typeof metaObj.date === 'string' ? metaObj.date : '',
      hours: hours,
      description: costLine.desc || '',
      rate: rateType,
      wage: calculatedWage, // ✅ ALWAYS use calculated wage
      bill: costLine.total_rev || 0,
      billable: metaObj && 'is_billable' in metaObj ? Boolean(metaObj.is_billable) : true,
      chargeOutRate: parseFloat(costLine.unit_rev || '0'),
      rateMultiplier: backendRateMultiplier,
    }
  }

  return {
    calculateWage,
    calculateBill,
    recalculateEntry,

    populateJobFields,
    createNewRow,
    toCostLinePayload,
    fromCostLine,

    validateEntry,

    getRateMultiplier,
  }
}
