import type { ICellEditor, ICellEditorParams } from 'ag-grid-community'
import type { JobSelectionItem } from '@/types/job.types'
import { searchJobs } from '@/services/jobService'

export class PoLineJobCellEditor implements ICellEditor {
  private params!: ICellEditorParams
  private value: string = ''
  private jobs: JobSelectionItem[] = []
  private filteredJobs: JobSelectionItem[] = []
  private highlightedIndex: number = -1
  private container!: HTMLDivElement
  private input!: HTMLInputElement
  private dropdown!: HTMLDivElement
  private selectedJob: JobSelectionItem | null = null
  private searchTimeout: number | null = null

  init(params: ICellEditorParams): void {
    this.params = params
    this.value = params.value || ''

    this.createUI()
    this.setupEventListeners()
    this.fetchInitialJobs()

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
    this.input.placeholder = 'Search jobs...'
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
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout)
      }
      this.searchTimeout = window.setTimeout(() => {
        this.updateFilteredJobs(searchTerm)
      }, 300)
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

  private async fetchInitialJobs(): Promise<void> {
    try {
      this.jobs = await searchJobs('')
      this.filteredJobs = this.jobs.slice(0, 20)
      this.renderDropdown()
    } catch (error) {
      console.error('Failed to fetch initial jobs:', error)
    }
  }

  private async updateFilteredJobs(searchTerm: string): Promise<void> {
    if (!searchTerm) {
      this.filteredJobs = this.jobs.slice(0, 20)
    } else {
      try {
        this.filteredJobs = await searchJobs(searchTerm)
      } catch (error) {
        console.error('Failed to search jobs:', error)
        this.filteredJobs = []
      }
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
    this.value = job.job_number
    this.input.value = job.job_number

    if (this.params.node) {
      const rowData = this.params.node.data
      rowData.job_id = job.id
      rowData.job_number = job.job_number
      rowData.job_name = job.name
      rowData.client_name = job.client_name

      this.params.api?.refreshCells({
        rowNodes: [this.params.node],
        force: true,
      })
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
      return this.selectedJob.job_number
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
