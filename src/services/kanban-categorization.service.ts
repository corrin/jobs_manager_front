export interface KanbanSubCategory {
  statusKey: string
  badgeLabel: string
  badgeColorClass: string
}

export interface KanbanColumn {
  columnId: string
  columnTitle: string
  subCategories: KanbanSubCategory[]
  colorTheme: string
}

export class KanbanCategorizationService {
  private static readonly COLUMN_STRUCTURE: Record<string, KanbanColumn> = {
    draft: {
      columnId: 'draft',
      columnTitle: 'Draft',
      subCategories: [
        { statusKey: 'quoting', badgeLabel: 'Quoting', badgeColorClass: 'bg-yellow-500' },
      ],
      colorTheme: 'yellow',
    },
    awaiting_approval: {
      columnId: 'awaiting_approval',
      columnTitle: 'Awaiting Approval',
      subCategories: [
        {
          statusKey: 'accepted_quote',
          badgeLabel: 'Quote Accepted',
          badgeColorClass: 'bg-green-500',
        },
      ],
      colorTheme: 'green',
    },
    on_hold: {
      columnId: 'on_hold',
      columnTitle: 'On Hold',
      subCategories: [
        {
          statusKey: 'awaiting_materials',
          badgeLabel: 'Awaiting Materials',
          badgeColorClass: 'bg-orange-500',
        },
        {
          statusKey: 'awaiting_staff',
          badgeLabel: 'Awaiting Staff',
          badgeColorClass: 'bg-purple-500',
        },
        {
          statusKey: 'awaiting_site_availability',
          badgeLabel: 'Awaiting Site',
          badgeColorClass: 'bg-indigo-500',
        },
        { statusKey: 'on_hold', badgeLabel: 'Other Hold', badgeColorClass: 'bg-gray-500' },
      ],
      colorTheme: 'orange',
    },
    in_progress: {
      columnId: 'in_progress',
      columnTitle: 'In Progress',
      subCategories: [
        { statusKey: 'in_progress', badgeLabel: 'Active Work', badgeColorClass: 'bg-blue-500' },
      ],
      colorTheme: 'blue',
    },
    recently_completed: {
      columnId: 'recently_completed',
      columnTitle: 'Recently Completed',
      subCategories: [
        {
          statusKey: 'recently_completed',
          badgeLabel: 'Just Finished',
          badgeColorClass: 'bg-emerald-500',
        },
      ],
      colorTheme: 'emerald',
    },
    archived: {
      columnId: 'archived',
      columnTitle: 'Archived',
      subCategories: [
        { statusKey: 'completed', badgeLabel: 'Completed & Paid', badgeColorClass: 'bg-slate-500' },
        { statusKey: 'rejected', badgeLabel: 'Rejected', badgeColorClass: 'bg-red-500' },
      ],
      colorTheme: 'slate',
    },
  }

  private static readonly STATUS_TO_COLUMN_MAP: Record<string, string> = {
    quoting: 'draft',
    accepted_quote: 'awaiting_approval',
    awaiting_materials: 'on_hold',
    awaiting_staff: 'on_hold',
    awaiting_site_availability: 'on_hold',
    in_progress: 'in_progress',
    recently_completed: 'recently_completed',
    completed: 'archived',
    rejected: 'archived',
    archived: 'archived',
    on_hold: 'on_hold',
  }

  static getColumnForStatus(status: string): string {
    if (!status) {
      return 'draft'
    }

    return this.STATUS_TO_COLUMN_MAP[status] || 'draft'
  }

  static getSubCategoryForStatus(status: string): KanbanSubCategory | null {
    if (!status) {
      return null
    }

    const columnId = this.getColumnForStatus(status)
    const column = this.COLUMN_STRUCTURE[columnId]

    if (!column) {
      return null
    }

    return column.subCategories.find((subCat) => subCat.statusKey === status) || null
  }

  static getAllColumns(): KanbanColumn[] {
    return [
      this.COLUMN_STRUCTURE.draft,
      this.COLUMN_STRUCTURE.awaiting_approval,
      this.COLUMN_STRUCTURE.on_hold,
      this.COLUMN_STRUCTURE.in_progress,
      this.COLUMN_STRUCTURE.recently_completed,
      this.COLUMN_STRUCTURE.archived,
    ]
  }

  static getColumnById(columnId: string): KanbanColumn | null {
    if (!columnId) {
      return null
    }

    return this.COLUMN_STRUCTURE[columnId] || null
  }

  static filterKanbanJobs<T extends { status_key?: string }>(jobs: T[]): T[] {
    if (!jobs) {
      return []
    }

    return jobs.filter((job) => job.status_key !== 'special')
  }

  static getJobsForColumn<T extends { status_key?: string }>(jobs: T[], columnId: string): T[] {
    if (!jobs || !columnId) {
      return []
    }

    const column = this.getColumnById(columnId)
    if (!column) {
      return []
    }

    const validStatuses = new Set(column.subCategories.map((subCat) => subCat.statusKey))

    const filteredJobs = this.filterKanbanJobs(jobs)
    return filteredJobs.filter((job) => job.status_key && validStatuses.has(job.status_key))
  }

  static getBadgeInfo(status: string): { label: string; colorClass: string } {
    if (!status) {
      return {
        label: 'Unknown',
        colorClass: 'bg-gray-400',
      }
    }

    const subCategory = this.getSubCategoryForStatus(status)

    if (subCategory) {
      return {
        label: subCategory.badgeLabel,
        colorClass: subCategory.badgeColorClass,
      }
    }

    return {
      label: status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      colorClass: 'bg-gray-400',
    }
  }

  static getStatusesByColumn(): Record<string, string[]> {
    const result: Record<string, string[]> = {}

    for (const column of this.getAllColumns()) {
      result[column.columnId] = column.subCategories.map((subCat) => subCat.statusKey)
    }

    return result
  }

  static getDefaultStatusForColumn(columnId: string): string {
    switch (columnId) {
      case 'draft':
        return 'quoting'
      case 'awaiting_approval':
        return 'accepted_quote'
      case 'on_hold':
        return 'on_hold'
      case 'in_progress':
        return 'in_progress'
      case 'recently_completed':
        return 'recently_completed'
      case 'archived':
        return 'archived'
      default:
        return columnId
    }
  }
}
