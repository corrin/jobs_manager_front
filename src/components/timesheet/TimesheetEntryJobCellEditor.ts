/**
 * Optimized Job Cell Editor for AG Grid
 *
 * Enhanced version of the job cell editor with better UX
 * Based on the original job_cell_editor.js but with Vue 3 integration
 */

import type { ICellEditor, ICellEditorParams } from 'ag-grid-community'
import type { JobSelectionItem } from '@/types/timesheet.types'

export class TimesheetEntryJobCellEditor implements ICellEditor {
  private value: string = ''
  private params!: ICellEditorParams
  private jobs: JobSelectionItem[] = []
  private filteredJobs: JobSelectionItem[] = []
  private highlightedIndex: number = -1
  private container!: HTMLDivElement
  private input!: HTMLInputElement
  private dropdown!: HTMLDivElement
  private selectedJob: JobSelectionItem | null = null

  init(params: ICellEditorParams): void {
    this.value = params.value || ''
    this.params = params
    this.jobs = (window as any).timesheetJobs || []
    this.filteredJobs = [...this.jobs]

    this.createUI()
    this.setupEventListeners()
    this.updateFilteredJobs('')

    // Auto-focus and select all text
    setTimeout(() => {
      this.input.focus()
      this.input.select()
    }, 0)
  }

  private createUI(): void {
    // Main container
    this.container = document.createElement('div')
    this.container.className = 'job-cell-editor-container'
    this.container.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
    `

    // Input field
    this.input = document.createElement('input')
    this.input.type = 'text'
    this.input.value = this.value
    this.input.placeholder = 'Search jobs... (start typing job number or name)'
    this.input.style.cssText = `
      width: 100%;
      height: 100%;
      border: 2px solid #4361EE;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 14px;
      outline: none;
      background: white;
      box-shadow: 0 2px 8px rgba(67, 97, 238, 0.2);
    `

    // Dropdown
    this.dropdown = document.createElement('div')
    this.dropdown.className = 'job-dropdown'
    this.dropdown.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      max-height: 300px;
      overflow-y: auto;
      background: white;
      border: 2px solid #4361EE;
      border-top: none;
      border-radius: 0 0 4px 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      display: none;
    `

    this.container.appendChild(this.input)
    this.container.appendChild(this.dropdown)
  }

  private setupEventListeners(): void {
    // Input events
    this.input.addEventListener('input', () => {
      const searchTerm = this.input.value.trim()
      this.updateFilteredJobs(searchTerm)
      this.showDropdown()
    })

    this.input.addEventListener('focus', () => {
      this.showDropdown()
    })

    this.input.addEventListener('blur', (e) => {
      // Delay hiding to allow dropdown clicks
      setTimeout(() => {
        if (!this.dropdown.contains(document.activeElement)) {
          this.hideDropdown()
        }
      }, 200)
    })

    // Keyboard navigation
    this.input.addEventListener('keydown', (e) => {
      this.handleKeyDown(e)
    })

    // Prevent dropdown from losing focus when clicked
    this.dropdown.addEventListener('mousedown', (e) => {
      e.preventDefault()
      e.stopPropagation()
    })
  }

  private updateFilteredJobs(searchTerm: string): void {
    if (!searchTerm) {
      this.filteredJobs = this.jobs.slice(0, 20) // Show first 20 jobs
    } else {
      const term = searchTerm.toLowerCase()
      this.filteredJobs = this.jobs
        .filter(job =>
          job.job_number.toLowerCase().includes(term) ||
          job.name.toLowerCase().includes(term) ||
          job.client_name.toLowerCase().includes(term)
        )
        .slice(0, 15) // Limit results for performance
    }

    this.highlightedIndex = -1
    this.renderDropdown()
  }

  private renderDropdown(): void {
    this.dropdown.innerHTML = ''

    if (this.filteredJobs.length === 0) {
      const noResults = document.createElement('div')
      noResults.className = 'job-dropdown-item no-results'
      noResults.textContent = 'No jobs found'
      noResults.style.cssText = `
        padding: 12px 16px;
        color: #6B7280;
        font-style: italic;
        border-bottom: 1px solid #E5E7EB;
      `
      this.dropdown.appendChild(noResults)
      return
    }

    this.filteredJobs.forEach((job, index) => {
      const item = document.createElement('div')
      item.className = 'job-dropdown-item'
      item.dataset.index = index.toString()

      // Create job display with highlighting
      const searchTerm = this.input.value.toLowerCase()
      const jobNumber = this.highlightText(job.job_number, searchTerm)
      const jobName = this.highlightText(job.name, searchTerm)
      const clientName = this.highlightText(job.client_name, searchTerm)

      item.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 600; color: #1F2937;">#${jobNumber}</span>
            <span style="font-size: 12px; color: ${this.getStatusColor(job.status)}; font-weight: 500;">
              ${job.status.toUpperCase()}
            </span>
          </div>
          <div style="font-size: 14px; color: #374151; font-weight: 500;">${jobName}</div>
          <div style="font-size: 12px; color: #6B7280;">Client: ${clientName}</div>
          <div style="font-size: 11px; color: #9CA3AF;">
            Rate: $${job.charge_out_rate}/hr
          </div>
        </div>
      `

      item.style.cssText = `
        padding: 12px 16px;
        cursor: pointer;
        border-bottom: 1px solid #E5E7EB;
        transition: background-color 0.15s ease;
      `

      // Event handlers
      item.addEventListener('mouseenter', () => {
        this.highlightedIndex = index
        this.updateHighlight()
      })

      item.addEventListener('click', () => {
        this.selectJob(job)
      })

      this.dropdown.appendChild(item)
    })
  }

  private highlightText(text: string, searchTerm: string): string {
    if (!searchTerm) return text

    const regex = new RegExp(`(${searchTerm})`, 'gi')
    return text.replace(regex, '<mark style="background: #FEF3C7; color: #92400E;">$1</mark>')
  }

  private getStatusColor(status: string): string {
    switch (status) {
      case 'active':
      case 'in_progress':
        return '#059669'
      case 'completed':
        return '#6B7280'
      case 'special':
      case 'shop':
        return '#DC2626'
      default:
        return '#D97706'
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // Guard clause - early return if no items
    if (this.filteredJobs.length === 0) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        this.highlightedIndex = Math.min(
          this.highlightedIndex + 1,
          this.filteredJobs.length - 1
        )
        this.updateHighlight()
        break

      case 'ArrowUp':
        event.preventDefault()
        this.highlightedIndex = Math.max(this.highlightedIndex - 1, 0)
        this.updateHighlight()
        break

      case 'Enter':
        event.preventDefault()
        if (this.highlightedIndex >= 0) {
          this.selectJob(this.filteredJobs[this.highlightedIndex])
        } else if (this.filteredJobs.length === 1) {
          // Auto-select if only one match
          this.selectJob(this.filteredJobs[0])
        }
        break

      case 'Escape':
        event.preventDefault()
        this.params.stopEditing()
        break

      case 'Tab':
        // Allow default tab behavior but select job if highlighted
        if (this.highlightedIndex >= 0) {
          event.preventDefault()
          this.selectJob(this.filteredJobs[this.highlightedIndex])
        }
        break
    }
  }

  private updateHighlight(): void {
    const items = this.dropdown.querySelectorAll('.job-dropdown-item')

    items.forEach((item, index) => {
      const element = item as HTMLElement
      if (index === this.highlightedIndex) {
        element.style.backgroundColor = '#EBF8FF'
        element.style.borderLeftColor = '#4361EE'
        element.style.borderLeftWidth = '3px'
        element.scrollIntoView({ block: 'nearest' })
      } else {
        element.style.backgroundColor = 'white'
        element.style.borderLeftColor = 'transparent'
        element.style.borderLeftWidth = '3px'
      }
    })  }  private selectJob(job: JobSelectionItem): void {
    this.selectedJob = job
    this.value = job.job_number
    this.input.value = job.job_number

    // Store the selected job for getValue() to return
    console.log('🎯 Job selected in editor:', job)

    // Store the selected job globally for the grid to access
    ;(window as any).lastSelectedJob = job

    // Update the grid row directly with job data
    if (this.params.node) {
      const rowData = this.params.node.data
      console.log('🔄 Updating row data with job info:', job)
        // Update all job-related fields
      rowData.jobId = job.id
      rowData.jobNumber = job.job_number
      rowData.client = job.client_name
      rowData.jobName = job.name
      rowData.chargeOutRate = job.charge_out_rate
      rowData.billable = job.status !== 'special' && job.status !== 'shop'
        // Calculate wage and bill manually since handleCellValueChanged might not be called
      const hours = rowData.hours || 0
      const rate = rowData.rate || 'Ord'

      // Get rate multiplier
      const getRateMultiplier = (rateType: string): number => {
        switch (rateType) {
          case '1.5': return 1.5
          case '2.0': return 2.0
          case 'Unpaid': return 0.0
          default: return 1.0
        }
      }
        // Get wage rate from staff data (stored globally) or use company default
      const currentStaff = (window as any).currentStaff
      const companyDefaults = (window as any).companyDefaults
      const wageRate = currentStaff?.wageRate || companyDefaults?.wage_rate || 32 // Fallback to company default
      const multiplier = getRateMultiplier(rate)
      rowData.wage = hours > 0 ? Math.round((hours * wageRate * multiplier) * 100) / 100 : 0

      console.log('💰 Using wage rate:', wageRate, 'for', hours, 'hours with multiplier', multiplier)

      // Calculate bill
      rowData.bill = (rowData.billable && hours > 0 && job.charge_out_rate > 0)
        ? Math.round((hours * job.charge_out_rate) * 100) / 100
        : 0

      console.log('💰 Calculated wage:', rowData.wage, 'and bill:', rowData.bill)

      // Trigger row update
      this.params.api?.refreshCells({
        rowNodes: [this.params.node],
        force: true
      })

      console.log('✅ Row updated with job data')
    }

    this.hideDropdown()
    this.params.stopEditing()
  }

  private showDropdown(): void {
    this.dropdown.style.display = 'block'
    this.renderDropdown()
  }

  private hideDropdown(): void {
    this.dropdown.style.display = 'none'
  }

  getGui(): HTMLElement {
    return this.container
  }  getValue(): any {
    // Store the selected job in a global variable for the grid to access
    if (this.selectedJob) {
      // Store globally for handleCellValueChanged to access
      (window as any).lastSelectedJob = this.selectedJob
      console.log('🎯 Returning job number from editor:', this.selectedJob.job_number)
      return this.selectedJob.job_number
    }
    return this.value
  }

  destroy(): void {
    // Clean up event listeners and DOM
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container)
    }
  }

  isPopup(): boolean {
    return true
  }

  isCancelBeforeStart(): boolean {
    return false
  }

  isCancelAfterEnd(): boolean {
    return false
  }
}
