# DEPRECATED CODE MIGRATION REPORT

## Executive Summary

**CRITICAL**: Complete migration from Axios + manual interfaces to Zodios + Zod schemas required.

| Category          | Total Found | Migrated | Remaining | Progress |
| ----------------- | ----------- | -------- | --------- | -------- |
| Axios API calls   | 18          | 0        | 18        | 0%       |
| Fetch API calls   | 0           | 0        | 0         | 0%       |
| @deprecated types | 166         | 24       | 142       | 14.5%    |
| **TOTAL ITEMS**   | **184**     | **24**   | **160**   | **13%**  |

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
| **Ready for Zodios**  | 6     | 33.3%      |
| **Manual Migration**  | 12    | 66.7%      |
| **Total Axios Calls** | 18    | 100%       |

## Axios Calls Requiring Migration (18 total)

| File                                     | Line | Method | URL                                             | Zodios Available              | Status       |
| ---------------------------------------- | ---- | ------ | ----------------------------------------------- | ----------------------------- | ------------ |
| `src\components\job\JobFinancialTab.vue` | 223  | POST   | `/api/xero/create_quote/${props.jobData.id}`    | âŒ NO                         | âš ï¸ Manual |
| `src\components\job\JobFinancialTab.vue` | 246  | POST   | `/api/xero/create_invoice/${props.jobData.id}`  | âŒ NO                         | âš ï¸ Manual |
| `src\components\job\JobFinancialTab.vue` | 269  | POST   | `/api/xero/delete_quote/${props.jobData.id}`    | âŒ NO                         | âš ï¸ Manual |
| `src\components\job\JobFinancialTab.vue` | 291  | POST   | `/api/xero/delete_invoice/${props.jobData.id}`  | âŒ NO                         | âš ï¸ Manual |
| `src\composables\useErrorApi.ts`         | 53   | GET    | `/system-errors`                                | âœ… YES (xero_errors_list)    | ðŸ„ Ready    |
| `src\composables\useXeroAuth.ts`         | 103  | GET    | `axios call`                                    | âŒ NO                         | âš ï¸ Manual |
| `src\composables\useXeroAuth.ts`         | 127  | GET    | `axios call`                                    | âŒ NO                         | âš ï¸ Manual |
| `src\composables\useXeroAuth.ts`         | 133  | GET    | `axios call`                                    | âŒ NO                         | âš ï¸ Manual |
| `src\composables\useXeroAuth.ts`         | 164  | POST   | `axios call`                                    | âŒ NO                         | âš ï¸ Manual |
| `src\services\job-rest.service.ts`       | 61   | POST   | `/job/rest/jobs/toggle-complex/`                | âŒ NO                         | âš ï¸ Manual |
| `src\services\job-rest.service.ts`       | 114  | POST   | `/job/rest/jobs/files/upload/`                  | âœ… YES (uploadJobFilesRest)  | ðŸ„ Ready    |
| `src\services\job-rest.service.ts`       | 124  | GET    | `/job/rest/jobs/files/${jobNumber}/`            | âœ… YES (retrieveJobFilesApi) | ðŸ„ Ready    |
| `src\services\job-rest.service.ts`       | 130  | DELETE | `/job/rest/jobs/files/${fileId}/`               | âœ… YES (retrieveJobFilesApi) | ðŸ„ Ready    |
| `src\services\job-rest.service.ts`       | 145  | POST   | `/job/rest/jobs/files/upload/`                  | âœ… YES (uploadJobFilesRest)  | ðŸ„ Ready    |
| `src\services\job-rest.service.ts`       | 164  | PUT    | `/job/rest/jobs/files/`                         | âœ… YES (retrieveJobFilesApi) | ðŸ„ Ready    |
| `src\services\kpi.service.ts`            | 44   | GET    | `/kpi-calendar`                                 | âŒ NO                         | âš ï¸ Manual |
| `src\services\quote.service.ts`          | 62   | POST   | `/job/rest/jobs/${jobId}/quote/import/preview/` | âŒ NO                         | âš ï¸ Manual |
| `src\services\quote.service.ts`          | 82   | POST   | `/job/rest/jobs/${jobId}/quote/import/`         | âŒ NO                         | âš ï¸ Manual |

## @deprecated Types by File (166 total)

| File                                                      | Count | Sample Deprecated Items                                                                      | Priority |
| --------------------------------------------------------- | ----- | -------------------------------------------------------------------------------------------- | -------- |
| `src\components\purchasing\PoLinesTable.vue`              | 6     | `, , `                                                                                       | MEDIUM   |
| `src\components\timesheet\PaidAbsenceModal.vue`           | 5     | `, , `                                                                                       | MEDIUM   |
| `src\components\purchasing\ReceivedItemsTable.vue`        | 5     | `, , `                                                                                       | MEDIUM   |
| `src\services\daily-timesheet.service.ts`                 | 5     | `, , `                                                                                       | MEDIUM   |
| `src\components\purchasing\PendingItemsTable.vue`         | 4     | `, , `                                                                                       | LOW      |
| `src\components\job\DraggableButton.vue`                  | 4     | `, * This interface will be removed after migration to openapi-zod-client generated types, ` | LOW      |
| `src\components\purchasing\DeliveryReceiptLinesTable.vue` | 4     | `, , `                                                                                       | LOW      |
| `src\components\timesheet\WeekPickerModal.vue`            | 3     | `, , `                                                                                       | LOW      |
| `src\services\clientService.ts`                           | 3     | `, , `                                                                                       | LOW      |
| `src\composables\useSimpleDragAndDrop.ts`                 | 3     | `, , `                                                                                       | LOW      |
| `src\components\job\JobCostAnalysisTab.vue`               | 3     | `, , `                                                                                       | LOW      |
| `src\components\admin\MonthEndSummary.vue`                | 3     | `, , `                                                                                       | LOW      |
| `src\components\StaffAvatar.vue`                          | 2     | `, `                                                                                         | LOW      |
| `src\components\quote\QuoteCostLinesGrid.vue`             | 2     | `* This interface will be removed after migration to openapi-zod-client generated types, `   | LOW      |
| `src\components\quote\QuoteSummaryCard.vue`               | 2     | `, `                                                                                         | LOW      |
| `src\components\ContactSelectionModal.vue`                | 2     | `, `                                                                                         | LOW      |
| `src\components\QuoteImportDialog.vue`                    | 2     | `, `                                                                                         | LOW      |
| `src\components\JobCard.vue`                              | 2     | `, `                                                                                         | LOW      |
| `src\components\JobFormModal.vue`                         | 2     | `, `                                                                                         | LOW      |
| `src\components\KanbanColumn.vue`                         | 2     | `, `                                                                                         | LOW      |

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

#### API-Only Files (No deprecated types)- `src\services\job-rest.service.ts` - 6 API calls

- `src\composables\useXeroAuth.ts` - 4 API calls
- `src\components\job\JobFinancialTab.vue` - 4 API calls
- `src\services\quote.service.ts` - 2 API calls
- `src\composables\useErrorApi.ts` - 1 API calls

## Next Steps

1. **RUN**: `npm run type-check` to verify current state
2. **MIGRATE**: Start with highest priority files
3. **TEST**: Each file after migration
4. **UPDATE**: This report as progress is made

---

_Generated on: 2025-07-14 15:37:46_
_Zodios endpoints available: 127_
_Total migration items: 184_
