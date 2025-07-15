import { z } from 'zod'
import { schemas } from '../generated/api'

// UI-specific extension of TimesheetCostLine with client-side metadata
export const TimesheetEntryWithMetaSchema = schemas.TimesheetCostLine.extend({
  tempId: z.string().optional(),
  _isSaving: z.boolean().optional(),
  isNewRow: z.boolean().optional(),
  isModified: z.boolean().optional(),
})

export type TimesheetEntryWithMeta = z.infer<typeof TimesheetEntryWithMetaSchema>

// Quote Import Schemas - For endpoints not yet covered by generated API
// REASON: The quote import endpoints (/job/rest/jobs/:id/quote/import/preview/ and
// /job/rest/jobs/:id/quote/import/) are not included in the OpenAPI spec, so we need
// local schemas for these specific file upload endpoints that use FormData

export const ValidationIssueSchema = z.object({
  severity: z.enum(['error', 'warning']),
  message: z.string(),
  line_number: z.number().optional(),
  column: z.string().optional(),
})

export type ValidationIssue = z.infer<typeof ValidationIssueSchema>

export const DraftLineSchema = z.object({
  kind: z.string(),
  desc: z.string(),
  quantity: z.number(),
  unit_cost: z.number(),
  total_cost: z.number(),
  category: z.string().optional(),
})

export type DraftLine = z.infer<typeof DraftLineSchema>

export const DiffPreviewSchema = z.object({
  additions_count: z.number(),
  updates_count: z.number(),
  deletions_count: z.number(),
  total_changes: z.number(),
  next_revision: z.number(),
})

export type DiffPreview = z.infer<typeof DiffPreviewSchema>

// UI-specific CostLine with number types for calculations
// REASON: The API returns quantity/unit_cost/unit_rev as strings for decimal precision,
// but UI components need number types for calculations and display
export const UICostLineSchema = z.object({
  id: z.number(),
  kind: z.enum(['time', 'material', 'adjust']),
  desc: z.string(),
  quantity: z.number(),
  unit_cost: z.number(),
  unit_rev: z.number(),
  total_cost: z.number(),
  total_rev: z.number(),
  ext_refs: z.record(z.unknown()).optional(),
  meta: z.record(z.unknown()).optional(),
})

export type UICostLine = z.infer<typeof UICostLineSchema>

// UI-specific CostSet with converted cost lines
export const UICostSetSchema = z.object({
  id: z.number(),
  kind: z.enum(['estimate', 'quote', 'actual']),
  rev: z.number(),
  created: z.string(),
  summary: z
    .object({
      cost: z.number(),
      rev: z.number(),
      hours: z.number(),
    })
    .optional(),
  cost_lines: z.array(UICostLineSchema),
})

export type UICostSet = z.infer<typeof UICostSetSchema>

export const ValidationReportSchema = z.object({
  issues: z.array(ValidationIssueSchema),
  warnings: z.array(z.string()),
  errors: z.array(z.string()),
})

export type ValidationReport = z.infer<typeof ValidationReportSchema>

export const PreviewResultSchema = z.object({
  success: z.boolean(),
  validation_report: ValidationReportSchema,
  can_proceed: z.boolean(),
  draft_lines: z.array(DraftLineSchema),
  diff_preview: DiffPreviewSchema.nullable(),
  error: z.string().optional(),
})

export type PreviewResult = z.infer<typeof PreviewResultSchema>

export const QuoteImportPreviewResponseSchema = z.object({
  job_id: z.string(),
  job_name: z.string(),
  preview: PreviewResultSchema,
})

export type QuoteImportPreviewResponse = z.infer<typeof QuoteImportPreviewResponseSchema>

export const ImportChangesSchema = z.object({
  additions: z.number(),
  updates: z.number(),
  deletions: z.number(),
})

export type ImportChanges = z.infer<typeof ImportChangesSchema>

export const ImportValidationSchema = z.object({
  warnings_count: z.number().optional(),
  has_warnings: z.boolean().optional(),
  errors_count: z.number().optional(),
  critical_count: z.number().optional(),
  can_proceed: z.boolean().optional(),
})

export type ImportValidation = z.infer<typeof ImportValidationSchema>

export const QuoteImportResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  job_id: z.string(),
  cost_set: schemas.CostSet.optional(),
  changes: ImportChangesSchema.optional(),
  validation: ImportValidationSchema.optional(),
  error: z.string().optional(),
})

export type QuoteImportResponse = z.infer<typeof QuoteImportResponseSchema>

export const QuoteStatusResponseSchema = z.object({
  job_id: z.string(),
  job_name: z.string(),
  has_quote: z.boolean(),
  quote: schemas.CostSet.optional(),
  revision: z.number().optional(),
})

export type QuoteStatusResponse = z.infer<typeof QuoteStatusResponseSchema>

// Job with Financial Data - Fixes DRF Spectacular schema generation issue
// The generated Job schema defines latest_estimate, latest_actual, quote, invoice as z.object({})
// but the actual API returns structured data via SerializerMethodField in JobSerializer
// This schema defines the correct structure that the API actually returns
export const JobWithFinancialDataSchema = schemas.Job.extend({
  latest_estimate: z
    .object({
      summary: z
        .object({
          rev: z.number(),
        })
        .optional(),
    })
    .nullable()
    .optional(),
  latest_actual: z
    .object({
      summary: z
        .object({
          rev: z.number(),
        })
        .optional(),
      cost_lines: z
        .array(
          z.object({
            kind: z.string(),
            total_rev: z.number(),
          }),
        )
        .optional(),
    })
    .nullable()
    .optional(),
  quote: z
    .object({
      total_excl_tax: z.number(),
      online_url: z.string().optional(),
    })
    .nullable()
    .optional(),
  invoice: z
    .object({
      total_excl_tax: z.number(),
      online_url: z.string().optional(),
    })
    .nullable()
    .optional(),
})

export type JobWithFinancialData = z.infer<typeof JobWithFinancialDataSchema>

// Xero Sync Response for custom Xero endpoints that aren't in the generated API
export const XeroSyncResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  xero_id: z.string().optional(),
  online_url: z.string().url().optional(),
  error_type: z.string().optional(),
  details: z.string().optional(),
})

export type XeroSyncResponse = z.infer<typeof XeroSyncResponseSchema>

/**
 * JobDetailResponseWithFinancialData - Local schema for JobDetailResponse with financial data
 *
 * REASON: DRF Spectacular cannot properly type complex JSONField structures in JobDetailResponse.
 * The generated JobDetailResponse.data (Job type) has latest_quote, quote, invoice as generic {} objects
 * due to SerializerMethodField and JSONField limitations in OpenAPI generation.
 *
 * This extends the generated JobDetailResponse to use JobWithFinancialData for proper typing
 * of financial fields (latest_quote.cost_lines, quote.total_excl_tax, etc.) in JobQuoteTab.vue.
 *
 * SIMILAR ISSUE: Same DRF Spectacular limitation as JobWithFinancialData, but for the
 * JobDetailResponse wrapper structure used by /job/rest/jobs/:id/ endpoint.
 */
export const JobDetailResponseWithFinancialDataSchema = schemas.JobDetailResponse.extend({
  data: JobWithFinancialDataSchema,
})

export type JobDetailResponseWithFinancialData = z.infer<
  typeof JobDetailResponseWithFinancialDataSchema
>

// Server-Sent Event type for Xero sync progress (UI-specific SSE events)
export const XeroSseEventSchema = z.object({
  datetime: z.string(),
  message: z.string(),
  severity: z.enum(['info', 'warning', 'error']).optional(),
  entity: z.string().nullable().optional(),
  progress: z.number().nullable().optional(),
  records_updated: z.number().nullable().optional(),
  status: z.string().nullable().optional(),
  overall_progress: z.number().optional(),
  entity_progress: z.number().optional(),
  sync_status: z.enum(['success', 'error', 'running']).optional(),
  error_messages: z.array(z.string()).optional(),
  missing_fields: z.array(z.string()).optional(),
})

export type XeroSseEvent = z.infer<typeof XeroSseEventSchema>

// UI-specific Kanban Column schema for frontend kanban organization
// REASON: Frontend-specific structure for organizing kanban columns with visual properties
// (colorTheme, badgeColorClass) that are not part of the backend API
export const KanbanColumnSchema = z.object({
  columnId: z.string(),
  columnTitle: z.string(),
  statusKey: z.string(), // Direct 1:1 mapping to job status
  colorTheme: z.string(),
  badgeColorClass: z.string(),
})

export type KanbanColumn = z.infer<typeof KanbanColumnSchema>

// Status Choice Schema - For Kanban status management
// REASON: StatusChoice represents the display-friendly version of job statuses
// with labels, keys, and tooltips for UI components
export const StatusChoiceSchema = z.object({
  key: z.string(),
  label: z.string(),
  tooltip: z.string().optional(),
})

export type StatusChoice = z.infer<typeof StatusChoiceSchema>

// UI-specific type for vue-advanced-chat component
// REASON: The vue-advanced-chat component requires a specific message format
// that differs from the API's JobQuoteChat structure
export const VueChatMessageSchema = z.object({
  _id: z.string(),
  content: z.string(),
  senderId: z.string(),
  username: z.string(),
  timestamp: z.string(),
  system: z.boolean(),
  metadata: z.record(z.unknown()).optional(),
})

export type VueChatMessage = z.infer<typeof VueChatMessageSchema>

// Job Pricing UI Schema - For JobPricingGrids component
// REASON: This is a UI-specific structure for displaying pricing breakdowns
// in the job pricing grids component, not directly mapped to API responses
export const PricingSectionSchema = z.object({
  time: z.number(),
  materials: z.number(),
  adjustments: z.number(),
  total: z.number(),
})

export type PricingSection = z.infer<typeof PricingSectionSchema>

// Job Event schema for job history and event tracking
// REASON: Job events are returned from /job/rest/jobs/:id/events/ endpoint
// but the specific structure is not properly typed in the generated API
export const JobEventSchema = z.object({
  id: z.string().or(z.number()),
  description: z.string(),
  timestamp: z.string(),
  staff: z.string(),
  event_type: z.string(),
})

export type JobEvent = z.infer<typeof JobEventSchema>

// Weekly Timesheet schemas for frontend-specific structure
// REASON: WeeklyTimesheetData.staff_data is typed as z.unknown() in generated API
// These schemas define the actual structure used by weekly timesheet components
export const WeeklyDayDataSchema = z.object({
  hours: z.number(),
  status: z.string(),
  leave_type: z.string().optional(),
  overtime: z.number().optional(),
  leave_hours: z.number().optional(),
  standard_hours: z.number().optional(),
  time_and_half_hours: z.number().optional(),
  double_time_hours: z.number().optional(),
  unpaid_hours: z.number().optional(),
})

export type WeeklyDayData = z.infer<typeof WeeklyDayDataSchema>

export const WeeklyStaffDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  total_hours: z.number(),
  total_overtime: z.number().optional(),
  total_leave_hours: z.number().optional(),
  billable_percentage: z.number(),
  weekly_hours: z.array(WeeklyDayDataSchema),
})

export type WeeklyStaffData = z.infer<typeof WeeklyStaffDataSchema>

// Weekly Metrics Modal schemas for UI-specific weekly summary data
// REASON: WeeklySummaryData represents aggregated weekly metrics for the WeeklyMetricsModal
// This is a UI-specific structure not directly provided by the API schemas
export const WeeklySummaryDataSchema = z.object({
  weeklyTotals: z
    .object({
      totalActualHours: z.number(),
      totalBillableHours: z.number(),
      totalRevenue: z.number(),
    })
    .optional(),
  summaryStats: z
    .object({
      completionRate: z.number(),
    })
    .optional(),
  jobBreakdown: z
    .array(
      z.object({
        jobId: z.string(),
        jobName: z.string(),
        clientName: z.string(),
        totalHours: z.number(),
        revenue: z.number(),
      }),
    )
    .optional(),
})

export type WeeklySummaryData = z.infer<typeof WeeklySummaryDataSchema>

// Purchase Order Lines UI Schema - For PoLinesTable component
// REASON: This extends the API PurchaseOrderLine with UI-specific props for DataTable
export const PoLineUISchema = schemas.PurchaseOrderLine.extend({
  job_number: z.string().optional(),
  job_name: z.string().optional(),
  client_name: z.string().optional(),
})

export type PoLineUI = z.infer<typeof PoLineUISchema>

// DataTable context schema for PO Lines
export const DataTableRowContextSchema = z.object({
  row: z.object({
    original: PoLineUISchema,
    index: z.number(),
  }),
})

export type DataTableRowContext = z.infer<typeof DataTableRowContextSchema>

// Delivery Receipt specific schemas for UI-only types
// REASON: These types are used for delivery receipt allocation UI and are not covered by generated API

export const DeliveryAllocationSchema = z.object({
  job_id: z.string().uuid().nullable(),
  stock_location: z.string().nullable(),
  quantity: z.number(),
  retail_rate: z.number(),
})

export type DeliveryAllocation = z.infer<typeof DeliveryAllocationSchema>

// DataTable context for Delivery Receipt Lines
export const DeliveryDataTableRowContextSchema = z.object({
  row: z.object({
    original: schemas.PurchaseOrderLine,
    index: z.number(),
  }),
})

export type DeliveryDataTableRowContext = z.infer<typeof DeliveryDataTableRowContextSchema>

// Quote Summary Card UI schemas
// REASON: QuoteData represents the structured quote format returned from cost line
// aggregation and quote generation endpoints, not covered by base Job schema
export const QuoteCostLineSchema = z.object({
  id: z.number().optional(),
  kind: z.string(),
  desc: z.string(),
  quantity: z.number(),
  unit_cost: z.number(),
  unit_rev: z.number(),
})

export const QuoteDataSchema = z.object({
  id: z.string(),
  kind: z.literal('quote'),
  rev: z.number(),
  created: z.string(),
  summary: z.object({
    cost: z.number(),
    rev: z.number(),
    hours: z.number(),
  }),
  cost_lines: z.array(QuoteCostLineSchema),
})

export type QuoteData = z.infer<typeof QuoteDataSchema>
export type QuoteCostLine = z.infer<typeof QuoteCostLineSchema>

// Cost Analysis UI schema
// REASON: CostSetSummary represents aggregated cost analysis data for UI display,
// calculated from cost lines and not directly provided by the API
export const CostSetSummarySchema = z.object({
  cost: z.number(),
  rev: z.number(),
  hours: z.number(),
  profitMargin: z.number(),
})

export type CostSetSummary = z.infer<typeof CostSetSummarySchema>

// Timesheet UI schemas for frontend-specific timesheet grid functionality
// REASON: These types are used by timesheet grid components and are not fully
// covered by the generated API schemas for UI-specific functionality

export const TimesheetEntryJobSelectionItemSchema = z.object({
  id: z.string(),
  jobNumber: z.string(),
  jobName: z.string(),
  client: z.string(),
  chargeOutRate: z.number(),
})

export type TimesheetEntryJobSelectionItem = z.infer<typeof TimesheetEntryJobSelectionItemSchema>

export const TimesheetEntryStaffMemberSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
})

export type TimesheetEntryStaffMember = z.infer<typeof TimesheetEntryStaffMemberSchema>

// Job metrics for weekly timesheet overview
// REASON: This represents aggregated metrics data for the weekly timesheet modal
// and is specific to the UI presentation layer, not part of the main API schemas
export const JobMetricsSchema = z.object({
  job_count: z.number(),
  total_estimated_hours: z.number().optional(),
  total_actual_hours: z.number().optional(),
  total_revenue: z.number().optional(),
  graphic: z.string().optional(),
})

export type JobMetrics = z.infer<typeof JobMetricsSchema>

// Staff Member for UI components (extends generated Staff with computed display properties)
// REASON: The generated Staff schema has first_name/last_name but UI components need
// computed name and initials properties for display in dropdowns and lists
export const StaffMemberUISchema = schemas.Staff.extend({
  name: z.string(), // Computed from first_name + last_name
  initials: z.string(), // Computed from first_name + last_name initials
})

export type StaffMemberUI = z.infer<typeof StaffMemberUISchema>

// Paid Absence UI schemas for timesheet absence management
// REASON: These types are used by PaidAbsenceModal for absence form submission and summary display
// and are specific to the UI presentation layer for absence management

export const AbsenceFormSchema = z.object({
  staffId: z.string(),
  absenceType: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  hoursPerDay: z.string(),
  customHours: z.number().optional(),
  description: z.string(),
})

export type AbsenceForm = z.infer<typeof AbsenceFormSchema>

export const AbsenceSummarySchema = z.object({
  duration: z.string(),
  totalHours: z.number(),
  workingDays: z.number(),
})

export type AbsenceSummary = z.infer<typeof AbsenceSummarySchema>

// Staff Assignment for drag-and-drop operations
// REASON: Used in KanbanView for staff-to-job assignment events via drag-and-drop,
// contains UI-specific event payload data that doesn't map to generated API schemas

export const StaffAssignmentPayloadSchema = z.object({
  staffId: z.string(),
  jobId: z.string(),
})

export type StaffAssignmentPayload = z.infer<typeof StaffAssignmentPayloadSchema>

// Generic API Error structure for error handling utilities
// REASON: Used by error handling utilities for generic error parsing,
// doesn't correspond to specific API endpoints but covers common error response patterns

export const ApiErrorSchema = z.object({
  response: z
    .object({
      data: z
        .object({
          error: z.string().optional(),
          message: z.string().optional(),
          details: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  message: z.string().optional(),
})

export type ApiError = z.infer<typeof ApiErrorSchema>

// Metal Type Option for UI dropdowns and selections
// REASON: Used in PO lines table for metal type selection,
// represents static UI options that don't come from API

export const MetalTypeOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
})

export type MetalTypeOption = z.infer<typeof MetalTypeOptionSchema>

// Xero Item with UI-specific properties
// REASON: Store interface adds id and unit_cost properties not in generated XeroItem,
// needed for UI operations and store functionality

export const XeroItemUISchema = schemas.XeroItem.extend({
  id: z.string(),
  unit_cost: z.string().nullable().optional(),
})

export type XeroItemUI = z.infer<typeof XeroItemUISchema>

// IMS (Integrated Management System) Schemas for timesheet export functionality
// REASON: These schemas are specific to IMS export service and don't have
// corresponding generated types in the API

// Staff Avatar Schema - Extends ModernStaff with UI-specific display properties
// REASON: Avatar component needs display_name, initials, and avatar_url fields
// that are computed/derived from the base Staff data for UI presentation

export const StaffAvatarSchema = schemas.ModernStaff.extend({
  display_name: z.string(),
  initials: z.string().optional(),
  avatar_url: z.string().nullable().optional(),
})

export type StaffAvatar = z.infer<typeof StaffAvatarSchema>

// Staff Avatar Size enum for component sizing
export const StaffAvatarSizeSchema = z.enum(['sm', 'normal'])

export type StaffAvatarSize = z.infer<typeof StaffAvatarSizeSchema>

// Error Record Schema - Extends XeroError with UI-specific error display fields
// REASON: ErrorDialog component needs severity and stack fields for error display
// that are not present in the base XeroError schema from the API

export const ErrorRecordSchema = schemas.XeroError.extend({
  severity: z.string().optional(),
  stack: z.string().optional(),
})

export type ErrorRecord = z.infer<typeof ErrorRecordSchema>

// Date Range Schema for UI filter components
// REASON: Used by ErrorFilter and other filter components for date range selection,
// represents UI-specific date filtering functionality not covered by API schemas

export const DateRangeSchema = z.object({
  start: z.string().nullable(),
  end: z.string().nullable(),
})

export type DateRange = z.infer<typeof DateRangeSchema>
