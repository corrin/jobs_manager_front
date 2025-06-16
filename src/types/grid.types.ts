/**
 * TypeScript type definitions for timesheet grid components
 */

import type { CostLine } from './costing.types'

export interface GridRowData {
  id: number
  job: string
  jobNumber: string
  jobStatus: string
  description: string
  hours: number
  startTime: string
  endTime: string
  billable: boolean
  rateMultiplier: number
  totalCost: number
  status: string
  notes: string
  originalLine: CostLine
}

export interface GridColumnConfig {
  field: string
  headerName: string
  width?: number
  flex?: number
  editable?: boolean
  sortable?: boolean
  filter?: boolean
  resizable?: boolean
  pinned?: 'left' | 'right'
  cellRenderer?: string | Function
  cellEditor?: string
  cellEditorParams?: any
  valueFormatter?: Function
}

export interface GridActionEvent {
  type: 'edit' | 'delete' | 'duplicate'
  data: GridRowData
}

export interface TimesheetGridFilters {
  staff_id?: string
  cost_date?: string
  job_id?: string
  billable?: boolean
  cost_category?: string
}

export interface GridTheme {
  name: 'alpine' | 'material' | 'balham' | 'fresh'
  darkMode?: boolean
}

// Extended window interface for global AG Grid actions
declare global {
  interface Window {
    editCostLine: (id: number) => void
    deleteCostLine: (id: number) => void
    duplicateCostLine?: (id: number) => void
  }
}
