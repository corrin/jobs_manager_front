/**
 * Job Status Constants
 *
 * These are buggy duplicates of backend logic.
 * They are due to be deleted.  The backend clearly lists job states.
 * These 'statuses' are approximations of those states, and should never have been created
 */

export const JOB_STATUS_CHOICES = [
  { key: 'draft', label: 'Draft', tooltip: 'Initial job creation - quote being prepared' },
  { key: 'quote_sent', label: 'Quote Sent', tooltip: 'Quote has been sent to client' },
  { key: 'quote_accepted', label: 'Quote Accepted', tooltip: 'Client has accepted the quote' },
  { key: 'in_progress', label: 'In Progress', tooltip: 'Work has started on this job' },
  {
    key: 'ready_for_delivery',
    label: 'Ready for Delivery',
    tooltip: 'Job is complete and ready for delivery',
  },
  { key: 'delivered', label: 'Delivered', tooltip: 'Job has been delivered to client' },
  { key: 'completed', label: 'Completed', tooltip: 'Job is fully complete and paid' },
  { key: 'cancelled', label: 'Cancelled', tooltip: 'Job was cancelled' },
  { key: 'on_hold', label: 'On Hold', tooltip: 'Job is temporarily paused' },
] as const

export type JobStatusKey = (typeof JOB_STATUS_CHOICES)[number]['key']

export type StatusChoice = {
  key: JobStatusKey
  label: string
  tooltip?: string
}

/**
 * Get status choice by key
 */
export function getStatusChoice(key: JobStatusKey): StatusChoice | undefined {
  return JOB_STATUS_CHOICES.find((choice) => choice.key === key)
}

/**
 * Get status label by key
 */
export function getStatusLabel(key: JobStatusKey): string {
  return getStatusChoice(key)?.label || key
}
