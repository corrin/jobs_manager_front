import { type Ref } from 'vue'
import { schemas } from '../api/generated/api'
import { debugLog } from '../utils/debug'
import type { z } from 'zod'
import { jobService } from '../services/job.service'
import { useJobsStore } from '../stores/jobs'
import type { TimesheetEntryWithMeta, TimesheetEntryJobSelectionItem } from '../constants/timesheet'
import { toast } from 'vue-sonner'

// Use the generated schemas
type CompanyDefaults = z.infer<typeof schemas.CompanyDefaults>
type CostLine = z.infer<typeof schemas.CostLine>

type StaffLike = {
  id: string
  name?: string | null
  firstName?: string | null
  lastName?: string | null
  first_name?: string | null
  last_name?: string | null
  preferred_name?: string | null
  wageRate?: number | null
  wage_rate?: number | null
}

export function useTimesheetEntryCalculations(companyDefaults: Ref<CompanyDefaults | null>) {
  const resolveStaffWageRate = (staff: StaffLike): number => {
    const value = staff.wageRate ?? staff.wage_rate
    return typeof value === 'number' ? value : 0
  }

  const resolveStaffName = (staff: StaffLike): string => {
    if (staff.name && staff.name.trim()) return staff.name
    const first = staff.preferred_name ?? staff.firstName ?? staff.first_name ?? ''
    const last = staff.lastName ?? staff.last_name ?? ''
    return `${first} ${last}`.trim()
  }

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

    const normalizedJobId = job.id ?? ''
    const normalizedJobNumber = job.job_number ?? 0
    const normalizedJobNumberString = job.job_number != null ? String(job.job_number) : ''
    const normalizedClientName = job.client_name ?? ''
    const normalizedJobName = job.name ?? ''
    const normalizedChargeOutRate = job.charge_out_rate ?? 0

    // Convert job selection item to the expected format for TimesheetEntryWithMeta
    const result = {
      ...entry,
      job_id: normalizedJobId,
      jobId: normalizedJobId,
      job_number: normalizedJobNumber,
      jobNumber: normalizedJobNumberString,
      client_name: normalizedClientName,
      client: normalizedClientName,
      job_name: normalizedJobName,
      jobName: normalizedJobName,
      charge_out_rate: normalizedChargeOutRate,
      chargeOutRate: normalizedChargeOutRate,
    }

    debugLog('✨ Populated job fields result:', result)
    return result
  }

  const createNewRow = (staffMember: StaffLike, date: string): TimesheetEntryWithMeta => {
    if (
      companyDefaults.value?.charge_out_rate == null ||
      companyDefaults.value.charge_out_rate <= 0
    ) {
      debugLog(
        'Invalid Company Defaults value when trying to create new row: ',
        companyDefaults.value,
      )
      toast.error('Invalid data detected when creating new row! Please contact Corrin.')
      throw new Error('Invalid data detected when creating new row! Please contact Corrin.')
    }

    const staffWageRate = resolveStaffWageRate(staffMember)

    if (staffWageRate <= 0) {
      debugLog('Invalid Staff Data value when trying to create new row: ', staffMember)
      toast.error('Invalid data detected when creating new row! Please contact Corrin.')
      throw new Error('Invalid data detected when creating new row! Please contact Corrin.')
    }

    const defaultChargeOutRate = companyDefaults.value.charge_out_rate as number
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
      // Provide a dummy UUID to satisfy schema; real id will come from backend
      id: null,
      kind: 'time' as const,
      desc: '',
      quantity: hours,
      // This is the hourly rate, not the total wage
      unit_cost: staffWageRate,
      unit_rev: defaultChargeOutRate,
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
      jobId: '',
      job_number: 0,
      jobNumber: '',
      job_name: '',
      jobName: '',
      client_name: '',
      client: '',
      charge_out_rate: defaultChargeOutRate,
      chargeOutRate: defaultChargeOutRate,
      // Add UI-specific metadata fields
      tempId: `temp_${Date.now()}`,
      _isSaving: false,
      isNewRow: true,
      isModified: false,
      // Include staff wage rate for grid calculations
      wage_rate: staffWageRate,
      staffId: staffMember.id,
      staffName: resolveStaffName(staffMember),
      date,
      hours,
      description: '',
      rate: 'Ord',
      wage: calculatedWage,
      bill: 0,
      billable: true,
      rateMultiplier,
    }
  }

  const recalculateEntry = (entry: TimesheetEntryWithMeta): TimesheetEntryWithMeta => {
    const updatedEntry = { ...entry }
    const hours = entry.quantity
    const wageRate = entry.unit_cost
    const chargeOutRate = entry.charge_out_rate

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
    const hours = entry.quantity

    if (!entry.job_number) {
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
    const jobs = jobService.searchJobsLocal(useJobsStore().allKanbanJobs, String(entry.job_number))
    const job = Array.isArray(jobs) ? jobs[0] : undefined
    const billable = (() => {
      // Shop jobs are never billable
      if (job && job.shop_job) {
        return false
      }
      // Special status jobs are also not billable
      if (job && job.status === 'special') {
        return false
      }
      return true
    })()
    const metaRec = metaObj as Record<string, unknown>
    if ('is_billable' in metaRec) {
      metaRec['is_billable'] = billable
    }

    return {
      kind: 'time' as const,
      desc: entry.desc,
      quantity: entry.quantity,
      unit_cost: entry.unit_cost,
      unit_rev: entry.unit_rev,
      meta: {
        ...metaRec,
        job_id: jobId,
        client_name: entry.client_name,
        job_name: entry.job_name,
      },
    }
  }

  const fromCostLine = (
    costLine: CostLine,
    staffId: string,
    staffData?: StaffLike,
  ): TimesheetEntryWithMeta => {
    if (!costLine || costLine.kind !== 'time') {
      throw new Error('Invalid cost line for time entry conversion')
    }

    // Type guard for meta object
    const metaObj = costLine.meta && typeof costLine.meta === 'object' ? costLine.meta : {}
    const metaRec = metaObj as Record<string, unknown>

    // Extract wage rate from unit_cost (which should be the staff wage rate)
    const wageRate = costLine.unit_cost ?? 0
    const staffWageRate = staffData ? resolveStaffWageRate(staffData) || wageRate : wageRate
    const metaJobNumber = metaRec['job_number']
    const normalizedJobNumber =
      typeof metaJobNumber === 'number'
        ? metaJobNumber
        : typeof metaJobNumber === 'string'
          ? Number(metaJobNumber) || 0
          : 0
    const normalizedJobNumberString =
      typeof metaJobNumber === 'number' || typeof metaJobNumber === 'string'
        ? String(metaJobNumber)
        : ''

    // Get rate multiplier from backend data (rate_multiplier in meta)
    const backendRateMultiplier =
      typeof metaRec['rate_multiplier'] === 'number' ? (metaRec['rate_multiplier'] as number) : 1.0
    const hours = costLine.quantity ?? 0

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
      id: costLine.id,
      kind: 'time' as const,
      desc: costLine.desc || '',
      // Use native numeric values
      quantity: costLine.quantity ?? 0,
      unit_cost: costLine.unit_cost ?? 0,
      unit_rev: costLine.unit_rev ?? 0,
      total_cost: calculatedWage, // ✅ ALWAYS use calculated wage
      total_rev: costLine.total_rev || 0,
      ext_refs: costLine.ext_refs || {},
      meta: {
        ...metaObj,
        staff_id: staffId,
        rate_multiplier: backendRateMultiplier,
      },
      job_id: typeof metaRec['job_id'] === 'string' ? (metaRec['job_id'] as string) : '',
      jobId: typeof metaRec['job_id'] === 'string' ? (metaRec['job_id'] as string) : '',
      job_number: normalizedJobNumber,
      jobNumber: normalizedJobNumberString,
      job_name: typeof metaRec['job_name'] === 'string' ? (metaRec['job_name'] as string) : '',
      jobName: typeof metaRec['job_name'] === 'string' ? (metaRec['job_name'] as string) : '',
      client_name:
        typeof metaRec['client_name'] === 'string' ? (metaRec['client_name'] as string) : '',
      client: typeof metaRec['client_name'] === 'string' ? (metaRec['client_name'] as string) : '',
      charge_out_rate: costLine.unit_rev ?? 0,
      chargeOutRate: costLine.unit_rev ?? 0,
      // Add UI-specific metadata fields
      tempId: undefined,
      _isSaving: false,
      isNewRow: false,
      isModified: false,
      // Include staff wage rate for consistent grid calculations
      wage_rate: staffWageRate,
      staffId: staffId,
      staffName: staffData ? resolveStaffName(staffData) : '',
      date: typeof metaRec['date'] === 'string' ? (metaRec['date'] as string) : '',
      hours: hours,
      description: costLine.desc || '',
      rate: rateType,
      wage: calculatedWage,
      bill: costLine.total_rev || 0,
      billable:
        typeof metaRec['is_billable'] === 'boolean' ? (metaRec['is_billable'] as boolean) : true,
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
