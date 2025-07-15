/**
 * Kanban Categorization Service
 *
 * Service layer for managing simplified kanban structure:
 * - 6 main columns with 1:1 status mapping (no sub-columns)
 * - Column = Status (simplified approach as requested by Cindy)
 * - Hidden statuses: special, rejected, archived (maintained but not shown)
 */

import { z } from 'zod'
import { schemas } from '../api/generated/api'
import type { KanbanColumn } from '../api/local/schemas'

// Use generated Job type from Zodios API
type Job = z.infer<typeof schemas.Job>

// Job-like interface for status checking (supports both Job and partial job objects)
interface JobWithStatus {
  status?: string
  status_key?: string
}

export class KanbanCategorizationService {
  // Simplified column structure - no more sub-categories
  private static readonly COLUMN_STRUCTURE: Record<string, KanbanColumn> = {
    draft: {
      columnId: 'draft',
      columnTitle: 'Draft',
      statusKey: 'draft',
      colorTheme: 'yellow',
      badgeColorClass: 'bg-yellow-500',
    },
    awaiting_approval: {
      columnId: 'awaiting_approval',
      columnTitle: 'Awaiting Approval',
      statusKey: 'awaiting_approval',
      colorTheme: 'orange',
      badgeColorClass: 'bg-orange-500',
    },
    approved: {
      columnId: 'approved',
      columnTitle: 'Approved',
      statusKey: 'approved',
      colorTheme: 'green',
      badgeColorClass: 'bg-green-500',
    },
    in_progress: {
      columnId: 'in_progress',
      columnTitle: 'In Progress',
      statusKey: 'in_progress',
      colorTheme: 'blue',
      badgeColorClass: 'bg-blue-500',
    },
    unusual: {
      columnId: 'unusual',
      columnTitle: 'Unusual',
      statusKey: 'unusual',
      colorTheme: 'purple',
      badgeColorClass: 'bg-purple-500',
    },
    recently_completed: {
      columnId: 'recently_completed',
      columnTitle: 'Recently Completed',
      statusKey: 'recently_completed',
      colorTheme: 'emerald',
      badgeColorClass: 'bg-emerald-500',
    },
  }

  // Status to column mapping for quick lookup - simplified 1:1 mapping
  private static readonly STATUS_TO_COLUMN_MAP: Record<string, string> = {
    // New status structure - 1:1 mapping (column = status)
    draft: 'draft',
    awaiting_approval: 'awaiting_approval',
    approved: 'approved',
    in_progress: 'in_progress',
    unusual: 'unusual',
    recently_completed: 'recently_completed',
    // Legacy status mappings for backward compatibility (will be migrated)
    quoting: 'awaiting_approval', // Legacy: map to awaiting_approval
    accepted_quote: 'approved', // Legacy: map to approved
    awaiting_materials: 'in_progress', // Legacy: map to in_progress
    awaiting_staff: 'in_progress', // Legacy: map to in_progress
    awaiting_site_availability: 'in_progress', // Legacy: map to in_progress
    on_hold: 'unusual', // Legacy: map to unusual
    completed: 'recently_completed', // Legacy: map to recently_completed
    // Hidden statuses (not shown on kanban): special, rejected, archived
  }

  static getColumnForStatus(status: string): string {
    return this.STATUS_TO_COLUMN_MAP[status] || 'draft'
  }

  static getColumnInfo(columnId: string): KanbanColumn | null {
    return this.COLUMN_STRUCTURE[columnId] || null
  }

  static getColumnInfoForStatus(status: string): KanbanColumn | null {
    const columnId = this.getColumnForStatus(status)
    return this.getColumnInfo(columnId)
  }

  static getAllColumns(): KanbanColumn[] {
    return [
      this.COLUMN_STRUCTURE.draft,
      this.COLUMN_STRUCTURE.awaiting_approval,
      this.COLUMN_STRUCTURE.approved,
      this.COLUMN_STRUCTURE.in_progress,
      this.COLUMN_STRUCTURE.unusual,
      this.COLUMN_STRUCTURE.recently_completed,
    ]
  }

  static getJobsForColumn(
    jobs: (Job | JobWithStatus)[],
    columnId: string,
  ): (Job | JobWithStatus)[] {
    if (!this.COLUMN_STRUCTURE[columnId]) {
      return []
    }

    const column = this.COLUMN_STRUCTURE[columnId]
    // With simplified structure, only jobs with exact status match belong to column
    return jobs.filter(
      (job) => job.status === column.statusKey || job.status_key === column.statusKey,
    )
  }

  static getBadgeInfo(status: string): { label: string; colorClass: string } {
    const columnInfo = this.getColumnInfoForStatus(status)

    if (columnInfo) {
      return {
        label: columnInfo.columnTitle,
        colorClass: columnInfo.badgeColorClass,
      }
    }

    // Fallback for unknown statuses
    return {
      label: status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      colorClass: 'bg-gray-400',
    }
  }

  static isStatusHiddenFromKanban(status: string): boolean {
    const hiddenStatuses = new Set(['special', 'rejected', 'archived'])
    return hiddenStatuses.has(status)
  }

  static getVisibleJobsForKanban(jobs: (Job | JobWithStatus)[]): (Job | JobWithStatus)[] {
    return jobs.filter(
      (job) => !this.isStatusHiddenFromKanban((job.status || job.status_key || '') as string),
    )
  }

  static getDefaultStatusForColumn(columnId: string): string {
    const column = this.getColumnInfo(columnId)
    return column ? column.statusKey : 'draft'
  }

  static getStatusesForColumn(columnId: string): string[] {
    const column = this.getColumnInfo(columnId)
    return column ? [column.statusKey] : []
  }
}
