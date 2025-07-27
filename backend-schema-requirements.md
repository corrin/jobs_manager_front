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
