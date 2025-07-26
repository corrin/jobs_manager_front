# Plan: Fix Broken Local Schema Imports - ARCHITECTURALLY CORRECT

## Task Overview

Fix 32 files importing from the deleted `@/api/local/schemas` directory by applying **STRICT ARCHITECTURAL SEPARATION OF CONCERNS**.

## 🚨 CRITICAL ARCHITECTURAL PRINCIPLES 🚨

### NEVER COMMENT OUT OR DISABLE BROKEN IMPORTS

- Build failures from missing backend schemas are **ARCHITECTURALLY CORRECT**
- Broken imports maintain pressure for proper backend fixes
- NO temporary workarounds, placeholders, or suppressions

### STRICT SEPARATION OF CONCERNS

**Frontend owns:** UI constants, data transformation, presentation logic
**Backend owns:** Business data, API schemas, database models

## Systematic Approach

### Step 1: Categorize Each Broken Import

For each file, determine if the import is:

**Category A: Frontend Constants/Utilities** ✅ CAN FIX

🚨 **ULTIMATE TEST: If this data is stored in the database, it is PROHIBITED to model in the frontend** 🚨

- Static UI dropdowns, labels, configuration (NOT stored in database)
- Data transformation functions (NOT stored in database)
- Pure UI form structures (NOT stored in database)
- **Action:** Create proper frontend constants/utilities

**Examples of ALLOWED Category A types:**

- Tab names, dropdown options, filter schemas
- Form validation structures
- UI state enums, display constants

**Examples of PROHIBITED (Category C) types:**

- Job data, staff data, purchase orders, deliveries
- Any type with database IDs, business fields, or API data

**Category B: Existing Generated Schemas** ✅ CAN FIX

- Types that exist in `@/api/generated/api`
- **Action:** Replace with generated schema import

**Category C: Missing Backend Schemas** ❌ LEAVE BROKEN

- Legitimate API data types not in generated schemas
- **Action:** Document requirement, leave import broken

### Step 2: Fix Patterns

**Frontend Constants:**

```typescript
// BEFORE (broken)
import { StatusChoice } from '@/api/local/schemas'

// AFTER (fixed)
import { JOB_STATUS_CHOICES, type StatusChoice } from '@/constants/job-status'
```

**Generated Schemas:**

```typescript
// BEFORE (broken)
import { SomeType } from '@/api/local/schemas'

// AFTER (fixed)
import { schemas } from '@/api/generated/api'
type SomeType = z.infer<typeof schemas.SomeType>
```

**Missing Backend Schemas:**

```typescript
// BEFORE (broken)
import { JobEvent } from '@/api/local/schemas'

// AFTER (leave broken - maintains architectural pressure)
import { JobEvent } from '@/api/local/schemas' // ❌ BROKEN - Backend team must add JobEvent schema
```

### Step 3: File Categorization (32 total)

#### ✅ CATEGORY A: Frontend Constants/Utilities (CAN FIX) - ONLY PURE UI CONSTRUCTS

- [x] `src/components/job/JobViewTabs.vue` - `JobTabKey` (literal tab names like "details", "attachments")
- [x] `src/views/purchasing/DeliveryReceiptFormView.vue` - `transformDeliveryReceiptForAPI` (data transformation function only)
- [x] `src/components/AdvancedSearchDialog.vue` - `AdvancedFiltersSchema` (search form structure only)
- [x] `src/components/admin/errors/ErrorFilter.vue` - `DateRangeSchema` (date picker form structure only)
- [x] `src/components/job/JobPricingGrids.vue` - `PricingSectionSchema` (pricing form structure only)

#### 🔄 MOVED TO CATEGORY C (CONSERVATIVE APPROACH)

- [ ] `src/components/job/JobWorkflowModal.vue` - `StatusChoice` (status values likely stored in database)
- [ ] `src/components/timesheet/PaidAbsenceModal.vue` - `AbsenceForm, AbsenceSummary` (absence data likely stored in database)
- [ ] `src/components/timesheet/StaffWeekRow.vue` - `WeeklyStaffData, WeeklyDayData` (timesheet data stored in database)

#### ✅ CATEGORY B: Existing Generated Schemas (CAN FIX)

- [x] `src/components/KanbanColumn.vue` - `StatusChoiceSchema` → `schemas.Status7b9Enum`
- [x] `src/components/StaffAvatar.vue` - `StaffAvatarSchema` → `schemas.Staff`
- [x] `src/utils/metalType.ts` - `MetalTypeOption` → `schemas.MetalTypeEnum`
- [ ] `src/stores/xeroItemStore.ts` - `XeroItemUI` → `schemas.XeroItem`
- [ ] `src/components/purchasing/PoLinesTable.vue` - `XeroItemUI` → `schemas.XeroItem`

#### ❌ CATEGORY C: Missing Backend Schemas (LEAVE BROKEN)

- [ ] `src/components/job/JobCostAnalysisTab.vue` - `CostSetSummary` (API computation result)
- [ ] `src/components/job/JobHistoryModal.vue` - `JobEvent` (API job history data)
- [ ] `src/views/TimesheetEntryView.vue` - `TimesheetEntryWithMeta` (API response with metadata)
- [ ] `src/views/purchasing/PurchaseOrderFormView.vue` - `XeroSyncResponse` (API integration response)
- [ ] `src/services/quote.service.ts` - `QuoteImportPreviewResponse, QuoteImportResponse` (API responses)
- [ ] `src/components/QuoteImportDialog.vue` - `QuoteImportResponse` (API import result)
- [ ] All other legitimate API data types missing from generated schemas

#### 🔍 NEEDS INVESTIGATION: Unclear Category

Files requiring analysis to determine if frontend utility or backend schema:

- [ ] `src/components/timesheet/JobMetricsModal.vue` - `JobMetrics`
- [ ] `src/components/timesheet/PaidAbsenceModal.vue` - `StaffMemberUI, AbsenceForm, AbsenceSummary`
- [ ] `src/components/timesheet/StaffWeekRow.vue` - `WeeklyStaffData, WeeklyDayData`
- [ ] `src/composables/useTimesheetEntryGrid.ts` - `TimesheetEntryJobSelectionItem, TimesheetEntryStaffMember`
- [ ] `src/components/purchasing/DeliveryReceiptLinesTable.vue` - `DeliveryAllocation, DeliveryDataTableRowContext`
- [ ] `src/components/purchasing/PurchaseOrderJobCellEditor.ts` - `POJobSelectionItem`
- [ ] `src/services/quote-chat.service.ts` - `VueChatMessage`
- [ ] `src/composables/useContactManagement.ts` - `NewContactData`
- [ ] `src/composables/usePurchaseOrderGrid.ts` - `PurchaseOrderLineUI`
- [ ] `src/composables/useQuoteImport.ts` - Multiple quote-related types
- [ ] `src/components/admin/errors/ErrorDialog.vue` - `ErrorRecord`

### Step 4: Implementation Strategy

1. **Fix Category A & B files immediately** - Create frontend constants/utilities or use generated schemas
2. **Document Category C requirements** - Update backend-schema-requirements.md
3. **Investigate unclear files** - Determine proper category through code analysis
4. **Let build fail appropriately** - Maintain architectural pressure for backend fixes

### Step 5: Success Criteria

- ✅ All fixable imports resolved with proper frontend constants/utilities or generated schemas
- ✅ All legitimate backend schema requirements documented
- ❌ Build may still fail due to missing backend schemas (THIS IS CORRECT)
- ✅ No temporary workarounds or disabled imports

## ARCHITECTURAL CORRECTNESS OVER BUILD SUCCESS

**A failing build due to missing backend schemas is better than architectural violations.**
