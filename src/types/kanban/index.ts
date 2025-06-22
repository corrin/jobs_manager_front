// Types specific to Kanban view functionality
// Internal TypeScript types, not for validation

import type { Staff } from '../index'

// Job specific to Kanban view
export interface KanbanJob {
  id: string
  name: string
  description?: string | null
  job_number: number
  client_name: string
  contact_person?: string | null
  people: Staff[]
  status: string
  status_key: string
  paid: boolean
  created_by_id?: string | null
  created_at?: string
  priority?: number
}

// Kanban column configuration
export interface KanbanColumn {
  status_key: string
  label: string
  tooltip?: string
  jobs: KanbanJob[]
}

// Drag and drop event types
export interface DragEndEvent {
  oldIndex: number
  newIndex: number
  from: HTMLElement
  to: HTMLElement
  item: HTMLElement
}

// Filter state for Kanban
export interface KanbanFilters {
  staffIds: string[]
  searchTerm: string
  showArchived: boolean
}

// Advanced filters specific to Kanban
export interface KanbanAdvancedFilters {
  job_number: string
  name: string
  description: string
  client_name: string
  contact_person: string
  created_by: string
  status: string[]
  created_after: string
  created_before: string
  paid: string
}
