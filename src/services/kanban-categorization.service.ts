/**
 * Kanban Categorization Service - Frontend
 *
 * Mirrors the backend categorization service but for frontend use
 * Follows SRP by handling only kanban categorization logic
 */

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
  // Define the hierarchical structure matching backend
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
        // Note: 'special' is filtered out and not shown in kanban
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

  // Status to column mapping for quick lookup
  // Note: 'special' is intentionally excluded (filtered from kanban)
  private static readonly STATUS_TO_COLUMN_MAP: Record<string, string> = {
    quoting: 'draft',
    accepted_quote: 'awaiting_approval',
    awaiting_materials: 'on_hold',
    awaiting_staff: 'on_hold',
    awaiting_site_availability: 'on_hold',
    in_progress: 'in_progress',
    recently_completed: 'recently_completed',
    completed: 'archived', // completed goes to archived now
    rejected: 'archived',
    archived: 'archived',
    on_hold: 'on_hold', // Fallback for generic on_hold
    // 'special' is intentionally omitted - filtered from kanban
  }

  /**
   * Get the kanban column for a given job status
   * Uses guard clause for invalid status
   */
  static getColumnForStatus(status: string): string {
    // Guard clause - early return for invalid status
    if (!status) {
      return 'draft'
    }

    return this.STATUS_TO_COLUMN_MAP[status] || 'draft'
  }

  /**
   * Get the sub-category information for a status
   * Uses early return pattern
   */
  static getSubCategoryForStatus(status: string): KanbanSubCategory | null {
    // Guard clause for empty status
    if (!status) {
      return null
    }

    const columnId = this.getColumnForStatus(status)
    const column = this.COLUMN_STRUCTURE[columnId]

    if (!column) {
      return null
    }

    // Find the sub-category that matches this status
    return column.subCategories.find((subCat) => subCat.statusKey === status) || null
  }

  /**
   * Get all kanban columns in display order
   */
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

  /**
   * Get a specific column by its ID
   * Uses guard clause for invalid ID
   */
  static getColumnById(columnId: string): KanbanColumn | null {
    // Guard clause for invalid columnId
    if (!columnId) {
      return null
    }

    return this.COLUMN_STRUCTURE[columnId] || null
  }
  /**
   * Filter jobs for kanban display - excludes 'special' status
   */
  static filterKanbanJobs<T extends { status?: string }>(jobs: T[]): T[] {
    // Guard clause for empty/invalid jobs
    if (!jobs) {
      return []
    }

    return jobs.filter((job) => job.status !== 'special')
  }
  /**
   * Filter jobs that belong to a specific column
   */
  static getJobsForColumn<T extends { status?: string }>(jobs: T[], columnId: string): T[] {
    // Guard clauses
    if (!jobs || !columnId) {
      return []
    }

    const column = this.getColumnById(columnId)
    if (!column) {
      return []
    }

    const validStatuses = new Set(column.subCategories.map((subCat) => subCat.statusKey))

    // Filter by column and exclude special jobs
    const filteredJobs = this.filterKanbanJobs(jobs)
    return filteredJobs.filter((job) => job.status && validStatuses.has(job.status))
  }

  /**
   * Get badge display information for a status
   * Uses switch-case pattern for discrete values
   */
  static getBadgeInfo(status: string): { label: string; colorClass: string } {
    // Guard clause for empty status
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

    // Fallback for unknown statuses
    return {
      label: status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      colorClass: 'bg-gray-400',
    }
  }

  /**
   * Get all available statuses grouped by column
   */
  static getStatusesByColumn(): Record<string, string[]> {
    const result: Record<string, string[]> = {}

    for (const column of this.getAllColumns()) {
      result[column.columnId] = column.subCategories.map((subCat) => subCat.statusKey)
    }

    return result
  }
}
