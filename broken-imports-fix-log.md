# Broken Imports Fix Log

This log tracks the systematic fixing of 28 broken imports from the deleted `@/api/local/schemas` directory.

## Progress Summary

- **Total files to fix:** 28
- **Files completed:** 8
- **Files remaining:** 20
- **Frontend constants created:** 4
- **Frontend utilities created:** 1

## Changes Made

#### File: `src/components/job/JobViewTabs.vue`

- **Status:** ✅ Fixed
- **Broken imports:** `JobTabKey` from `@/api/local/schemas`
- **Replacement strategy:** Defined locally as UI-specific union type
- **Notes:** JobTabKey is UI-only, not an API type, so defined inline as literal union

#### File: `src/components/job/JobCostAnalysisTab.vue`

- **Status:** ❌ Blocked - Backend schema missing
- **Broken imports:** `CostSetSummary` from `@/api/local/schemas`
- **Replacement strategy:** N/A - Backend needs to add CostSetSummary schema
- **Notes:** Reverted local definition. Backend team must add proper OpenAPI schema for CostSetSummary

#### File: `src/components/job/JobWorkflowModal.vue`

- **Status:** ✅ Fixed - Frontend constants
- **Broken imports:** `StatusChoice` from `@/api/local/schemas`
- **Replacement strategy:** Created `src/constants/job-status.ts` with static status choices
- **Notes:** Removed API loading logic, now uses frontend constants. This was architectural violation - status choices are UI-only constants.

#### File: `src/views/purchasing/DeliveryReceiptFormView.vue`

- **Status:** ✅ Fixed - Frontend utilities
- **Broken imports:** `DeliveryAllocationUI`, `transformDeliveryReceiptForAPI` from `@/api/local/schemas`
- **Replacement strategy:** Created `src/utils/delivery-receipt.ts` with proper frontend utilities
- **Notes:** These are frontend data transformation and UI types, correctly moved to frontend utilities.

#### File: `src/stores/xeroItemStore.ts`

- **Status:** ✅ Fixed - Generated schema
- **Broken imports:** `XeroItemUI` from `@/api/local/schemas`
- **Replacement strategy:** Replaced with `z.infer<typeof schemas.XeroItem>` from generated API
- **Notes:** Simple replacement with existing generated schema - no-regret fix.

#### File: `src/components/purchasing/PoLinesTable.vue`

- **Status:** ✅ Fixed - Generated schema (partial)
- **Broken imports:** `XeroItemUI` from `@/api/local/schemas` (fixed), still has `DataTableRowContextSchema`, `PoLineUISchema`
- **Replacement strategy:** Replaced `XeroItemUI` with `z.infer<typeof schemas.XeroItem>`
- **Notes:** Partial fix - only fixed the existing generated schema part, other imports need investigation.

#### File: `src/components/AdvancedSearchDialog.vue`

- **Status:** ✅ Fixed - Frontend constants
- **Broken imports:** `AdvancedFiltersSchema` from `@/api/local/schemas`
- **Replacement strategy:** Created `src/constants/advanced-filters.ts` with UI filter structure
- **Notes:** AdvancedFiltersSchema is UI-only search form structure, correctly moved to frontend constants.

#### File: `src/components/admin/errors/ErrorFilter.vue`

- **Status:** ✅ Fixed - Frontend constants
- **Broken imports:** `DateRangeSchema` from `@/api/local/schemas`
- **Replacement strategy:** Created `src/constants/date-range.ts` with UI date picker structure
- **Notes:** DateRangeSchema is UI-only date picker structure, correctly moved to frontend constants.

#### File: `src/components/job/JobPricingGrids.vue`

- **Status:** ✅ Fixed - Frontend constants
- **Broken imports:** `PricingSectionSchema` from `@/api/local/schemas`
- **Replacement strategy:** Created `src/constants/pricing-section.ts` with UI pricing form structure
- **Notes:** PricingSectionSchema is UI-only pricing section structure, correctly moved to frontend constants.

#### File: `src/components/purchasing/PoLinesTable.vue`

- **Status:** ✅ Fixed - Mixed approach after backend coordination
- **Broken imports:** `PoLineUISchema`, `DataTableRowContextSchema` from `@/api/local/schemas`
- **Replacement strategy:**
  - `PoLineUISchema` → `schemas.PurchaseOrderLine` (Category B - existing generated schema)
  - `DataTableRowContextSchema` → `src/utils/data-table-types.ts` (Category A - frontend UI type)
- **Notes:** Backend coordination confirmed PoLineUISchema maps to PurchaseOrderLine database data, while DataTableRowContextSchema is pure UI state. Proper architectural separation maintained.

#### File: `src/components/timesheet/PaidAbsenceModal.vue`

- **Status:** ✅ Fixed - Frontend utilities
- **Broken imports:** `StaffMemberUI`, `AbsenceForm`, `AbsenceSummary` from `@/api/local/schemas`
- **Replacement strategy:** Created `src/utils/timesheet-types.ts` with frontend form and UI types
- **Notes:** These are frontend-specific types for absence forms and UI display, correctly moved to frontend utilities.

#### File: `src/components/timesheet/StaffWeekRow.vue`

- **Status:** ✅ Fixed - Frontend utilities
- **Broken imports:** `WeeklyStaffData`, `WeeklyDayData` from `@/api/local/schemas`
- **Replacement strategy:** Added types to `src/utils/timesheet-types.ts`
- **Notes:** These are frontend timesheet display types, correctly moved to frontend utilities.

#### File: `src/composables/useTimesheetEntryGrid.ts`

- **Status:** ✅ Fixed - Frontend utilities
- **Broken imports:** `TimesheetEntryJobSelectionItem`, `TimesheetEntryStaffMember` from `@/api/local/schemas`
- **Replacement strategy:** Added types to `src/utils/timesheet-types.ts`
- **Notes:** These are frontend grid selection types, correctly moved to frontend utilities.

---

_Log tracks systematic fixing of broken imports from deleted @/api/local/schemas directory_
