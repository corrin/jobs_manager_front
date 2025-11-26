import { ref, computed, nextTick, type Ref } from 'vue'
import { schemas } from '@/api/generated/api'
import type { z } from 'zod'

// Using generated schemas where possible
type TimesheetEntryStaffMember = z.infer<typeof schemas.Staff>
import type {
  GridApi,
  ColDef,
  CellValueChangedEvent,
  RowDoubleClickedEvent,
  ICellRendererParams as AgICellRendererParams,
  ValueFormatterParams,
  CellClickedEvent,
  CellKeyDownEvent,
  CellEditingStartedEvent,
  CellEditingStoppedEvent,
} from 'ag-grid-community'
import { customTheme } from '@/plugins/ag-grid'
import { TimesheetEntryJobCellEditor } from '@/components/timesheet/TimesheetEntryJobCellEditor'
import { formatCurrency } from '@/utils/string-formatting'
import { useTimesheetEntryCalculations } from '@/composables/useTimesheetEntryCalculations'
import { TimesheetEntryJobSelectionItem } from '@/constants/timesheet'

type TimesheetEntryGridRowWithSaving = z.infer<typeof schemas.TimesheetCostLine> & {
  isSaving?: boolean
  isModified?: boolean
  isNewRow?: boolean
  tempId?: string
}

// Type aliases for compatibility with existing code
type TimesheetEntry = z.infer<typeof schemas.TimesheetCostLine>
type TimesheetEntryGridRow = z.infer<typeof schemas.TimesheetCostLine>
type CompanyDefaults = z.infer<typeof schemas.CompanyDefaults>

type ResolveStaffById = (id: string) => TimesheetEntryStaffMember | undefined

export function useTimesheetEntryGrid(
  companyDefaults: Ref<CompanyDefaults | null>,
  jobs: Ref<Record<string, unknown>[]>,
  onSaveEntry: (entry: TimesheetEntry) => Promise<void>,
  onDeleteEntry: (id: number) => Promise<void>,
  options?: {
    resolveStaffById?: ResolveStaffById
    onScheduleAutosave?: (entry: TimesheetEntryGridRowWithSaving) => void
    onDescriptionEditChange?: (entry: TimesheetEntryGridRowWithSaving, isEditing: boolean) => void
  },
) {
  const gridApi = ref<GridApi | null>(null)
  const gridData = ref<TimesheetEntryGridRow[]>([])
  const loading = ref(false)
  const selectedRowIndex = ref(-1)
  const calculations = useTimesheetEntryCalculations(companyDefaults)
  const columnDefs = ref<ColDef<TimesheetEntryGridRow, unknown>[]>([
    {
      headerName: 'Job',
      field: 'jobNumber',
      width: 200,
      editable: true,
      cellEditor: TimesheetEntryJobCellEditor,
      cellEditorParams: {
        jobs: jobs,
      },
      valueFormatter: (params) => {
        if (!params.value) return ''
        const job = jobs.value?.find((j) => j.job_number === params.value)
        return job ? `#${job.job_number} - ${job.name}` : `#${params.value}`
      },
      cellStyle: {
        color: '#1F2937',
        fontWeight: '500',
      },
    },
    {
      headerName: 'Client',
      field: 'client',
      width: 140,
      editable: false,
      cellStyle: { color: '#6B7280', fontSize: '13px' },
    },
    {
      headerName: 'Job Name',
      field: 'jobName',
      flex: 1,
      minWidth: 180,
      editable: false,
      cellStyle: { color: '#374151', fontWeight: '500' },
    },
    {
      headerName: 'Hours',
      field: 'hours',
      width: 80,
      editable: true,
      cellEditor: 'agNumberCellEditor',
      cellEditorParams: {
        min: 0,
        max: 24,
        step: 0.25,
        precision: 2,
      },
      cellRenderer: (params: AgICellRendererParams) => {
        const hours = params.value || 0
        const isOvertime = hours > 8
        const color = isOvertime ? '#DC2626' : '#374151'
        const weight = isOvertime ? '600' : '400'
        return `<span style="color: ${color}; font-weight: ${weight};">${hours.toFixed(2)}h</span>`
      },
      cellClass: 'text-right',
    },
    {
      headerName: 'Billable',
      field: 'billable',
      width: 80,
      editable: true,
      cellEditor: 'agCheckboxCellEditor',
      cellRenderer: 'agCheckboxCellRenderer',
      cellClass: 'text-center',
    },
    {
      headerName: 'Description',
      field: 'description',
      flex: 2,
      minWidth: 200,
      autoHeight: true,
      wrapText: true,
      editable: true,
      cellEditor: 'agTextCellEditor',
      cellEditorParams: {
        maxLength: 500,
      },
    },
    {
      headerName: 'Rate',
      field: 'rate',
      width: 90,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['Ord', '1.5', '2.0', 'Unpaid'],
      },
      cellRenderer: (params: AgICellRendererParams) => {
        const rate = params.value || 'Ord'
        const colors = {
          Ord: '#374151',
          '1.5': '#D97706',
          '2.0': '#DC2626',
          Unpaid: '#6B7280',
        }
        const displayText = rate === 'Ord' ? 'Ord' : rate === 'Unpaid' ? 'Unpaid' : `${rate}x`
        return `<span style="color: ${colors[rate as keyof typeof colors]}; font-weight: 500;">${displayText}</span>`
      },
    },
    {
      headerName: 'Wage',
      field: 'wage',
      width: 100,
      editable: false,
      valueFormatter: (params: ValueFormatterParams) => formatCurrency(params.value || 0),
      cellClass: 'text-right',
      cellStyle: { color: '#059669', fontWeight: '600' },
    },
    {
      headerName: 'Bill',
      field: 'bill',
      width: 100,
      editable: false,
      valueFormatter: (params: ValueFormatterParams) => formatCurrency(params.value || 0),
      cellClass: 'text-right',
      cellStyle: { color: '#2563EB', fontWeight: '600' },
    },
    {
      headerName: 'Delete',
      width: 60,
      pinned: 'right',
      field: 'delete' as unknown as undefined,
      editable: false,
      cellRenderer: (params: AgICellRendererParams) => {
        if (!params.data || !params.data.id) return ''
        return `
          <button title='Delete this row' class='delete-row-btn' data-id='${params.data.id}'
            style='background:transparent;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;width:100%;height:32px;font-size:20px;line-height:1;'
          >🗑️</button>
        `
      },
      cellStyle: { textAlign: 'center' },
      sortable: false,
      filter: false,
      resizable: false,
      onCellClicked: (params: CellClickedEvent) => {
        const rowId = params.data?.id
        if (!rowId) return
        const rowIndex = gridData.value.findIndex(
          (row: TimesheetEntryGridRow) => String(row.id) === String(rowId),
        )
        if (rowIndex === -1) return
        deleteRow(rowIndex)
      },
    },
  ])

  const gridOptions = computed(() => ({
    theme: customTheme,
    columnDefs: columnDefs.value,
    rowData: gridData.value,
    defaultColDef: {
      sortable: true,
      filter: false,
      resizable: true,
    },
    rowHeight: 48,
    headerHeight: 44,
    animateRows: true,
    suppressScrollOnNewData: true,
    popupParent: document.body,
    onCellValueChanged: (event: CellValueChangedEvent) => {
      handleCellValueChanged(event)
    },
    onRowDoubleClicked: handleRowDoubleClicked,
    onCellClicked: handleCellClicked,
    onCellKeyDown: handleCellKeyDown,
    onCellEditingStarted: handleCellEditingStarted,
    onCellEditingStopped: handleCellEditingStopped,
    onGridPreDestroyed: () => gridPreDestroy(),
    getRowStyle: (params: { data?: TimesheetEntryGridRow }) => {
      if (!params.data) return undefined
      if (params.data.isNewRow) {
        return { backgroundColor: '#F0F9FF', border: '1px dashed #3B82F6' }
      }
      return undefined
    },
  }))

  // AG Grid API guards
  function isApiAlive(api?: GridApi | null): api is GridApi {
    const typed = api as unknown as GridApi & { isDestroyed?: () => boolean }
    return !!typed && !typed.isDestroyed?.()
  }

  // Expose a pre-destroy hook to clear local API reference
  function gridPreDestroy(): void {
    gridApi.value = null
  }

  function handleCellEditingStarted(event: CellEditingStartedEvent): void {
    if (event.colDef.field !== 'description' || !event.data) return
    options?.onDescriptionEditChange?.(event.data as TimesheetEntryGridRowWithSaving, true)
  }

  function handleCellEditingStopped(event: CellEditingStoppedEvent): void {
    if (event.colDef.field !== 'description' || !event.data) return

    const row = event.data as TimesheetEntryGridRowWithSaving
    options?.onDescriptionEditChange?.(row, false)

    if (!row.isModified) return

    const entry = createEntryFromRowData(row)
    if (!isRowComplete(entry) || isRowEmpty(entry)) return

    options?.onScheduleAutosave?.(row)
  }

  async function handleCellClicked(event: CellClickedEvent): Promise<void> {
    const rowIndex = event.node.rowIndex
    const colKey = event.colDef.field
    if (!isApiAlive(event.api)) return
    if (colKey && event.colDef.editable && typeof rowIndex === 'number' && rowIndex >= 0) {
      event.api.startEditingCell({ rowIndex, colKey })
      event.api.setFocusedCell(rowIndex, colKey)
    }
  }

  function handleJobSelection(
    rowData: TimesheetEntryGridRow & { rowIndex: number },
    job: TimesheetEntryJobSelectionItem,
  ): void {
    const entry = createEntryFromRowData(rowData)
    const populated = calculations.populateJobFields(entry, job)
    const recalculated = calculations.recalculateEntry(populated)
    updateRowData(rowData.rowIndex, recalculated)
  }

  function isDuplicateEntry(entry: TimesheetEntry, ignoreIndex?: number): boolean {
    return (gridData.value as TimesheetEntryGridRowWithSaving[]).some((row, idx) => {
      if (ignoreIndex !== undefined && idx === ignoreIndex) return false

      // If both entries have IDs and they're the same, it's the same entry (not a duplicate)
      if (row.id && entry.id && row.id === entry.id) return false

      // ✅ FIXED: Only consider it a duplicate if it's a truly NEW entry without ID
      // Existing entries with IDs should never be considered duplicates, even if data matches
      if (entry.id) {
        return false // Existing entries with IDs are never duplicates
      }

      // Only check for duplicates on truly new entries (no ID)
      return (
        row.jobNumber === entry.jobNumber &&
        row.date === entry.date &&
        row.staffId === entry.staffId &&
        row.description.trim() === entry.description.trim() &&
        !row.isSaving &&
        row.id // Only compare against existing entries that have IDs
      )
    })
  }

  async function handleCellValueChanged(event: CellValueChangedEvent): Promise<void> {
    const { data, colDef, newValue, oldValue } = event
    if (newValue === oldValue) return

    try {
      loading.value = true

      // Always recalculate when key fields change
      if (
        colDef.field &&
        ['hours', 'rate', 'billable', 'jobNumber', 'jobId', 'chargeOutRate', 'wageRate'].includes(
          colDef.field,
        )
      ) {
        // Create entry from current row data and recalculate
        const entry = createEntryFromRowData(data)

        // Update the row data with recalculated values
        if (event.node.rowIndex !== null && event.node.rowIndex !== undefined) {
          nextTick(() => updateRowData(event.node.rowIndex, entry))
        }
      }

      // Get the updated entry after recalculation
      const updatedEntry = createEntryFromRowData(data)

      // Skip if already saving
      if ((data as TimesheetEntryGridRowWithSaving).isSaving) return

      // Handle existing row updates - mark as modified and schedule autosave
      if (!data.isNewRow && updatedEntry.id && !isRowEmpty(updatedEntry)) {
        data.isModified = true
        console.log('🔄 Existing row marked as modified:', updatedEntry.id)
        options?.onScheduleAutosave?.(data as TimesheetEntryGridRowWithSaving)
      }

      // Handle new row completion - mark as modified and schedule autosave
      if (data.isNewRow && isRowComplete(updatedEntry)) {
        if (isDuplicateEntry(updatedEntry)) {
          return
        }
        data.isModified = true
        data.isNewRow = false // Convert to regular row but don't save yet
        console.log('✏️ New row marked as modified:', updatedEntry.description || '')
        options?.onScheduleAutosave?.(data as TimesheetEntryGridRowWithSaving)

        // Ensure there's always an empty row at the end
        nextTick(() => {
          const staffData = options?.resolveStaffById?.(data.staffId || '')
          ensureEmptyRow(data.staffId, staffData)
        })
      }
    } catch (error) {
      console.error('Error in handleCellValueChanged:', error)
      if (isApiAlive(event.api)) {
        event.api.refreshCells({ rowNodes: [event.node], force: true })
      }
    } finally {
      loading.value = false
    }
  }

  function handleRowDoubleClicked(event: RowDoubleClickedEvent): void {
    if (event.rowIndex === null) return
    if (!isApiAlive(event.api)) return
    // Focus on the cell that was double-clicked
    const clickedCol = event.column?.getColDef()
    if (!clickedCol || !clickedCol.editable || typeof clickedCol.field !== 'string') return
    event.api.startEditingCell({
      rowIndex: event.rowIndex,
      colKey: clickedCol.field,
    })
  }

  function handleCellKeyDown(params: CellKeyDownEvent): void {
    const { event, api, node, column } = params
    if (!event || !(event instanceof KeyboardEvent) || node.rowIndex == null) {
      return
    }
    if (!isApiAlive(api)) {
      return
    }
    switch (event.key) {
      case 'Escape':
        if (!column.getColDef().editable) {
          return
        }
        api.stopEditing(true)
        break
      case 'Enter':
        if (event.shiftKey) {
          if (column.getColId() === 'billable') {
            event.preventDefault()
            node.data.billable = !node.data.billable
            api.refreshCells({
              rowNodes: [node],
              force: true,
            })
            const entry = createEntryFromRowData(node.data)
            const recalculated = calculations.recalculateEntry(entry)
            updateRowData(node.rowIndex!, recalculated)
          }
          break
        }
        break
      default:
        break
    }
  }

  function effectiveWageRateForRow(rowData: TimesheetEntryGridRow): number {
    const candidate = rowData.wageRate ?? 0
    if (candidate > 0) return candidate
    const byRowStaff = rowData.staffId ? resolveStaffById?.(rowData.staffId) : undefined

    if (byRowStaff?.wageRate && byRowStaff.wageRate > 0) return byRowStaff.wageRate

    if (currentStaffRef.value?.wageRate && currentStaffRef.value.wageRate > 0) {
      return currentStaffRef.value.wageRate
    }

    return 0
  }

  function createEntryFromRowData(rowData: TimesheetEntryGridRow): TimesheetEntry {
    const hours = rowData.hours || 0
    const wageRate = effectiveWageRateForRow(rowData)
    const chargeOutRate = rowData.chargeOutRate || 0
    const rate = rowData.rate || 'Ord'
    const rateMultiplier = calculations.getRateMultiplier(rate)
    const billable = rowData.billable ?? true

    let calculatedWage = 0
    if (hours > 0 && wageRate > 0)
      calculatedWage = Math.round(hours * rateMultiplier * wageRate * 100) / 100

    let calculatedBill = 0
    if (billable && hours > 0 && chargeOutRate > 0) {
      calculatedBill = Math.round(hours * chargeOutRate * 100) / 100
    }

    console.log('🧮 Grid wage calculation:', {
      hours,
      rateMultiplier,
      wageRate,
      calculatedWage,
      formula: `${hours} × ${rateMultiplier} × ${wageRate} = ${calculatedWage}`,
    })

    return {
      id: rowData.id,
      jobId: rowData.jobId || '',
      jobNumber: rowData.jobNumber || '',
      client: rowData.client || '',
      jobName: rowData.jobName || '',
      hours,
      billable,
      description: rowData.description || '',
      rate,
      wage: calculatedWage,
      bill: calculatedBill,
      staffId: rowData.staffId || '',
      date: rowData.date || '',
      wageRate,
      chargeOutRate,
      rateMultiplier,
      isNewRow: rowData.isNewRow,
    }
  }

  function updateRowData(rowIndex: number | null, entry: TimesheetEntry): void {
    if (!isApiAlive(gridApi.value) || rowIndex == null) return
    const rowNode = gridApi.value!.getRowNode(String(rowIndex))
    if (rowNode) {
      Object.assign(rowNode.data, entry)
      nextTick(() => {
        if (isApiAlive(gridApi.value)) {
          gridApi.value!.refreshCells({ rowNodes: [rowNode] })
        }
      })
    }
  }

  function isRowComplete(entry: TimesheetEntry): boolean {
    return !!(entry.jobNumber && entry.hours > 0)
  }

  function isRowEmpty(entry: TimesheetEntry): boolean {
    return (
      !entry.jobNumber &&
      entry.hours === 0 &&
      (!entry.description || entry.description.trim() === '')
    )
  }

  function ensureEmptyRow(staffId?: string, staffData?: TimesheetEntryStaffMember): void {
    // Check if we have any rows
    if (gridData.value.length === 0) {
      addNewRow(staffId, undefined, staffData)
      return
    }

    // Check if the last row is complete (not empty and not new)
    const lastRow = gridData.value[gridData.value.length - 1]
    const lastEntry = createEntryFromRowData(lastRow)

    if (!lastRow.isNewRow && isRowComplete(lastEntry)) {
      // Last row is complete, add a new empty row
      addNewRow(staffId, undefined, staffData)
    }
  }

  async function deleteRow(rowIndex: number): Promise<void> {
    if (!gridApi.value) return
    const [rowDataToRemove] = gridData.value.splice(rowIndex, 1)
    if (rowDataToRemove) {
      if (isApiAlive(gridApi.value)) {
        gridApi.value!.applyTransaction({ remove: [rowDataToRemove] })
      }
    }
    if (rowDataToRemove && rowDataToRemove.isNewRow) {
      clearRow(rowIndex)
      // Ensure there's always an empty row at the end
      nextTick(() => {
        ensureEmptyRow()
      })
      return
    }
    try {
      loading.value = true
      if (rowDataToRemove && rowDataToRemove.id) {
        await onDeleteEntry(rowDataToRemove.id)
      }
    } catch (error) {
      gridData.value.splice(rowIndex, 0, rowDataToRemove)
      if (isApiAlive(gridApi.value)) {
        gridApi.value!.applyTransaction({ add: [rowDataToRemove] })
      }
      throw error
    } finally {
      loading.value = false
      // Ensure there's always an empty row at the end
      nextTick(() => {
        ensureEmptyRow()
      })
    }
  }

  function clearRow(
    rowIndex: number,
    staffId?: string,
    staffData?: TimesheetEntryStaffMember,
  ): void {
    if (!isApiAlive(gridApi.value)) return
    const rowNode = gridApi.value!.getRowNode(String(rowIndex))
    if (rowNode) {
      const currentStaffId = staffId || rowNode.data.staffId || ''
      const date = rowNode.data.date || new Date().toISOString().split('T')[0]

      // Use actual staff data if provided, otherwise create minimal staff member
      const staffMember =
        staffData ||
        ({
          id: currentStaffId,
          name: rowNode.data.staffName || '',
          wageRate: rowNode.data.wageRate || 0, // Preserve existing wage rate if available
        } as TimesheetEntryStaffMember)

      const newRow = calculations.createNewRow(staffMember, date)
      Object.assign(rowNode.data, newRow)
      nextTick(() => {
        if (isApiAlive(gridApi.value)) {
          gridApi.value!.refreshCells({ rowNodes: [rowNode] })
        }
      })
    }
  }

  function setGridApi(api: GridApi): void {
    gridApi.value = api
  }

  function loadData(
    entries: TimesheetEntry[],
    staffId?: string,
    staffData?: TimesheetEntryStaffMember,
  ): void {
    // Ensure all loaded entries include the staff wage rate for consistent calculations
    const rows: TimesheetEntryGridRow[] = entries.map((entry) => {
      const resolved = entry.staffId ? resolveStaffById?.(entry.staffId) : undefined
      const wage = (staffData?.wageRate ?? entry.wageRate ?? resolved?.wageRate ?? 0) || 0
      return {
        ...entry,
        wageRate: wage,
        staffId: staffData?.id || entry.staffId || staffId,
        staffName: staffData?.name || entry.staffName,
      }
    })

    gridData.value = rows
    if (isApiAlive(gridApi.value)) {
      const allRowData: TimesheetEntryGridRow[] = []
      gridApi.value!.forEachNode((node: { data?: TimesheetEntryGridRow }) => {
        if (node.data) allRowData.push(node.data)
      })
      if (allRowData.length > 0) {
        gridApi.value!.applyTransaction({ remove: allRowData })
      }
      if (gridData.value.length > 0) {
        gridApi.value!.applyTransaction({ add: gridData.value })
      }
    }

    // Ensure there's always an empty row at the end
    ensureEmptyRow(staffId, staffData)
  }

  function addNewRow(staffId?: string, date?: string, staffData?: TimesheetEntryStaffMember): void {
    const currentDate = date || new Date().toISOString().split('T')[0]

    // MUST use actual staff data - NO FALLBACKS
    if (!staffData) {
      console.error('❌ addNewRow called without staffData - this will cause wage rate issues')
      return
    }

    const newRow = calculations.createNewRow(staffData, currentDate)
    gridData.value.push(newRow)
    if (isApiAlive(gridApi.value)) {
      gridApi.value!.applyTransaction({ add: [newRow] })
    } else {
      nextTick(() => {
        if (isApiAlive(gridApi.value)) {
          gridApi.value!.applyTransaction({ add: [newRow] })
        }
      })
    }

    // After adding a row, ensure there's still an empty row at the end
    nextTick(() => {
      ensureEmptyRow(staffId, staffData)
    })
  }

  function getSelectedEntry(): TimesheetEntry | null {
    if (!isApiAlive(gridApi.value) || selectedRowIndex.value < 0) return null
    const rowNode = gridApi.value!.getRowNode(String(selectedRowIndex.value))
    return rowNode ? createEntryFromRowData(rowNode.data) : null
  }

  function handleKeyboardShortcut(
    event: KeyboardEvent,
    staffId?: string,
    staffData?: TimesheetEntryStaffMember,
  ): boolean {
    if (!gridApi.value) return false
    if (event.shiftKey && event.key === 'N') {
      event.preventDefault()
      // ✅ FIXED: Only add new row if we have staffData
      if (staffData) {
        addNewRow(staffId, undefined, staffData)
      } else {
        console.error('❌ Cannot add new row without staffData')
      }
      return true
    }
    if (event.ctrlKey && event.key === 's') {
      event.preventDefault()
      return true
    }
    if (event.key === 'Delete' && selectedRowIndex.value >= 0) {
      event.preventDefault()
      deleteRow(selectedRowIndex.value)
      return true
    }
    return false
  }

  function getGridData(): TimesheetEntryGridRow[] {
    if (!isApiAlive(gridApi.value)) return []
    const data: TimesheetEntryGridRow[] = []
    gridApi.value!.forEachNode((node: { data?: TimesheetEntryGridRow }) => {
      if (node.data && !node.data.isEmptyRow) {
        data.push(node.data)
      }
    })
    return data
  }

  const resolveStaffById = options?.resolveStaffById
  const currentStaffRef = ref<TimesheetEntryStaffMember | null>(null)

  function setCurrentStaff(staff?: TimesheetEntryStaffMember | null) {
    currentStaffRef.value = staff ?? null
  }

  return {
    gridData,
    loading,
    gridOptions,
    columnDefs,
    setGridApi,
    loadData,
    addNewRow,
    getSelectedEntry,
    getGridData,
    handleKeyboardShortcut: (
      event: KeyboardEvent,
      staffId?: string,
      staffData?: TimesheetEntryStaffMember,
    ) => handleKeyboardShortcut(event, staffId, staffData),
    handleJobSelection,
    handleCellValueChanged,
    isDuplicateEntry,
    isRowComplete,
    hasData: computed(() => gridData.value.length > 0),
    setCurrentStaff,
    ensureEmptyRow,
    gridPreDestroy,
  }
}
