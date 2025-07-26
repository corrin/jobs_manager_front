# Broken Imports Fix Log

This log tracks the systematic fixing of 28 broken imports from the deleted `@/api/local/schemas` directory.

## Progress Summary

- **Total files to fix:** 28
- **Files completed:** 5
- **Files remaining:** 23
- **Frontend constants created:** 1
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

---

_Log initialized - ready to track systematic import fixes_
