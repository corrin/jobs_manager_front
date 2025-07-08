import type { ICellEditor, ICellEditorParams } from 'ag-grid-community'
import type { JobSelectionItem } from '@/types/timesheet.types'
import { debugLog } from '@/utils/debug'

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

    const win = window as unknown as { timesheetJobs?: unknown }
    if (Array.isArray(win.timesheetJobs)) {
      this.jobs = win.timesheetJobs as JobSelectionItem[]
      debugLog('📋 Jobs loaded for timesheet:', {
        count: this.jobs.length,
        sample: this.jobs[0]
          ? {
              keys: Object.keys(this.jobs[0]),
              job: this.jobs[0],
            }
          : 'no jobs',
      })
    } else {
      this.jobs = []
      debugLog('⚠️ No jobs found in window.timesheetJobs:', win.timesheetJobs)
    }
    this.filteredJobs = [...this.jobs]

    this.createUI()
    this.setupEventListeners()
    this.updateFilteredJobs('')

    setTimeout(() => {
      this.input.focus()
      this.input.select()
    }, 0)
  }

  private createUI(): void {
    this.container = document.createElement('div')
    this.container.className = 'job-cell-editor-container'
    this.container.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
    `

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
    this.input.addEventListener('input', () => {
      const searchTerm = this.input.value.trim()
      this.updateFilteredJobs(searchTerm)
      this.showDropdown()
    })

    this.input.addEventListener('focus', () => {
      this.showDropdown()
    })

    this.input.addEventListener('blur', () => {
      setTimeout(() => {
        if (!this.dropdown.contains(document.activeElement)) {
          this.hideDropdown()
        }
      }, 200)
    })

    this.input.addEventListener('keydown', (e) => {
      this.handleKeyDown(e)
    })

    this.dropdown.addEventListener('mousedown', (e) => {
      e.preventDefault()
      e.stopPropagation()
    })
  }

  private updateFilteredJobs(searchTerm: string): void {
    if (!searchTerm) {
      this.filteredJobs = this.jobs.slice(0, 20)
    } else {
      const term = searchTerm.toLowerCase()
      this.filteredJobs = this.jobs
        .filter((job) => {
          // Handle different possible field names from API
          const jobNumber = job.job_number || job.number || job.jobNumber || ''
          const jobName = job.name || job.job_name || job.jobName || ''
          const clientName = job.client_name || job.clientName || job.client || ''

          return (
            jobNumber.toString().toLowerCase().includes(term) ||
            jobName.toLowerCase().includes(term) ||
            clientName.toLowerCase().includes(term)
          )
        })
        .slice(0, 15)
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

      const searchTerm = this.input.value.toLowerCase()

      // Handle different possible field names from API
      const jobNumber = job.job_number || job.number || job.jobNumber || 'N/A'
      const jobName = job.name || job.job_name || job.jobName || 'Unnamed Job'
      const clientName = job.client_name || job.clientName || job.client || 'Unknown Client'
      const chargeOutRate = job.charge_out_rate || job.chargeOutRate || job.rate || 0
      const status = job.status || 'active'

      const highlightedJobNumber = this.highlightText(jobNumber.toString(), searchTerm)
      const highlightedJobName = this.highlightText(jobName, searchTerm)
      const highlightedClientName = this.highlightText(clientName, searchTerm)

      item.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 600; color: #1F2937;">#${highlightedJobNumber}</span>
            <span style="font-size: 12px; color: ${this.getStatusColor(status)}; font-weight: 500;">
              ${status.toUpperCase()}
            </span>
          </div>
          <div style="font-size: 14px; color: #374151; font-weight: 500;">${highlightedJobName}</div>
          <div style="font-size: 12px; color: #6B7280;">Client: ${highlightedClientName}</div>
          <div style="font-size: 11px; color: #9CA3AF;">
            Rate: $${chargeOutRate}/hr
          </div>
        </div>
      `

      item.style.cssText = `
        padding: 12px 16px;
        cursor: pointer;
        border-bottom: 1px solid #E5E7EB;
        transition: background-color 0.15s ease;
      `

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
    if (this.filteredJobs.length === 0) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        this.highlightedIndex = Math.min(this.highlightedIndex + 1, this.filteredJobs.length - 1)
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
          this.selectJob(this.filteredJobs[0])
        }
        break

      case 'Escape':
        event.preventDefault()
        this.params.stopEditing()
        break

      case 'Tab':
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
    })
  }
  private selectJob(job: JobSelectionItem): void {
    this.selectedJob = job

    // Handle different possible field names from API
    const jobNumber = job.job_number || job.number || job.jobNumber || ''
    const jobName = job.name || job.job_name || job.jobName || ''
    const clientName = job.client_name || job.clientName || job.client || ''
    const chargeOutRate = job.charge_out_rate || job.chargeOutRate || job.rate || 0
    const jobId = job.id || job.job_id || job.jobId || ''
    const status = job.status || 'active'

    this.value = jobNumber.toString()
    this.input.value = jobNumber.toString()

    debugLog('🎯 Job selected in editor:', {
      original: job,
      normalized: { jobNumber, jobName, clientName, chargeOutRate, jobId, status },
    })

    // Store the normalized job data
    const normalizedJob = {
      ...job,
      job_number: jobNumber,
      name: jobName,
      client_name: clientName,
      charge_out_rate: chargeOutRate,
      id: jobId,
      status,
    }

    ;(window as unknown as { lastSelectedJob: JobSelectionItem }).lastSelectedJob = normalizedJob

    if (this.params.node) {
      const rowData = this.params.node.data
      debugLog('🔄 Updating row data with job info:', normalizedJob)

      rowData.jobId = jobId
      rowData.jobNumber = jobNumber.toString()
      rowData.client = clientName
      rowData.jobName = jobName
      rowData.chargeOutRate = chargeOutRate
      rowData.billable = status !== 'special' && status !== 'shop'

      const hours = rowData.hours || 0
      const rate = rowData.rate || 'Ord'

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

      const currentStaff = (window as unknown as { currentStaff?: { wageRate?: number } })
        .currentStaff
      const companyDefaults = (window as unknown as { companyDefaults?: { wage_rate?: number } })
        .companyDefaults
      const wageRate = currentStaff?.wageRate || companyDefaults?.wage_rate || 32
      const multiplier = getRateMultiplier(rate)
      rowData.wage = hours > 0 ? Math.round(hours * wageRate * multiplier * 100) / 100 : 0

      debugLog('💰 Using wage rate:', wageRate, 'for', hours, 'hours with multiplier', multiplier)

      rowData.bill =
        rowData.billable && hours > 0 && chargeOutRate > 0
          ? Math.round(hours * chargeOutRate * 100) / 100
          : 0

      debugLog('💰 Calculated wage:', rowData.wage, 'and bill:', rowData.bill)

      this.params.api?.refreshCells({
        rowNodes: [this.params.node],
        force: true,
      })

      debugLog('✅ Row updated with job data')
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
  }
  getValue(): string {
    if (this.selectedJob) {
      // Handle different possible field names from API
      const jobNumber =
        this.selectedJob.job_number || this.selectedJob.number || this.selectedJob.jobNumber || ''

      // Store normalized job data
      const normalizedJob = {
        ...this.selectedJob,
        job_number: jobNumber.toString(),
        name: this.selectedJob.name || this.selectedJob.job_name || this.selectedJob.jobName || '',
        client_name:
          this.selectedJob.client_name ||
          this.selectedJob.clientName ||
          this.selectedJob.client ||
          '',
        charge_out_rate:
          this.selectedJob.charge_out_rate ||
          this.selectedJob.chargeOutRate ||
          this.selectedJob.rate ||
          0,
        id: this.selectedJob.id || this.selectedJob.job_id || this.selectedJob.jobId || '',
      }

      ;(window as unknown as { lastSelectedJob: JobSelectionItem }).lastSelectedJob = normalizedJob
      debugLog('🎯 Returning job number from editor:', jobNumber)
      return jobNumber.toString()
    }
    return this.value
  }

  destroy(): void {
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
