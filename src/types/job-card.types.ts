import type { Job } from './kanban.types'

export interface JobCardProps {
  job: Job
}

export interface JobCardEmits {
  (e: 'click', job: Job): void
}

export type JobStatus = 'pending' | 'in_progress' | 'review' | 'completed' | 'archived'

export interface StatusConfig {
  variant: 'default' | 'secondary' | 'outline' | 'destructive'
  borderClass: string
}
