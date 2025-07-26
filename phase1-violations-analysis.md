# Phase 1: Violations Analysis - All Incorrectly Fixed Files

## ARCHITECTURAL VIOLATIONS IDENTIFIED

### 🚨 MAJOR VIOLATIONS: Created Frontend Types for Database Data

#### 1. `src/utils/delivery-receipt.ts` - COMPLETELY WRONG

- **Created:** `DeliveryAllocationUI` interface
- **Problem:** Delivery allocations ARE database data (stored in delivery_receipt tables)
- **Fields:** `job_id`, `quantity`, `unit_cost`, `retail_rate` = DATABASE FIELDS
- **Violation:** Created frontend type for database entity
- **Correct action:** Use generated schema or leave broken

#### 2. `src/utils/timesheet-types.ts` - COMPLETELY WRONG

- **Created:** Multiple timesheet-related types
- **Problem:** ALL timesheet data is database data (stored in timesheet/costline tables)
- **Types created:**
  - `StaffMemberUI` - Staff data IS database data
  - `AbsenceForm` - Absence data IS database data
  - `AbsenceSummary` - Absence summaries ARE database data
  - `WeeklyStaffData` - Timesheet data IS database data
  - `WeeklyDayData` - Timesheet data IS database data
  - `TimesheetEntryJobSelectionItem` - Job data IS database data
  - `TimesheetEntryStaffMember` - Staff data IS database data
- **Violation:** Created frontend types for database entities
- **Correct action:** Use generated schemas or leave broken

#### 3. `src/components/purchasing/DeliveryReceiptLinesTable.vue` - WRONG

- **Used:** `DeliveryAllocationUI` from prohibited utils
- **Problem:** Used database data type from frontend utils
- **Violation:** Consumed prohibited frontend type
- **Correct action:** Use generated schema or leave broken

#### 4. Files that used prohibited timesheet utilities - WRONG

- `src/components/timesheet/PaidAbsenceModal.vue`
- `src/components/timesheet/StaffWeekRow.vue`
- `src/composables/useTimesheetEntryGrid.ts`
- **Problem:** All consumed database data from frontend utils
- **Violation:** Used prohibited frontend types
- **Correct action:** Use generated schemas or leave broken

### ⚠️ QUESTIONABLE: May Be Violations

#### 5. `src/constants/pricing-section.ts` - SUSPICIOUS

- **Created:** `PricingSectionSchema`
- **Question:** Is pricing data stored in database? (Likely YES)
- **If database data:** VIOLATION - should be generated schema
- **Action needed:** Verify if pricing is database data

### ✅ LIKELY CORRECT: Pure UI Types

#### 6. Frontend constants that appear legitimate:

- `src/constants/job-status.ts` - Static status choices (UI constants)
- `src/constants/advanced-filters.ts` - Search form structure (UI only)
- `src/constants/date-range.ts` - Date picker structure (UI only)
- `src/utils/data-table-types.ts` - Table UI state (UI only)

#### 7. Generated schema uses - CORRECT:

- `src/components/admin/errors/ErrorDialog.vue` - Used `schemas.AppError`
- `src/composables/useContactManagement.ts` - Used `schemas.ClientContactCreateRequest`
- `src/composables/usePurchaseOrderGrid.ts` - Used `schemas.PurchaseOrderLine`
- `src/stores/xeroItemStore.ts` - Used `schemas.XeroItem`

## DAMAGE ASSESSMENT

### Files with PROHIBITED frontend types (must fix):

1. `src/utils/delivery-receipt.ts` - DELETE or fix to use generated schemas only
2. `src/utils/timesheet-types.ts` - DELETE or fix to use generated schemas only
3. All files consuming these prohibited types

### Files that may be violations (investigate):

1. `src/constants/pricing-section.ts` - Check if pricing is database data

### Files with correct fixes (keep):

1. Pure UI constants files
2. Files using generated schemas properly

## NEXT STEPS FOR PHASE 2

1. **Check generated schemas** for delivery and timesheet types
2. **Replace prohibited utils** with generated schemas where they exist
3. **Delete prohibited utils** and leave imports broken where no backend schema exists
4. **Investigate suspicious constants** to confirm they're pure UI
