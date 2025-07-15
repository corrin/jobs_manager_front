# DEPR| Category | Total Found | Migrated | Remaining | Progress |

| ----------------- | ----------- | -------- | --------- | --------- |
| Axios API calls | 15 | 4 | 11 | 26.7% |
| Fetch API calls | 0 | 0 | 0 | 0% |
| @deprecated types | 152 | 92 | 60 | 60.5% |
| **TOTAL ITEMS** | **167** | **96** | **71** | **57.5%** | CODE MIGRATION REPORT

## Executive Summary

**CRITICAL**: Complete migration from Axios + manual interfaces to Zodios + Zod schemas required.

| Category          | Total Found | Migrated | Remaining | Progress  |
| ----------------- | ----------- | -------- | --------- | --------- |
| Axios API calls   | 15          | 4        | 11        | 26.7%     |
| Fetch API calls   | 0           | 0        | 0         | 0%        |
| @deprecated types | 152         | 99       | 53        | 65.1%     |
| **TOTAL ITEMS**   | **167**     | **103**  | **64**    | **61.7%** |

## Recent Progress

**Session 12** - Continuing Systematic Migration:

- ✅ KanbanView.vue - Migrated StaffAssignmentPayload to local schema
- ✅ JobCreateView.vue - Migrated Client interface to generated ClientSearchResult
- ✅ errorHandler.ts - Migrated ApiError interface to local schema
- ✅ metalType.ts - Migrated MetalTypeOption interface to local schema
- Removed: StaffAssignmentPayload, Client, ApiError, MetalTypeOption (4 interfaces)
- Progress: 90 → 94 migrated @deprecated types (59.2% → 61.8%)

## ✅ COMPLETED MIGRATIONS

### 1. job.service.ts - COMPLETE ✅

- **Status**: 100% migrated to pure Zodios API
- **Changes**: Replaced all manual types with z.infer from schemas
- **Endpoints used**: job*api*_, job*rest*_, api_company_defaults_retrieve

### 2. JobEditModal.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types and API calls
- **Changes**:
  - Replaced JobData with JobDetailResponse from schemas
  - Implemented job_rest_jobs_update for saving
  - Replaced manual type casting with proper Zod types
- **Impact**: Core job editing functionality now uses clean API

### 3. StaffDropdown.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types and API
- **Changes**:
  - Replaced staffService with useStaffApi composable
  - Replaced manual Staff interface with z.infer<typeof schemas.Staff>
  - Uses accounts_api_staff_list endpoint
- **Impact**: Staff selection now uses clean API

### 4. StaffPanel.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types and API
- **Changes**:
  - Replaced staffService with useStaffApi composable
  - Replaced manual Staff interface with z.infer<typeof schemas.Staff>
  - Removed manual validation (Zodios handles it)
- **Impact**: Staff panel now uses clean API

### 5. CreateClientModal.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types and API
- **Changes**:
  - Replaced clientService with api.clients_create_create
  - Replaced manual types with z.infer<typeof schemas.ClientCreateRequest>
  - Uses clients_create_create endpoint
- **Impact**: Client creation now uses clean API

### 6. ClientDropdown.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types and API
- **Changes**:
  - Replaced clientService with api.clients_all_retrieve
  - Replaced manual Client interface with z.infer<typeof schemas.Client>
  - Uses clients_all_retrieve endpoint
- **Impact**: Client selection now uses clean API

### 7. kanban-categorization.service.ts - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Moved KanbanColumn interface to schemas.ts as KanbanColumnSchema
  - Replaced local type definition with import from local schemas
  - Maintained frontend-specific UI structure for kanban organization
- **Impact**: Kanban service now uses centralized type definitions

### 8. JobPricingGrids.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Replaced deprecated PricingSection interface with PricingSectionSchema from local schemas
  - Replaced deprecated JobData interface with Job schema from generated API
  - Updated imports to use schemas from @/api/generated/api and @/api/local/schemas
  - Maintained UI-specific structure for pricing grid calculations
- **Impact**: Job pricing grids now use centralized type definitions and follow Zodios patterns

### 9. ErrorTable.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Replaced deprecated ErrorRecord interface with z.infer<typeof schemas.XeroError>
  - Uses generated XeroError schema from Zodios API
  - Removed manual type definitions
- **Impact**: Error table now uses generated API types

### 10. JobHistoryModal.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Created JobEventSchema in local schemas for job event structure
  - Replaced deprecated interface with JobEvent type from local schemas
  - Removed @deprecated comment block
- **Impact**: Job history modal now uses centralized type definitions

### 11. quoteImportService.ts - COMPLETE ✅

- **Status**: 100% migrated to local schemas
- **Changes**:
  - Removed 10 @deprecated interfaces (ValidationIssue, DraftLine, DiffPreview, etc.)
  - All interfaces now imported from local schemas instead of duplicated locally
  - Uses z.infer<typeof schemas.CostSet> for generated types
- **Impact**: Quote import service now uses centralized schema definitions

### 12. AdminErrorView.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Replaced ErrorRecord type import with z.infer<typeof schemas.XeroError>
  - Uses generated XeroError schema from Zodios API
  - Updated error state typing
- **Impact**: Admin error view now uses generated API types

### 13. debug.ts utility - COMPLETE ✅

- **Status**: 100% migrated to standard types
- **Changes**:
  - Removed @deprecated ViteImportMeta interface
  - Uses Vite's built-in import.meta.env typing
  - Simplified environment access without custom type casting
- **Impact**: Debug utility now uses standard Vite types

### 14. MonthEndSummary.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Replaced JobHistoryEntry interface with MonthEndJobHistory from generated API
  - Replaced Job interface with MonthEndJob from generated API
  - Replaced StockSummary interface with MonthEndStockJob from generated API
  - Added computed stockSummaryData to extract values from stock job history
- **Impact**: Month-end summary now uses generated API types with proper structure

### 15. StaffDetailModal.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Replaced StaffDailyData import from service with z.infer<typeof schemas.StaffDailyData>
  - Uses generated StaffDailyData schema from Zodios API
  - Removed @deprecated comment block
- **Impact**: Staff detail modal now uses generated API types

### 16. StaffRow.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Replaced StaffDailyData import from service with z.infer<typeof schemas.StaffDailyData>
  - Uses generated StaffDailyData schema from Zodios API
  - Removed @deprecated comment block
- **Impact**: Staff row component now uses generated API types

### 17. StaffWeekRow.vue - COMPLETE ✅

- **Status**: 100% migrated to local schemas
- **Changes**:
  - Created WeeklyStaffDataSchema and WeeklyDayDataSchema in local schemas
  - Replaced service imports with local schema imports
  - Added proper typing for weekly timesheet structure (API has z.unknown())
- **Impact**: Staff weekly row now uses centralized type definitions

### 18. JobViewTabs.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Replaced JobData interface with z.infer<typeof schemas.Job> from generated API
  - Replaced @deprecated TabKey type with clean local type definition
  - Updated props typing to use Job type instead of custom JobData
  - Removed both @deprecated comment blocks
- **Impact**: Job view tabs now use generated API types with full Job schema

### 14. AIProvidersDialog.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Replaced @deprecated AIProvider interface with z.infer<typeof schemas.AIProvider>
  - Updated provider type options to match ProviderTypeEnum (Claude, Gemini, Mistral)
  - Removed Portuguese comments and cleaned up code structure
  - Uses AIProviderCreateUpdate schema for local state management
- **Impact**: AI providers dialog now uses generated API types and follows Zodios patterns

### 15. PoLinesTable.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Uses PoLineUISchema from local schemas (extends schemas.PurchaseOrderLine)
  - Uses z.infer<typeof schemas.JobForPurchasing> and z.infer<typeof schemas.XeroItem>
  - Created DataTableRowContextSchema for table row typing
  - All purchase order line editing now uses generated and local schema types
- **Impact**: Purchase order lines table now uses centralized type definitions

### 16. MonthEndSummary.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Uses z.infer<typeof schemas.MonthEndJobHistory>
  - Uses z.infer<typeof schemas.MonthEndJob>
  - Uses z.infer<typeof schemas.MonthEndStockJob>
  - All month-end summary data now uses generated schema types
- **Impact**: Month-end summary component now uses centralized type definitions

### 17. KanbanColumn.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Replaced @deprecated interfaces with direct props/emits definitions
  - Uses z.infer<typeof schemas.Job> from generated API
  - Created StatusChoiceSchema in local schemas for Kanban status management
  - Removed manual interface definitions for Props and Emits
- **Impact**: Kanban column component now uses centralized type definitions

### 18. QuoteImportDialog.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Replaced @deprecated Props and Emits interfaces with inline definitions
  - Uses QuoteImportResponse from local schemas
  - Simplified component props using Vue 3 defineProps/defineEmits pattern
- **Impact**: Quote import dialog now uses proper Vue 3 patterns and centralized types

### 19. JobAttachmentsModal.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Replaced manual Props interface with inline defineProps pattern
  - Replaced JobFile import from job.schemas with z.infer<typeof schemas.JobFile>
  - Uses generated JobFile schema from Zodios API
  - Maintained proper TypeScript typing for file upload functionality
- **Impact**: Job attachments modal now uses generated API types and Vue 3 patterns

### 20. ExistingAllocationsDisplay.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Replaced @deprecated Props interface with inline defineProps pattern
  - Replaced @deprecated ExistingAllocation with z.infer<typeof schemas.AllocationItem>
  - Uses generated AllocationItem and PurchaseOrderLine schemas from Zodios API
  - Maintained proper TypeScript typing for allocation display functionality
- **Impact**: Purchase order allocation display now uses generated API types

### 21. QuoteSummaryCard.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Replaced @deprecated QuoteData interface with QuoteDataSchema in local schemas
  - Replaced @deprecated Props interface with inline defineProps pattern
  - Uses z.infer<typeof schemas.Job> for Job type
  - Created QuoteDataSchema and QuoteCostLineSchema in local schemas for UI-specific quote structure
- **Impact**: Quote summary display now uses centralized type definitions

### 22. JobActualTab.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Replaced @deprecated Props interface with inline defineProps pattern
  - Replaced @deprecated Staff interface with z.infer<typeof schemas.Staff>
  - Uses generated CostLine and CostSet schemas from Zodios API
  - Maintained proper TypeScript typing for actual cost tracking
- **Impact**: Job actual costs tab now uses generated API types

### 23. useTimesheetEntryGrid.ts - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Replaced @deprecated TimesheetEntryGridRowWithSaving with z.infer<typeof schemas.TimesheetCostLine> + isSaving extension
  - Removed imports from non-existent @/types/timesheet.types
  - Created TimesheetEntryJobSelectionItem and TimesheetEntryStaffMember schemas in local schemas
  - Uses generated TimesheetCostLine and CompanyDefaults schemas for core functionality
  - Type aliases for compatibility: TimesheetEntry, TimesheetEntryGridRow, CompanyDefaults
- **Impact**: Timesheet entry grid composable now uses generated API types with UI-specific extensions

### 24. CompanyDefaultsFormModal.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Replaced @deprecated CompanyDefaultsForm interface with z.infer<typeof schemas.CompanyDefaults>
  - Uses generated CompanyDefaults schema from Zodios API for form data structure
  - Maintains full type safety for company defaults form operations
- **Impact**: Company defaults form now uses generated API types ensuring consistency

### 25. ContactSelectionModal.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Replaced @deprecated Props interface with inline defineProps pattern
  - Replaced @deprecated ContactForm type with direct NewContactData reference
  - Added type aliases using z.infer<typeof schemas.ClientContactResult> and schemas.ClientContactCreateRequest
  - Uses generated ClientContactResult and ClientContactCreateRequest schemas for contact management
- **Impact**: Contact selection modal now uses generated API types for client contacts

### 26. MetricsModal.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Replaced @deprecated Props interface with inline defineProps pattern
  - Added type alias using z.infer<typeof schemas.DailyTimesheetSummary>
  - Uses generated DailyTimesheetSummary schema for daily timesheet metrics display
  - Maintains compatibility with existing service layer imports
- **Impact**: Daily metrics modal now uses generated API types for timesheet summary data

### 27. WeeklyMetricsModal.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Replaced 2 @deprecated interfaces (Props, Emits) with inline defineProps/defineEmits patterns
  - Added type alias using z.infer<typeof WeeklySummaryDataSchema> from local schemas
  - Created WeeklySummaryDataSchema in local schemas for UI-specific weekly metrics structure
  - Maintains weekly totals, summary stats, and job breakdown data structure
- **Impact**: Weekly metrics modal now uses local schema extension for comprehensive weekly timesheet data display

### 28. ContactSelector.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Replaced @deprecated Props interface with inline defineProps pattern
  - Added type alias using z.infer<typeof schemas.ClientContactResult> from generated API
  - Replaced ClientContact import from @/composables/useClientLookup with generated schema type
  - Maintains compatibility with contact management composable and modal integration
- **Impact**: Contact selector component now uses generated API types for client contact structure

### 29. JobsModal.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Replaced @deprecated DjangoJob interface with z.infer<typeof schemas.DjangoJob> from generated API
  - Added import for schemas from @/api/generated/api with type alias pattern
  - Maintains exact same structure (id, next_run_time, job_state) with proper schema validation
  - Compatible with existing Django jobs service integration
- **Impact**: Django jobs modal now uses generated API types for scheduler job management

### 30. QuoteStatus.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Replaced @deprecated Props interface with inline defineProps pattern
  - Uses modern Vue 3 composition API with withDefaults for prop defaults
  - Maintains jobId and autoRefresh props with proper TypeScript typing
  - Compatible with existing quote import composable integration
- **Impact**: Quote status component now uses modern Vue 3 patterns without deprecated interfaces

### 31. StaffAvatar.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Replaced @deprecated Props and Emits interfaces with inline defineProps/defineEmits patterns
  - Created StaffAvatarSchema extending schemas.ModernStaff with UI-specific display properties
  - Added StaffAvatarSizeSchema for component sizing enum
  - Updated field mappings: firstName/lastName (ModernStaff) vs first_name/last_name
  - Updated avatarUrl (ModernStaff) vs avatar_url for consistency
- **Impact**: Staff avatar component now uses generated API base with local schema extensions for UI needs

### 32. ErrorFilter.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Replaced @deprecated DateRange interface with DateRangeSchema from local schemas
  - Created DateRangeSchema for UI-specific date filtering functionality
  - Maintains start/end nullable string structure for date range selection
  - Compatible with CustomDatePicker component integration
- **Impact**: Error filter component now uses centralized schema definitions for date range filtering

### 33. KPICalendar.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Replaced @deprecated Props interface with inline defineProps pattern
  - Uses z.infer<typeof schemas.KPIDayData> and z.infer<typeof schemas.KPIThresholds> from generated API
  - Replaced imports from @/services/kpi.service with generated schema types
  - Maintains calendar data structure and threshold configurations
- **Impact**: KPI calendar component now uses generated API types for day data and thresholds

### 34. KPICalendarDay.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Replaced @deprecated Props interface with inline defineProps pattern
  - Uses z.infer<typeof schemas.KPIDayData> and z.infer<typeof schemas.KPIThresholds> from generated API
  - Replaced imports from @/services/kpi.service with generated schema types
  - Maintains individual day display logic with threshold-based styling
- **Impact**: KPI calendar day component now uses generated API types for day data and threshold styling

### 35. KPILabourDetailsModal.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Replaced @deprecated Props interface with inline defineProps pattern
  - Uses z.infer<typeof schemas.KPIMonthlyTotals> and z.infer<typeof schemas.KPIDayData> from generated API
  - Replaced imports from @/services/kpi.service with generated schema types
  - Maintains labour breakdown modal functionality with monthly totals
- **Impact**: KPI labour details modal now uses generated API types for monthly totals and day data

### 36. KPIMaterialsDetailsModal.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Replaced @deprecated Props interface with inline defineProps pattern
  - Uses z.infer<typeof schemas.KPIDayData> from generated API
  - Replaced imports from @/services/kpi.service with generated schema types
  - Maintains materials and adjustments breakdown functionality
- **Impact**: KPI materials details modal now uses generated API types for day data and materials analysis

### 37. KPIProfitDetailsModal.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Replaced @deprecated Props interface with inline defineProps pattern
  - Uses z.infer<typeof schemas.KPIMonthlyTotals>, z.infer<typeof schemas.KPIThresholds>, and z.infer<typeof schemas.KPIDayData> from generated API
  - Replaced imports from @/services/kpi.service with generated schema types
  - Maintains comprehensive profit flow analysis with monthly data and thresholds
- **Impact**: KPI profit details modal now uses generated API types for complete profit analysis functionality

### 38. MonthSelector.vue - COMPLETE ✅

- **Status**: 100% migrated to Vue 3 inline patterns
- **Changes**:
  - Replaced @deprecated Props interface with inline defineProps pattern
  - Replaced @deprecated Emits interface with inline defineEmits pattern
  - Converted to tuple syntax for event emissions in defineEmits
  - Maintains month/year selection functionality for KPI components
- **Impact**: Month selector component now uses Vue 3 composition API patterns without manual interfaces

### 39. PoSummaryCard.vue - COMPLETE ✅

- **Status**: 100% migrated to inline patterns
- **Changes**:
  - Removed @deprecated annotations from Status type and PurchaseOrder interface
  - Converted defineProps to inline pattern with const assignment
  - Converted defineEmits to tuple syntax for event emissions
  - Maintains all purchase order summary card functionality
- **Impact**: Purchase order summary card now uses clean Vue 3 patterns without @deprecated annotations

### 20. DeliveryReceiptLinesTable.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Replaced @deprecated ExistingAllocation interface with z.infer<typeof schemas.AllocationItem>
  - Replaced @deprecated DataTableRowContext with DeliveryDataTableRowContext from local schemas
  - Replaced @deprecated Props and Emits with inline Vue 3 defineProps/defineEmits pattern
  - Added DeliveryAllocation and DeliveryDataTableRowContext to local schemas for UI-specific types
  - Updated JobForPurchasing to Job schema from generated API
- **Impact**: Delivery receipt table now uses generated API types with local schemas for UI-specific allocation types

### 21. JobEstimateTab.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Replaced @deprecated Props interface with inline Vue 3 defineProps pattern
  - Replaced CostLine import from /types/costing.types with z.infer<typeof schemas.CostLine>
  - Replaced CostSet import from /types/costing.types with z.infer<typeof schemas.CostSet>
  - Replaced CostLineCreatePayload with z.infer<typeof schemas.CostLineCreateUpdate>
  - Uses generated CostLine, CostSet, and CostLineCreateUpdate schemas from Zodios API
- **Impact**: Job estimate tab now uses generated API types for all costing functionality

### 22. JobCostAnalysisTab.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Replaced @deprecated CostLine interface with z.infer<typeof schemas.CostLine>
  - Replaced @deprecated CostSet interface with z.infer<typeof schemas.CostSet>
  - Replaced @deprecated CostSetSummary interface with CostSetSummary from local schemas
  - Added CostSetSummarySchema to local schemas for UI-specific cost analysis aggregation
  - Uses generated CostLine and CostSet schemas from Zodios API
- **Impact**: Job cost analysis tab now uses generated API types with local schema for UI-specific cost summary calculations

### 23. JobWorkflowModal.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Replaced @deprecated StatusChoice interface with StatusChoice from local schemas
  - Replaced @deprecated Props interface with inline Vue 3 defineProps pattern
  - Uses existing StatusChoice schema from local schemas for status dropdown options
  - Maintains JobDetailResponse and JobCreateRequest from generated API
- **Impact**: Job workflow modal now uses centralized schemas for status choices and generated API types

### 24. JobSettingsModal.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Replaced @deprecated Props interface with inline Vue 3 defineProps pattern
  - Fixed type safety issue in status mapping with explicit String() conversion
  - Uses JobDetailResponse and JobCreateRequest from generated API
  - Maintains all existing functionality with proper type safety
- **Impact**: Job settings modal now uses generated API types with improved type safety

### 25. KPIDayDetailsModal.vue - COMPLETE ✅

- **Status**: 100% migrated to Zodios types
- **Changes**:
  - Replaced @deprecated Props interface with inline Vue 3 defineProps pattern
  - Replaced DayKPI import from /services/kpi.service with z.infer<typeof schemas.KPIDayData>
  - Uses generated KPIDayData schema from Zodios API for KPI day details
  - Maintains all existing KPI calculation and display functionality
- **Impact**: KPI day details modal now uses generated API types for KPI data structure

### 26. JobMetricsModal.vue - COMPLETE ✅

- **Status**: 100% migrated to local schemas
- **Changes**:
  - Replaced Props interface with inline Vue 3 defineProps pattern
  - Added JobMetricsSchema to local schemas (UI-specific aggregated metrics data)
  - Replaced JobMetrics import from service with import from local schemas
  - Maintains all existing weekly timesheet metrics display functionality
- **Impact**: Job metrics modal now uses properly typed local schema for timesheet metrics

### 27. ClientLookup.vue - COMPLETE ✅

- **Status**: 100% migrated to inline props
- **Changes**:
  - Replaced @deprecated Props interface with inline Vue 3 defineProps pattern
  - Component already uses Client type from useClientLookup composable (compatible with generated ClientSearchResult)
  - Maintains all existing client lookup and selection functionality
- **Impact**: Client lookup component now uses modern Vue 3 patterns

### 28. JobFormModal.vue - COMPLETE ✅

- **Status**: 100% migrated to generated schemas
- **Changes**:
  - Replaced @deprecated DjangoJob interface with z.infer<typeof schemas.DjangoJob>
  - Replaced @deprecated DjangoJobForm interface with inline type definition
  - Uses generated DjangoJob schema from Zodios API for Django job management
  - Maintains all existing Django job creation and editing functionality
- **Impact**: Django job form modal now uses generated API schemas for type safety

### 29. PaidAbsenceModal.vue - COMPLETE ✅

- **Status**: 100% migrated to local schemas extending generated types
- **Changes**:
  - Replaced @deprecated Staff interface with StaffMemberUI from local schemas (extends schemas.Staff)
  - Replaced @deprecated AbsenceForm interface with AbsenceForm from local schemas
  - Replaced @deprecated AbsenceSummary interface with AbsenceSummary from local schemas
  - Replaced @deprecated Props interface with inline Vue 3 defineProps pattern
  - Replaced @deprecated Emits interface with inline Vue 3 defineEmits pattern
  - Added StaffMemberUISchema, AbsenceFormSchema, AbsenceSummarySchema to local schemas
- **Impact**: Paid absence modal now uses centralized schemas from local schemas file

## Available Zodios Endpoints (127 total)

### Generated API Endpoints

- `accounting_api_reports_calendar_retrieve`
- `accounting_api_reports_job_aging_retrieve`
- `accounts_api_staff_all_list`
- `accounts_api_staff_create`
- `accounts_api_staff_destroy`
- `accounts_api_staff_list`
- `accounts_api_staff_partial_update`
- `accounts_api_staff_retrieve`
- `accounts_api_staff_update`
- `accounts_api_token_create`
- `accounts_api_token_refresh_create`
- `accounts_api_token_verify_create`
- `accounts_logout_create`
- `accounts_me_retrieve`
- `api_company_defaults_partial_update`
- `api_company_defaults_retrieve`
- `api_company_defaults_update`
- `api_workflow_ai_providers_create`
- `api_workflow_ai_providers_destroy`
- `api_workflow_ai_providers_list`
- `api_workflow_ai_providers_partial_update`
- `api_workflow_ai_providers_retrieve`
- `api_workflow_ai_providers_set_default_create`
- `api_workflow_ai_providers_update`
- `clients_all_retrieve`
- `clients_contacts_create`
- `clients_contacts_retrieve`
- `clients_create_create`
- `clients_search_retrieve`
- `deleteJobFilesApi`
- `deleteJobFilesApi_2`
- `deleteJobFilesApi_3`
- `deleteJobFilesApi_4`
- `deleteJobFilesApi_5`
- `deleteJobFilesApi_6`
- `getDailyTimesheetSummaryByDate`
- `getDailyTimesheetSummaryByDate_2`
- `getJobFileThumbnail`
- `getStaffDailyTimesheetDetailByDate`
- `getStaffDailyTimesheetDetailByDate_2`
- `job_api_job_assignment_create`
- `job_api_job_assignment_destroy`
- `job_api_job_completed_archive_create`
- `job_api_job_completed_list`
- `job_api_jobs_advanced_search_retrieve`
- `job_api_jobs_fetch_all_retrieve`
- `job_api_jobs_fetch_by_column_retrieve`
- `job_api_jobs_fetch_retrieve`
- `job_api_jobs_quote_chat_create`
- `job_api_jobs_quote_chat_destroy`
- `job_api_jobs_quote_chat_interaction_create`
- `job_api_jobs_quote_chat_partial_update`
- `job_api_jobs_quote_chat_retrieve`
- `job_api_jobs_reorder_create`
- `job_api_jobs_status_values_retrieve`
- `job_api_jobs_update_status_create`
- `job_job_workshop_pdf_retrieve`
- `job_rest_cost_lines_delete_destroy`
- `job_rest_cost_lines_partial_update`
- `job_rest_jobs_cost_sets_actual_cost_lines_create`
- `job_rest_jobs_cost_sets_cost_lines_create`
- `job_rest_jobs_cost_sets_retrieve`
- `job_rest_jobs_create`
- `job_rest_jobs_destroy`
- `job_rest_jobs_events_create`
- `job_rest_jobs_quote_apply_create`
- `job_rest_jobs_quote_link_create`
- `job_rest_jobs_quote_preview_create`
- `job_rest_jobs_quote_status_retrieve`
- `job_rest_jobs_retrieve`
- `job_rest_jobs_update`
- `job_rest_jobs_workshop_pdf_retrieve`
- `job_rest_month_end_create`
- `job_rest_month_end_retrieve`
- `job_rest_timesheet_entries_create`
- `job_rest_timesheet_entries_retrieve`
- `job_rest_timesheet_jobs_retrieve`
- `job_rest_timesheet_staff_date_retrieve`
- `listPurchaseOrders`
- `purchasing_api_delivery_receipts_process_create`
- `purchasing_api_purchase_orders_email_create`
- `purchasing_api_purchase_orders_pdf_retrieve`
- `purchasing_rest_all_jobs_retrieve`
- `purchasing_rest_delivery_receipts_create`
- `purchasing_rest_jobs_retrieve`
- `purchasing_rest_purchase_orders_allocations_retrieve`
- `purchasing_rest_purchase_orders_create`
- `purchasing_rest_purchase_orders_partial_update`
- `purchasing_rest_stock_consume_create`
- `purchasing_rest_stock_create`
- `purchasing_rest_stock_destroy`
- `purchasing_rest_stock_retrieve`
- `purchasing_rest_xero_items_retrieve`
- `quoting_api_django_job_executions_list`
- `quoting_api_django_job_executions_retrieve`
- `quoting_api_django_jobs_create`
- `quoting_api_django_jobs_destroy`
- `quoting_api_django_jobs_list`
- `quoting_api_django_jobs_partial_update`
- `quoting_api_django_jobs_retrieve`
- `quoting_api_django_jobs_update`
- `retrieveJobFilesApi`
- `retrieveJobFilesApi_2`
- `retrieveJobFilesApi_3`
- `retrieveJobFilesApi_4`
- `retrieveJobFilesApi_5`
- `retrieveJobFilesApi_6`
- `retrievePurchaseOrder`
- `timesheets_api_jobs_retrieve`
- `timesheets_api_staff_retrieve`
- `timesheets_api_weekly_create`
- `timesheets_api_weekly_retrieve`
- `updateJobFilesApi`
- `updateJobFilesApi_2`
- `updateJobFilesApi_3`
- `updateJobFilesApi_4`
- `updateJobFilesApi_5`
- `updateJobFilesApi_6`
- `uploadJobFilesApi`
- `uploadJobFilesApi_2`
- `uploadJobFilesApi_3`
- `uploadJobFilesApi_4`
- `uploadJobFilesApi_5`
- `uploadJobFilesApi_6`
- `uploadJobFilesRest`
- `xero_errors_list`
- `xero_errors_retrieve`

## Migration Readiness Summary

| Migration Type        | Count | Percentage |
| --------------------- | ----- | ---------- |
| **Ready for Zodios**  | 2     | 13.3%      |
| **Manual Migration**  | 13    | 86.7%      |
| **Total Axios Calls** | 15    | 100%       |

## Axios Calls Requiring Migration (15 total)

| File                                     | Line | Method | URL                                             | Zodios Available             | Status       |
| ---------------------------------------- | ---- | ------ | ----------------------------------------------- | ---------------------------- | ------------ |
| `src\components\job\JobFinancialTab.vue` | 223  | POST   | `/api/xero/create_quote/${props.jobData.id}`    | âŒ NO                        | âš ï¸ Manual |
| `src\components\job\JobFinancialTab.vue` | 246  | POST   | `/api/xero/create_invoice/${props.jobData.id}`  | âŒ NO                        | âš ï¸ Manual |
| `src\components\job\JobFinancialTab.vue` | 269  | POST   | `/api/xero/delete_quote/${props.jobData.id}`    | âŒ NO                        | âš ï¸ Manual |
| `src\components\job\JobFinancialTab.vue` | 291  | POST   | `/api/xero/delete_invoice/${props.jobData.id}`  | âŒ NO                        | âš ï¸ Manual |
| `src\composables\useErrorApi.ts`         | 53   | GET    | `/system-errors`                                | âŒ NO                        | âš ï¸ Manual |
| `src\composables\useXeroAuth.ts`         | 103  | GET    | `axios call`                                    | âŒ NO                        | âš ï¸ Manual |
| `src\composables\useXeroAuth.ts`         | 127  | GET    | `axios call`                                    | âŒ NO                        | âš ï¸ Manual |
| `src\composables\useXeroAuth.ts`         | 133  | GET    | `axios call`                                    | âŒ NO                        | âš ï¸ Manual |
| `src\composables\useXeroAuth.ts`         | 164  | POST   | `axios call`                                    | âŒ NO                        | âš ï¸ Manual |
| `src\services\job-rest.service.ts`       | 61   | POST   | `/job/rest/jobs/toggle-complex/`                | âŒ NO                        | âš ï¸ Manual |
| `src\services\job-rest.service.ts`       | 115  | POST   | `/job/rest/jobs/files/upload/`                  | âœ… YES (uploadJobFilesRest) | ðŸ„ Ready    |
| `src\services\job-rest.service.ts`       | 160  | POST   | `/job/rest/jobs/files/upload/`                  | âœ… YES (uploadJobFilesRest) | ðŸ„ Ready    |
| `src\services\kpi.service.ts`            | 44   | GET    | `/kpi-calendar`                                 | âŒ NO                        | âš ï¸ Manual |
| `src\services\quote.service.ts`          | 55   | POST   | `/job/rest/jobs/${jobId}/quote/import/preview/` | âŒ NO                        | âš ï¸ Manual |
| `src\services\quote.service.ts`          | 75   | POST   | `/job/rest/jobs/${jobId}/quote/import/`         | âŒ NO                        | âš ï¸ Manual |

## @deprecated Types by File (152 total)

| File                                                       | Count | Sample Deprecated Items                                                                      | Priority |
| ---------------------------------------------------------- | ----- | -------------------------------------------------------------------------------------------- | -------- |
| `src\components\purchasing\PoLinesTable.vue`               | 6     | `, , `                                                                                       | MEDIUM   |
| `src\components\timesheet\PaidAbsenceModal.vue`            | 5     | `, , `                                                                                       | MEDIUM   |
| `src\components\job\DraggableButton.vue`                   | 4     | `, * This interface will be removed after migration to openapi-zod-client generated types, ` | LOW      |
| `src\components\purchasing\DeliveryReceiptLinesTable.vue`  | 4     | `, , `                                                                                       | LOW      |
| `src\composables\useSimpleDragAndDrop.ts`                  | 3     | `, , `                                                                                       | LOW      |
| `src\components\job\JobCostAnalysisTab.vue`                | 3     | `, , `                                                                                       | LOW      |
| `src\services\clientService.ts`                            | 3     | `, , `                                                                                       | LOW      |
| `src\components\admin\MonthEndSummary.vue`                 | 3     | `, , `                                                                                       | LOW      |
| `src\components\timesheet\WeekPickerModal.vue`             | 3     | `, , `                                                                                       | LOW      |
| `src\composables\useDragAndDrop.ts`                        | 2     | `, `                                                                                         | LOW      |
| `src\composables\useFormValidation.ts`                     | 2     | `, `                                                                                         | LOW      |
| `src\components\purchasing\ExistingAllocationsDisplay.vue` | 2     | `, `                                                                                         | LOW      |
| `src\components\JobCard.vue`                               | 2     | `, `                                                                                         | LOW      |
| `src\components\JobFormModal.vue`                          | 2     | `, `                                                                                         | LOW      |
| `src\components\quote\QuoteSummaryCard.vue`                | 2     | `, `                                                                                         | LOW      |
| `src\components\quote\QuoteCostLinesGrid.vue`              | 2     | `* This interface will be removed after migration to openapi-zod-client generated types, `   | LOW      |
| `src\components\ClientDropdown.vue`                        | 2     | `, `                                                                                         | LOW      |
| `src\components\StaffAvatar.vue`                           | 2     | `, `                                                                                         | LOW      |
| `src\components\ContactSelectionModal.vue`                 | 2     | `, `                                                                                         | LOW      |
| `src\components\KanbanColumn.vue`                          | 2     | `, `                                                                                         | LOW      |

## Migration Action Plan

### Phase 1: API Calls Migration (Priority: CRITICAL)

1. **Immediate**: Replace axios calls that have Zodios endpoints available
2. **Manual**: Handle file uploads and custom endpoints not in OpenAPI spec
3. **Remove**: All manual `response.data` parsing and fallback logic

### Phase 2: Type Migration (Priority: HIGH)

1. **Import**: Use generated schemas from `@/api/generated/api`
2. **Extend**: Create local schemas in `@/api/local/schemas` for UI-specific types
3. **Replace**: All manual interfaces with `z.infer<typeof XxxSchema>`

### Phase 3: Validation (Priority: MEDIUM)

1. **Test**: All migrated endpoints work correctly
2. **Verify**: Type safety is maintained
3. **Clean**: Remove all deprecated code

### Files Requiring Immediate Attention

#### High Priority (Many API calls + deprecated types)

#### API-Only Files (No deprecated types)- `src\composables\useXeroAuth.ts` - 4 API calls

- `src\components\job\JobFinancialTab.vue` - 4 API calls
- `src\services\job-rest.service.ts` - 3 API calls
- `src\services\quote.service.ts` - 2 API calls
- `src\composables\useErrorApi.ts` - 1 API calls

## Next Steps

1. **RUN**: `npm run type-check` to verify current state
2. **MIGRATE**: Start with highest priority files
3. **TEST**: Each file after migration
4. **UPDATE**: This report as progress is made

---

_Generated on: 2025-07-14 19:13:11_
_Zodios endpoints available: 127_
_Total migration items: 167_
