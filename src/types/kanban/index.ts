import type { Staff } from '../index'

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

export interface KanbanColumn {
  status_key: string
  label: string
  tooltip?: string
  jobs: KanbanJob[]
}

export interface DragEndEvent {
  oldIndex: number
  newIndex: number
  from: HTMLElement
  to: HTMLElement
  item: HTMLElement
}

export interface KanbanFilters {
  staffIds: string[]
  searchTerm: string
  showArchived: boolean
}

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
