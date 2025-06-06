export interface Job {
  id: number
  name: string
  description: string
  status: string
  client: string
  created_by: string
  created_date: string
  paid: boolean
  job_number: string
}

export interface StatusChoice {
  key: string
  label: string
}

export interface AdvancedFilters {
  jobNumber: string
  name: string
  description: string
  client: string
  createdBy: string
  status: string[]
  createdAfter: string
  createdBefore: string
  paid: string
}

export interface KanbanState {
  jobs: Job[]
  filteredJobs: Job[]
  isLoading: boolean
  error: string | null
  totalArchivedJobs: number
}

export interface SearchFilters {
  query: string
  advanced: AdvancedFilters
}
