import { z } from 'zod'

export const PersonSchema = z.object({
  id: z.string(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  display_name: z.string(),
  email: z.string().optional(),
  initials: z.string().optional(),
  avatar_url: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
})

export const JobSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  job_number: z.number(),
  client_name: z.string(),
  contact_person: z.string().nullable().optional(),
  people: z.array(PersonSchema).default([]),
  status: z.string(),
  status_key: z.string(),
  paid: z.boolean(),
  created_by_id: z.string().nullable().optional(),
  created_at: z.string().optional(),
  priority: z.number().optional(),

  badge_label: z.string().optional(),
  badge_color: z.string().optional(),
})

export const StatusChoiceSchema = z.object({
  key: z.string(),
  label: z.string(),
  tooltip: z.string().optional(),
})

export const AdvancedFiltersSchema = z.object({
  job_number: z.string().default(''),
  name: z.string().default(''),
  description: z.string().default(''),
  client_name: z.string().default(''),
  contact_person: z.string().default(''),
  created_by: z.string().default(''),
  status: z.array(z.string()).default([]),
  created_after: z.string().default(''),
  created_before: z.string().default(''),
  paid: z.string().default(''),
})

export const JobsApiResponseSchema = z.object({
  success: z.boolean(),
  jobs: z.array(JobSchema),
  total: z.number(),
  filtered_count: z.number().optional(),
})

export const AllJobsApiResponseSchema = z.object({
  success: z.boolean(),
  active_jobs: z.array(JobSchema),
  archived_jobs: z.array(JobSchema),
  total_archived: z.number(),
})

export const StatusApiResponseSchema = z.object({
  success: z.boolean(),
  statuses: z.record(z.string()),
  tooltips: z.record(z.string()),
})

export const UpdateJobStatusRequestSchema = z.object({
  status: z.string(),
})

export const ReorderJobRequestSchema = z.object({
  before_id: z.string().nullable().optional(),
  after_id: z.string().nullable().optional(),
  status: z.string().optional(),
})

export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
})

export type Person = z.infer<typeof PersonSchema>
export type Job = z.infer<typeof JobSchema>
export type StatusChoice = z.infer<typeof StatusChoiceSchema>
export type AdvancedFilters = z.infer<typeof AdvancedFiltersSchema>
export type JobsApiResponse = z.infer<typeof JobsApiResponseSchema>
export type AllJobsApiResponse = z.infer<typeof AllJobsApiResponseSchema>
export type StatusApiResponse = z.infer<typeof StatusApiResponseSchema>
export type UpdateJobStatusRequest = z.infer<typeof UpdateJobStatusRequestSchema>
export type ReorderJobRequest = z.infer<typeof ReorderJobRequestSchema>
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>
