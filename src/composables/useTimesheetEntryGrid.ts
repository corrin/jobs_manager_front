/**
 * Optimized Timesheet Grid Composable
 *
 * Manages AG Grid state and interactions for the timesheet
 * Follows SRP by handling only grid-related logic
 */

import { ref, computed, nextTick, type Ref } from 'vue'
import type {
  GridApi,
  ColDef,
  CellValueChangedEvent,
  RowDoubleClickedEvent,
  ICellRendererParams as AgICellRendererParams,
  ValueFormatterParams,
  CellClickedEvent,
  CellKeyDownEvent,
} from 'ag-grid-community'
import { customTheme } from '@/plugins/ag-grid'
import { TimesheetEntryJobCellEditor } from '@/components/timesheet/TimesheetEntryJobCellEditor'
import { useTimesheetEntryCalculations } from '@/composables/useTimesheetEntryCalculations'
import type {
  TimesheetEntry,
  TimesheetEntryGridRow,
  TimesheetEntryJobSelectionItem,
  TimesheetEntryStaffMember,
} from '@/types/timesheet.types'
import type { CompanyDefaults } from '@/types/timesheet.types'

export function useTimesheetEntryGrid(
  companyDefaults: Ref<CompanyDefaults | null>,
  onSaveEntry: (entry: TimesheetEntry) => Promise<void>,
  onDeleteEntry: (id: number) => Promise<void>,
) {
  // State
  const gridApi = ref<GridApi | null>(null)
  const gridData = ref<TimesheetEntryGridRow[]>([])
  const loading = ref(false)
  const selectedRowIndex = ref(-1)

  // Calculations composable
  const calculations = useTimesheetEntryCalculations(companyDefaults)

  // Column definitions following clean structure
  const columnDefs = ref<ColDef<TimesheetEntryGridRow, unknown>[]>([
    {
      headerName: 'Job',
      field: 'jobNumber',
      width: 120,
      editable: true,
      cellEditor: TimesheetEntryJobCellEditor,
      cellEditorPopup: true,
      pinned: 'left',
      cellRenderer: (params: AgICellRendererParams) => {
        const { jobNumber, client } = params.data as TimesheetEntryGridRow
        if (!jobNumber) return '<em style="color: #9CA3AF;">Select job...</em>'

        return `
          <div style="display: flex; flex-direction: column;">
            <span style="font-weight: 600; color: #1F2937;">#${jobNumber}</span>
            <span style="font-size: 11px; color: #6B7280;">${client}</span>
          </div>
        `
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
      valueFormatter: (params: ValueFormatterParams) => `$${(params.value || 0).toFixed(2)}`,
      cellClass: 'text-right',
      cellStyle: { color: '#059669', fontWeight: '600' },
    },
    {
      headerName: 'Bill',
      field: 'bill',
      width: 100,
      editable: false,
      valueFormatter: (params: ValueFormatterParams) => `$${(params.value || 0).toFixed(2)}`,
      cellClass: 'text-right',
      cellStyle: { color: '#2563EB', fontWeight: '600' },
    },
    {
      headerName: 'Delete',
      field: undefined,
      width: 70,
      pinned: 'right',
      editable: false,
      cellRenderer: (params: AgICellRendererParams) => {
        if (!params.data || !params.data.id) return ''
        return `<button title='Delete this row' class='delete-row-btn' data-id='${params.data.id}' style='background:transparent;border:none;cursor:pointer;padding:0 8px;font-size:18px;'>🗑️</button>`
      },
      cellStyle: { textAlign: 'center' },
      sortable: false,
      filter: false,
      resizable: false,
      onCellClicked: (event: CellClickedEvent) => {
        if (event.data && event.data.id) {
          onDeleteEntry(event.data.id)
        }
      },
    },
  ])

  // Grid options
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
    onCellValueChanged: (event: CellValueChangedEvent) => {
      console.log('📊 Cell value changed:', {
        field: event.colDef.field,
        newValue: event.newValue,
        oldValue: event.oldValue,
        data: event.data,
      })
      handleCellValueChanged(event)
    },
    onRowDoubleClicked: handleRowDoubleClicked,
    onCellClicked: handleCellClicked,
    onCellKeyDown: handleCellKeyDown,
    getRowStyle: (params: { data?: TimesheetEntryGridRow }) => {
      if (!params.data) return undefined

      // Highlight new rows
      if (params.data.isNewRow) {
        return { backgroundColor: '#F0F9FF', border: '1px dashed #3B82F6' }
      }
      return undefined
    },
  }))

  // Helper functions
  function handleJobSelection(
    rowData: TimesheetEntryGridRow & { rowIndex: number },
    job: TimesheetEntryJobSelectionItem,
  ): void {
    console.log('🏆 Handling job selection:', {
      job: job,
      rowData: rowData,
    })

    const entry = createEntryFromRowData(rowData)
    console.log('📝 Entry before populate:', entry)

    const populated = calculations.populateJobFields(entry, job)
    console.log('🎨 Entry after populate:', populated)

    const recalculated = calculations.recalculateEntry(populated)
    console.log('🧮 Entry after recalculate:', recalculated)

    updateRowData(rowData.rowIndex, recalculated)
  }

  // Event handlers
  async function handleCellValueChanged(event: CellValueChangedEvent): Promise<void> {
    const { data, colDef, newValue, oldValue } = event

    console.log('🔧 handleCellValueChanged called!', {
      field: colDef.field,
      newValue,
      oldValue,
      data: data,
    })

    // Guard clause - early return if no changes
    if (newValue === oldValue) {
      console.log('⏭️ No changes detected, skipping')
      return
    }

    try {
      loading.value = true

      console.log('🔄 Cell value changed:', {
        field: colDef.field,
        newValue: newValue,
        oldValue: oldValue,
        selectedJob: data.selectedJob,
        data: data,
      })

      // Handle job selection specially
      if (colDef.field === 'jobNumber') {
        const lastSelectedJobRaw =
          typeof window !== 'undefined' &&
          typeof (window as unknown as { lastSelectedJob?: unknown }).lastSelectedJob !==
            'undefined'
            ? (window as unknown as { lastSelectedJob?: unknown }).lastSelectedJob
            : null
        console.log('🎯 Job field changed, checking for selected job:', lastSelectedJobRaw)

        // Type guard para garantir o shape
        function isJobSelectionItem(obj: unknown): obj is TimesheetEntryJobSelectionItem {
          return (
            !!obj &&
            typeof obj === 'object' &&
            'id' in obj &&
            'job_number' in obj &&
            'name' in obj &&
            'client_name' in obj &&
            'charge_out_rate' in obj &&
            'status' in obj
          )
        }

        if (isJobSelectionItem(lastSelectedJobRaw)) {
          const jobSelectionItem = lastSelectedJobRaw
          // Use the helper function
          const entry = createEntryFromRowData(data)
          const populated = calculations.populateJobFields(entry, jobSelectionItem)
          const recalculated = calculations.recalculateEntry(populated)
          if (typeof updateRowData === 'function') {
            updateRowData(data.rowIndex || 0, recalculated)
          }
          // Clear the global variable
          ;(window as unknown as { lastSelectedJob?: unknown }).lastSelectedJob = null
          return
        }
      }

      // Update the row data
      const updatedEntry = createEntryFromRowData(data)

      // Recalculate amounts when relevant fields change
      if (
        ['hours', 'rate', 'billable', 'jobNumber', 'jobId', 'chargeOutRate'].includes(
          colDef.field || '',
        ) &&
        event.node.rowIndex !== null
      ) {
        const recalculated = calculations.recalculateEntry(updatedEntry)
        updateRowData(event.node.rowIndex, recalculated)
      }

      // Save if not a new row AND has valid data
      if (!data.isNewRow && updatedEntry.id && !isRowEmpty(updatedEntry)) {
        await onSaveEntry(updatedEntry)
      }

      // Auto-save new rows when they have enough data (not empty)
      if (data.isNewRow && isRowComplete(updatedEntry) && event.node.rowIndex !== null) {
        await saveNewRow(event.node.rowIndex, updatedEntry)
      }
    } catch (error) {
      console.error('Error handling cell value change:', error)
      // Revert the change
      event.api.refreshCells({ rowNodes: [event.node], force: true })
    } finally {
      loading.value = false
    }
  }

  function handleRowDoubleClicked(event: RowDoubleClickedEvent): void {
    // Guard clause - ensure rowIndex is not null
    if (event.rowIndex === null) return

    // Enter edit mode on double-click
    const colId = 'description' // Default to description field
    event.api.startEditingCell({
      rowIndex: event.rowIndex,
      colKey: colId,
    })
  }

  function handleCellClicked(event: CellClickedEvent): void {
    if (
      event.event?.target &&
      event.event.target instanceof HTMLElement &&
      event.event.target.classList.contains('delete-btn')
    ) {
      const rowIndex = parseInt(event.event.target.dataset.rowId || '0')
      deleteRow(rowIndex)
    }
  }

  function handleCellKeyDown(params: CellKeyDownEvent): void {
    const { event, api, node, column } = params

    if (!event || !(event instanceof KeyboardEvent) || !node.rowIndex !== null) {
      return
    }

    console.log('⌨️ Cell key down:', {
      key: event.key,
      shiftKey: event.shiftKey,
      column: column.getColId(),
      rowIndex: node.rowIndex,
    })

    switch (event.key) {
      case 'Escape':
        console.log('ESC pressed - stopping edit')
        if (!column.getColDef().editable) {
          return
        }
        api.stopEditing(true)
        break

      case 'Enter':
        if (event.shiftKey) {
          console.log('Shift+Enter pressed - confirming edit or toggling billable')

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

        // Regular Enter just moves to next cell (default AG Grid behavior)
        // No special handling needed - let AG Grid handle navigation
        break

      default:
        // Let other keys pass through normally
        break
    }
  }

  // Helper functions
  function createEntryFromRowData(rowData: TimesheetEntryGridRow): TimesheetEntry {
    return {
      id: rowData.id,
      jobId: rowData.jobId || '',
      jobNumber: rowData.jobNumber || '',
      client: rowData.client || '',
      jobName: rowData.jobName || '',
      hours: typeof rowData.hours === 'string' ? parseFloat(rowData.hours) : rowData.hours || 0,
      billable: rowData.billable ?? true,
      description: rowData.description || '',
      rate: rowData.rate || 'Ord',
      wage: typeof rowData.wage === 'string' ? parseFloat(rowData.wage) : rowData.wage || 0,
      bill: typeof rowData.bill === 'string' ? parseFloat(rowData.bill) : rowData.bill || 0,
      staffId: rowData.staffId || '',
      date: rowData.date || '',
      wageRate:
        typeof rowData.wageRate === 'string' ? parseFloat(rowData.wageRate) : rowData.wageRate || 0,
      chargeOutRate:
        typeof rowData.chargeOutRate === 'string'
          ? parseFloat(rowData.chargeOutRate)
          : rowData.chargeOutRate || 0,
      rateMultiplier: calculations.getRateMultiplier(rowData.rate || 'Ord'),
      isNewRow: rowData.isNewRow,
    }
  }

  function updateRowData(rowIndex: number, entry: TimesheetEntry): void {
    if (!gridApi.value) return

    const rowNode = gridApi.value.getRowNode(rowIndex.toString())
    if (rowNode) {
      Object.assign(rowNode.data, entry)
      gridApi.value.refreshCells({ rowNodes: [rowNode], force: true })
    }
  }

  function isRowComplete(entry: TimesheetEntry): boolean {
    return !!(entry.jobNumber && entry.hours > 0 && entry.description.trim())
  }

  function isRowEmpty(entry: TimesheetEntry): boolean {
    return (
      !entry.jobNumber &&
      entry.hours === 0 &&
      (!entry.description || entry.description.trim() === '')
    )
  }

  async function saveNewRow(rowIndex: number, entry: TimesheetEntry): Promise<void> {
    try {
      // Remove the isNewRow flag and save
      const entryToSave = { ...entry, isNewRow: false }
      await onSaveEntry(entryToSave)

      // Update the row to reflect it's no longer new
      updateRowData(rowIndex, entryToSave)

      // Add a new empty row
      addNewRow()
    } catch (error) {
      console.error('Error saving new row:', error)
      throw error
    }
  }

  async function deleteRow(rowIndex: number): Promise<void> {
    if (!gridApi.value) return

    const rowNode = gridApi.value.getRowNode(rowIndex.toString())
    if (!rowNode || !rowNode.data) return

    // Guard clause - don't delete new rows, just clear them
    if (rowNode.data.isNewRow) {
      clearRow(rowIndex)
      return
    }

    try {
      loading.value = true

      if (rowNode.data.id) {
        await onDeleteEntry(rowNode.data.id)
      }
      // Remove from grid
      gridData.value.splice(rowIndex, 1)
      gridApi.value.applyTransaction({ remove: [rowNode.data] })
    } catch (error) {
      console.error('Error deleting row:', error)
    } finally {
      loading.value = false
    }
  }

  function clearRow(rowIndex: number, staffId?: string): void {
    if (!gridApi.value) return

    const rowNode = gridApi.value.getRowNode(rowIndex.toString())
    if (rowNode) {
      // Reset to empty new row with proper staffId
      const currentStaffId = staffId || rowNode.data.staffId || ''
      const date = rowNode.data.date || new Date().toISOString().split('T')[0]
      const staffMember = { id: currentStaffId } as TimesheetEntryStaffMember
      const newRow = calculations.createNewRow(staffMember, date)

      Object.assign(rowNode.data, newRow)
      gridApi.value.refreshCells({ rowNodes: [rowNode], force: true })
    }
  }

  // Public methods
  function setGridApi(api: GridApi): void {
    gridApi.value = api
  }

  function loadData(entries: TimesheetEntry[], staffId?: string): void {
    console.log('📋 loadData called with:', entries.length, 'entries for staff:', staffId)
    console.log(
      '📄 Entries details:',
      entries.map((e) => ({
        id: e.id,
        jobId: e.jobId,
        jobNumber: e.jobNumber,
        hours: e.hours,
        description: e.description,
      })),
    )

    const rows: TimesheetEntryGridRow[] = entries.map((entry) => ({ ...entry }))
    gridData.value = rows
    console.log('✅ Grid data updated with', gridData.value.length, 'rows')

    // Only add empty row if there are no rows at all
    if (gridData.value.length === 0) {
      console.log('📝 No entries exist, adding first empty row')
      addNewRow(staffId)
    }
  }

  function addNewRow(staffId?: string, date?: string): void {
    console.log('➕ addNewRow called with staffId:', staffId, 'date:', date)

    // Use provided staffId or default
    const currentStaffId = staffId || ''
    // Use provided date or default to today
    const currentDate = date || new Date().toISOString().split('T')[0]
    const staffMember = { id: currentStaffId } as TimesheetEntryStaffMember
    const newRow = calculations.createNewRow(staffMember, currentDate)

    console.log('📝 Creating new row:', newRow)
    gridData.value.push(newRow)

    // Wait for grid to be ready before applying transaction
    if (gridApi.value && !gridApi.value.isDestroyed()) {
      console.log('🔄 Applying transaction to grid')
      gridApi.value.applyTransaction({ add: [newRow] })

      // Focus the new row after a short delay
      setTimeout(() => {
        if (gridApi.value && !gridApi.value.isDestroyed()) {
          const newRowIndex = gridData.value.length - 1
          gridApi.value.setFocusedCell(newRowIndex, 'jobNumber')
        }
      }, 100)
    } else {
      console.log('⚠️ Grid API not available or destroyed, will add on next grid ready')
      // Store the row to be added when grid becomes ready
      nextTick(() => {
        if (gridApi.value && !gridApi.value.isDestroyed()) {
          console.log('🔄 Retrying transaction to grid after nextTick')
          gridApi.value.applyTransaction({ add: [newRow] })
        }
      })
    }
  }

  function focusFirstEditableCell(): void {
    if (!gridApi.value) return

    // Focus on the job field of the first new row
    const newRowIndex = gridData.value.findIndex((row: TimesheetEntryGridRow) => row.isNewRow)
    if (newRowIndex >= 0) {
      gridApi.value.setFocusedCell(newRowIndex, 'jobNumber')
      gridApi.value.startEditingCell({
        rowIndex: newRowIndex,
        colKey: 'jobNumber',
      })
    }
  }

  function getSelectedEntry(): TimesheetEntry | null {
    if (!gridApi.value || selectedRowIndex.value < 0) return null

    const rowNode = gridApi.value.getRowNode(selectedRowIndex.value.toString())
    return rowNode ? createEntryFromRowData(rowNode.data) : null
  }

  // Keyboard shortcuts
  function handleKeyboardShortcut(event: KeyboardEvent, staffId?: string): boolean {
    if (!gridApi.value) return false

    // Shift+N - Add new row (primary method)
    if (event.shiftKey && event.key === 'N') {
      event.preventDefault()
      console.log('🎯 Shift+N pressed - adding new row')
      addNewRow(staffId)
      focusFirstEditableCell()
      return true
    }

    // Ctrl+S - Save all (handled by parent)
    if (event.ctrlKey && event.key === 's') {
      event.preventDefault()
      return true // Let parent handle the save
    }

    // Delete - Delete selected row
    if (event.key === 'Delete' && selectedRowIndex.value >= 0) {
      event.preventDefault()
      deleteRow(selectedRowIndex.value)
      return true
    }

    return false
  }

  /**
   * Get current grid data from AG Grid rows
   */
  function getGridData(): TimesheetEntryGridRow[] {
    if (!gridApi.value) {
      console.log('⚠️ Grid API not available for data extraction')
      return []
    }

    console.log('📊 Extracting data from AG Grid...')
    const data: TimesheetEntryGridRow[] = []

    gridApi.value.forEachNode((node: { data?: TimesheetEntryGridRow }) => {
      if (node.data && !node.data.isEmptyRow) {
        data.push(node.data)
        console.log('✅ Extracted node data:', {
          jobId: node.data.jobId,
          jobNumber: node.data.jobNumber,
          client: node.data.client,
          jobName: node.data.jobName,
          hours: node.data.hours,
        })
      }
    })

    console.log('📋 Total extracted data:', data.length, 'entries')
    return data
  }

  return {
    // State
    gridData,
    loading,
    gridOptions,
    columnDefs,

    // Methods
    setGridApi,
    loadData,
    addNewRow,
    focusFirstEditableCell,
    getSelectedEntry,
    getGridData,
    handleKeyboardShortcut,
    handleJobSelection,
    handleCellValueChanged,

    // Computed
    hasData: computed(() => gridData.value.length > 0),
  }
}
