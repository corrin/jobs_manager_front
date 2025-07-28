# Backend Schema Requirements - AUDITED FOR ARCHITECTURAL VIOLATIONS

This file documents LEGITIMATE missing backend schemas. **UI constants and static frontend data have been REMOVED.**

## ✅ LEGITIMATE Backend Schema Types

### JobEvent

**Required by:** `src/components/job/JobHistoryModal.vue`
**Justification:** Real API data representing job history events
**Properties needed:**

```typescript
interface JobEvent {
  id: string | number
  description: string
  timestamp: string
  staff: string
  event_type: string
}
```

**Backend action needed:** Add OpenAPI schema generation for job events/history API

### TimesheetEntryWithMeta

**Required by:** `src/views/TimesheetEntryView.vue`
**Justification:** API response data with metadata
**Backend action needed:** Add OpenAPI schema for timesheet entries with metadata

### XeroSyncResponse

**Required by:** `src/views/purchasing/PurchaseOrderFormView.vue`
**Justification:** API response from Xero integration
**Backend action needed:** Add OpenAPI schema for Xero sync responses

### QuoteImportResponse, QuoteImportPreviewResponse

**Required by:** Multiple quote-related files
**Justification:** API responses from quote import operations
**Backend action needed:** Add OpenAPI schemas for quote import API responses

### JobMetrics

**Required by:** `src/components/timesheet/JobMetricsModal.vue`
**Justification:** Aggregates weekly statistics for hours and revenue and includes an HTML graphic.
**Properties needed:**

```typescript
interface JobMetrics {
  total_estimated_hours: number
  total_actual_hours: number
  total_revenue: number
  job_count: number
  graphic: string
}
```

**Backend action needed:** Create JobMetricsSerializer and expose it in the OpenAPI schema.

### PreviewQuoteResponse – missing keys

**Required by:** `useQuoteImport.ts`, `QuoteImportDialog.vue`  
**Missing fields:** `can_proceed`, `validation_report`, `diff_preview`.

```python
class PreviewQuoteResponseSerializer(serializers.Serializer):
    """
    Serializer for preview quote response.
    """
    success = serializers.BooleanField()
    draft_lines = DraftLineSerializer(many=True)
    can_proceed = serializers.BooleanField()
    validation_report = ValidationReportSerializer(required=False, allow_null=True)
    diff_preview = DiffPreviewSerializer(required=False, allow_null=True)

    class Meta:
        extra_kwargs = {"allow_extra_fields": True}
```

- The full structure might be something like this in the end:

```json
{
   validation_report?: any | null,
   can_proceed: boolean,
   draft_lines: DraftLine[],
   diff_preview?: {
      additions_count: number,
      updates_count: number,
      deletions_count: number,
      total_changes: number,
      next_revision: number,
      current_revision: number | null,
   } | null,
   success: boolean,
}
```

**Backend action:** Add those fields to `PreviewQuoteResponseSerializer` (see code snippet). Regenerate OpenAPI & run `npm run update-schema`. We might also need to create `DiffPreviewSerializer` and `ValidationReportSerializer`.

### JobWithFinancialData

**Required by:** `src/components/job/JobFinancialTab.vue`  
**Justification:** API response combining job details with structured financial data for latest estimate, actuals, quote, and invoice. Ensures the frontend receives the correct nested objects as returned by the backend, rather than empty objects.

**Properties needed:**

```typescript
interface JobWithFinancialData {
  latest_estimate?: {
    summary?: {
      rev: number
    }
  } | null
  latest_actual?: {
    summary?: {
      rev: number
    }
    cost_lines?: {
      kind: string
      total_rev: number
    }[]
  } | null
  quote?: {
    total_excl_tax: number
    online_url?: string
  } | null
  invoice?: {
    total_excl_tax: number
    online_url?: string
  } | null
}
```

**Backend action needed:** Add `JobWithFinancialDataSerializer` and expose it in the OpenAPI schema to match the actual API response structure.

### XeroSyncResponse

**Required by:** `src/components/job/JobFinancialTab.vue`  
**Justification:** Response from `/api/xero/*` quote/invoice create-delete endpoints.

**Properties needed:**

```typescript
interface XeroSyncResponse {
  success: boolean
  error?: string
  xero_id?: string
  online_url?: string
  error_type?: string
  details?: string
}
```

**Backend action needed:** Add `XeroSyncResponseSerializer` and expose it in the OpenAPI schema.

### JobEvent

**Required by:** `src/components/job/JobHistoryModal.vue`  
**Justification:** although they're returned from /job/rest/jobs/:id/events/ endpoint, the specific structure is not properly typed in the generated API.
**Fields currently used in UI:**

```typescript
interface JobEvent {
  id: string | number
  description: string
  timestamp: string
  staff: string // display name / initials
  event_type: string
}
```

**Backend action needed:** Add `JobEventSerializer` and expose it in the OpenAPI schema.

### WeeklyTimesheetData (fully-typed)

**Required by:** `src/components/timesheet/WeeklyMetricsModal.vue`  
**Problem:** The generated serializer for `getWeeklyTimesheet` returns `unknown` for `staff_data`, `weekly_summary`, and `job_metrics`, forcing the frontend to create a local `TypedWeeklyTimesheetData`.  
**Fields currently used in UI:**

```typescript
interface WeeklyTimesheetData {
  week_start: string // 'YYYY-MM-DD'
  weekly_summary: {
    total_hours: number
    staff_count: number
    billable_percentage: number
  }
  job_metrics: {
    total_estimated_profit: number
    total_actual_profit: number
    total_profit: number
  }
  staff_data: {
    id: string
    name: string
    weekly_hours: { date: string; hours: number }[]
  }[]
}
```

**Backend action:** Update serializer/@extend_schema to type these fields and regenerate the OpenAPI schema.

### IMSWeeklyData

**Required by:** src/components/timesheet/WeeklyMetricsModal.vue
**Justification:** Response from the export endpoint to the IMS system; structure is almost identical to `WeeklyTimesheetData`, but already prepared for integration.

**Backend action needed:** Create `IMSWeeklyDataSerializer` and expose it in the OpenAPI schema.

## ❌ REMOVED - These are Frontend Constants (ARCHITECTURAL VIOLATION)

The following were inappropriately requested as backend schemas when they should be frontend constants:

- ~~`StatusChoice`~~ - Static UI dropdown values → Frontend constants
- ~~`PricingSectionSchema`~~ - UI form structure → Frontend types
- ~~`AdvancedFiltersSchema`~~ - UI filter structure → Frontend types
- ~~`DateRangeSchema`~~ - UI date picker → Frontend types
- ~~`CostSetSummary`~~ - Frontend computation → Frontend types

## 🔧 Frontend Action Required

**Create proper frontend constants files for the removed items:**

- `src/constants/job-status.ts` - Job status choices
- `src/types/ui-forms.ts` - Form-related UI types
- `src/types/filters.ts` - Filter and search UI types

## Immediate Action Required

**The backend team needs to:**

1. Add proper OpenAPI schema annotations for all missing types
2. Regenerate the OpenAPI schema documentation
3. Notify frontend team when schemas are available
4. Frontend team will then run `npm run update-schema` to get the new types

**DO NOT create local schema workarounds - this breaks the single source of truth principle.**
