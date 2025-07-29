# Plan: Fix Broken Local Schema Imports - ARCHITECTURALLY CORRECT

## Task Overview

Fix 23 files importing from the deleted `@/api/local/schemas` directory by applying **STRICT ARCHITECTURAL SEPARATION OF CONCERNS**.

## 🚨 CRITICAL ARCHITECTURAL PRINCIPLES 🚨

Always commit and push after every task.

### NEVER COMMENT OUT OR DISABLE BROKEN IMPORTS

- Build failures from missing backend schemas are **ARCHITECTURALLY CORRECT**.
- Broken imports maintain pressure for proper backend fixes.
- NO temporary workarounds, placeholders, or suppressions.

### STRICT SEPARATION OF CONCERNS

**Frontend owns:** UI constants, data transformation, presentation logic.  
**Backend owns:** Business data, API schemas, database models.

---

## Systematic Approach

### Step 1: Categorize Each Broken Import

For each file, determine if the import is:

- **Category A: Frontend Constants/Utilities** ✅ CAN FIX
- **Category B: Existing Generated Schemas** ✅ CAN FIX
- **Category C: Missing Backend Schemas** ❌ LEAVE BROKEN

### Step 2: Fix Patterns

- **Frontend Constants** → create local constants/utilities
- **Generated Schemas** → replace with `z.infer<typeof schemas.X>`
- **Missing Backend Schemas** → leave broken and document in `backend-schema-requirements.md`

---

## Step 3: File Categorization (23 total)

#### ✅ CATEGORY A: Frontend Constants/Utilities (CAN FIX)

- [x] `src/components/job/JobViewTabs.vue` — `JobTabKey`
- [x] `src/views/purchasing/DeliveryReceiptFormView.vue` — `transformDeliveryReceiptForAPI`
- [x] `src/components/AdvancedSearchDialog.vue` — `AdvancedFiltersSchema`
- [x] `src/components/admin/errors/ErrorFilter.vue` — `DateRangeSchema`
- [x] `src/components/job/JobPricingGrids.vue` — `PricingSectionSchema`
- [x] `src/components/job/JobWorkflowModal.vue` — `StatusChoice`  
       _(moved from C → A)_
- [x] `src/components/purchasing/DeliveryReceiptLinesTable.vue` —  
       `DeliveryAllocation`, `DeliveryDataTableRowContext`
- [x] `src/composables/useTimesheetEntryGrid.ts` —  
       `TimesheetEntryJobSelectionItem`, `TimesheetEntryStaffMember`  
       _(both moved from C → A)_
- [x] `src/composables/useAppLayout` — `NavigationItem` → `import type { NavigationItem } from '@/constants/navigation-item'`, `UserInfo` → `schemas.Staff`
- [x] `src/composables/useJobCache.ts` — `JobCacheEntry`→ `import type { JobCacheEntry } from '@/constants/job-cache'`
- [x] `src/composables/useTimesheetEntryCalculations.ts` —  
       `TimesheetEntryWithMeta`, `TimesheetEntryJobSelectionItem` →  
       `import type { TimesheetEntryWithMeta } from '@/constants/timesheet-calculations'`  
       and  
       `type TimesheetEntryJobSelectionItem = Pick<z.infer<typeof schemas.Job>, 'id' | 'job_number' | 'name' | 'client_name' | 'status' | 'charge_out_rate'>`
- [x] `src/services/clientService.ts` — `CreateClientResponse` → `import type { CreateClientResponse } from '@/constants/client-wrapper'`
- [x] `src/services/job.service.ts` — `AdvancedFilters` → imported from constant.
- [x] `src/services/kanban-categorization-service.ts` - `KanbanColumn` (UI-specific KanbanColumnSchema defined inline)
- [x] `src/services/quote-chat.service.ts` — `VueChatMessage` (UI-specific chat-component format)
- [x] `src/views/KanbanView.vue` — `AdvancedFilters` → imported from constant.
- [x] `src/views/TimesheetEntryView` — `TimesheetEntryWithMeta` → imported from constant.

#### ✅ CATEGORY B: Existing Generated Schemas (CAN FIX)

- [x] `src/stores/xeroItemStore.ts` — `XeroItemUI` → `schemas.XeroItem`
- [x] `src/components/purchasing/PoLinesTable.vue` —  
       `XeroItemUI`, `PoLineUISchema` → generated schemas
- [x] `src/services/quote.service.ts` — quote-import response types → generated schemas
- [x] `src/composables/useContactManagement.ts` — `NewContactData` → `schemas.ClientContactCreateRequest`
- [x] `src/composables/usePurchaseOrderGrid.ts` — `PurchaseOrderLineUI` → `schemas.PurchaseOrderLine`
- [x] `src/components/admin/errors/ErrorDialog.vue` — `ErrorRecord` → `schemas.AppError`
- [x] `src/components/purchasing/PurchaseOrderJobCellEditor.ts` — `POJobSelectionItem` → `Pick<schemas.Job, 'id' | 'job_number' | 'name' | 'status' | 'client_name' | 'charge_out_rate'>`
- [x] `src/components/quote/QuoteSummaryCard.vue` — `QuoteData` → `schemas.CostSet` (kept the QuoteData type name to help with legibility)
- [x] `src/services/job.service.ts` — `JobStatusUpdate`, `JobReorderPayload` → `schemas.JobStatusUpdateRequest`, `schemas.JobReorderRequest`
- [ ] `src/components/KanbanColumn.vue` — `StatusChoiceSchema` → `schemas.Status7b9Enum`
- [ ] `src/components/StaffAvatar.vue` — `StaffAvatarSchema` → `schemas.Staff`
- [ ] `src/utils/metalType.ts` — `MetalTypeOption` → `schemas.MetalTypeEnum`

#### ❌ CATEGORY C: Missing Backend Schemas (LEAVE BROKEN)

- [x]] `src/components/timesheet/JobMetricsModal.vue` — `JobMetrics`
- [x]] `src/components/job/JobHistoryModal.vue` — `JobEvent`
- [x] `src/views/TimesheetEntryView.vue` — `TimesheetEntryWithMeta`
- [x] `src/views/purchasing/PurchaseOrderFormView.vue` — `XeroSyncResponse`
- [x] `src/components/QuoteImportDialog.vue` — `QuoteImportResponse`
- [ ] `src/components/job/JobCostAnalysisTab.vue` — `CostSetSummary`
- [x] `src/services/quote-chat.service.ts` — `VueChatMessage`
- [x] `src/composables/useQuoteImport.ts` — quote-related types
- [x] `src/components/job/JobFinancialTab` — `JobWithFinancialData`, `XeroSyncResponseSchema`
- [x] `src/components/timesheet/WeeklyMetricsModal.vue` – `TypedWeeklyTimesheetData`, `IMSWeeklyData`
- [x] `src/composables/useXeroAuth.ts` — `XeroSseEvent`

---

## Step 4: Implementation Strategy

1. **Fix Category A & B files immediately**
2. **Document Category C requirements**
3. **Investigate unclear files**
4. **Let build fail appropriately**

---

## Step 5: Success Criteria

- ✅ All fixable imports resolved with proper frontend constants/utilities or generated schemas
- ✅ All legitimate backend schema requirements documented
- ❌ Build may still fail due to missing backend schemas (THIS IS CORRECT)
- ✅ No temporary workarounds or disabled imports

---

## ARCHITECTURAL CORRECTNESS OVER BUILD SUCCESS

**A failing build due to missing backend schemas is better than architectural violations.**

--

## RAW LIST:

#### ✅ CATEGORY A: Frontend Constants/Utilities (CAN FIX)

- `src/components/job/JobViewTabs.vue`
- `src/views/purchasing/DeliveryReceiptFormView.vue`
- `src/components/AdvancedSearchDialog.vue`
- `src/components/admin/errors/ErrorFilter.vue`
- `src/components/job/JobPricingGrids.vue`
- `src/components/job/JobWorkflowModal.vue`
- `src/components/purchasing/DeliveryReceiptLinesTable.vue`
- `src/composables/useTimesheetEntryGrid.ts`

#### ✅ CATEGORY B: Existing Generated Schemas (CAN FIX)

- `src/stores/xeroItemStore.ts`
- `src/components/purchasing/PoLinesTable.vue`
- `src/services/quote.service.ts`
- `src/composables/useContactManagement.ts`
- `src/composables/usePurchaseOrderGrid.ts`
- `src/components/admin/errors/ErrorDialog.vue`
- `src/components/kanban/KanbanColumn.vue`
- `src/components/StaffAvatar.vue`
- `src/utils/metalType.ts`

#### ❌ CATEGORY C: Missing Backend Schemas (LEAVE BROKEN)

- `src/components/quote/QuoteImportDialog.vue`
- `src/components/quote/QuoteSummaryCard.vue`
- `src/components/job/JobFinancialTab.vue`
- `src/components/job/JobHistoryModal.vue`
- `src/components/purchasing/PurchaseOrderJobCellEditor.ts`
- `src/components/timesheet/JobMetricsModal.vue`
- `src/components/timesheet/PaidAbsenceModal.vue`
- `src/composables/useAppLayout.ts`
- `src/composables/useJobCache.ts`
- `src/composables/useJobCard.ts`
- `src/composables/useJobTabs.ts`
- `src/composables/useQuoteImport.ts`
- `src/composables/useSimpleDragAndDrop.ts`
- `src/composables/useTimesheetEntryCalculations.ts`
- `src/composables/useXeroAuth.ts`
- `src/services/clientService.ts`
- `src/services/job.service.ts`
- `src/services/kanban-categorization-service.ts`
- `src/services/quote-chat-service.ts`
- `src/views/kanban/KanbanView.vue`
- `src/views/timesheet/TimesheetEntryView.vue`
- `src/views/purchasing/PurchaseOrderFormView.vue`
