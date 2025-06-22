import { z } from 'zod'

// Base schemas
export const PersonSchema = z.object({
  id: z.string(), // UUIDs are strings, not numbers
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  display_name: z.string(),
  email: z.string().optional(),
  initials: z.string().optional(),
  avatar_url: z.string().nullable().optional(),
  icon: z.string().nullable().optional(), // Keeping for backward compatibility
})

export const JobSchema = z.object({
  id: z.string(), // UUIDs are strings
  name: z.string(),
  description: z.string().nullable().optional(), // Can be null
  job_number: z.number(), // Backend returns numbers for job_number
  client_name: z.string(),
  contact_person: z.string().nullable().optional(), // Can be null
  people: z.array(PersonSchema).default([]),
  status: z.string(),
  status_key: z.string(), // Added status_key field
  paid: z.boolean(),
  created_by_id: z.string().nullable().optional(), // UUIDs are strings
  created_at: z.string().optional(),
  priority: z.number().optional(),
  // New badge properties for kanban categorization
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

// API Response schemas
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

// Type inference
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
