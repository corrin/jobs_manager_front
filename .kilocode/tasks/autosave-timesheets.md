# Timesheets Autosave Migration Plan (NZ-English)

Status: In Progress
Owner: Frontend
Scope: Timesheet Entry Grid autosave migration, permanent (no rollback flag)

1. Objectives

- Replace explicit save button with per-row autosave, without changing existing persistence functions.
- Preserve duplicate validation and backend authority; do not block editing of other rows during saves.
- Provide Purchasing-grade toast UX for save/validation feedback.

2. Non-Goals

- No backend contract changes.
- No schema/type changes outside generated API types.
- No redesign of grid columns or job selection logic.

3. Architecture Constraints and References

- Frontend-backend separation: UI-only constants remain local; database data uses generated types.
- API types must come from the generated file.
- Saving logic is already implemented in [handleSaveEntry()](src/views/TimesheetEntryView.vue:800) and [handleDeleteEntry()](src/views/TimesheetEntryView.vue:909).
- Grid recalculation and duplicate detection logic lives in [useTimesheetEntryGrid.handleCellValueChanged()](src/composables/useTimesheetEntryGrid.ts:261) and [useTimesheetEntryGrid.isDuplicateEntry()](src/composables/useTimesheetEntryGrid.ts:236).
- Cost line service endpoints: [createCostLine()](src/services/costline.service.ts:29), [updateCostLine()](src/services/costline.service.ts:45), [deleteCostLine()](src/services/costline.service.ts:54), [getTimesheetEntries()](src/services/costline.service.ts:12).
- Error messaging helpers for toasts: [extractErrorMessage()](src/utils/errorHandler.ts:1), [createErrorToast()](src/utils/errorHandler.ts:33).
- Purchasing autosave reference flows: [saveLines()](src/views/purchasing/PurchaseOrderFormView.vue:459) and [watch()](src/views/purchasing/PurchaseOrderFormView.vue:781).
- Grid event integration points in Timesheets: [onCellValueChanged()](src/views/TimesheetEntryView.vue:947) and [handleKeydown()](src/views/TimesheetEntryView.vue:1256).

4. Current State Summary

- The Timesheet view sets up AG Grid with [AgGridVue](src/views/TimesheetEntryView.vue:339) and routes events to [onCellValueChanged()](src/views/TimesheetEntryView.vue:947).
- Row recalculation is performed in the composable [useTimesheetEntryGrid.handleCellValueChanged()](src/composables/useTimesheetEntryGrid.ts:261), which calls [useTimesheetEntryCalculations.recalculateEntry()](src/composables/useTimesheetEntryCalculations.ts:161).
- Manual save flow aggregates modified rows via [saveChanges()](src/views/TimesheetEntryView.vue:979) then delegates each row to [handleSaveEntry()](src/views/TimesheetEntryView.vue:800).
- Duplicate protection already exists for new rows via [isDuplicateEntry()](src/composables/useTimesheetEntryGrid.ts:236).
- Refresh/reset of the grid is done by [loadTimesheetData()](src/views/TimesheetEntryView.vue:1135) using [getTimesheetEntries()](src/services/costline.service.ts:12).

5. Target Design Overview

- Per-row autosave with debounce and bounded concurrency.
- Soft refresh per saved row to maintain consistency without blocking edits elsewhere.
- Toast-based UX aligned with Purchasing’s behaviour.
- Permanent migration: remove Save All actions and unsaved banners.

6. Autosave Orchestrator (Per Row)
   Responsibilities:

- Debounce saves per row key (id or tempId).
- Prevent duplicate in-flight saves for the same row.
- Queue saves beyond concurrency limit (default 2).
- Coalesce rapid edits: if changes occur during a save, schedule a follow-up run.

Row identity:

- If row has backend id, use it as rowKey.
- Otherwise use tempId; after create, migrate state under the new backend id.

Triggers:

- The view’s [onCellValueChanged()](src/views/TimesheetEntryView.vue:947) schedules autosave for that row.
- The composable continues to recalc values in [useTimesheetEntryGrid.handleCellValueChanged()](src/composables/useTimesheetEntryGrid.ts:261) before scheduling.

Duplicate check:

- For new rows (no id), validate with [useTimesheetEntryGrid.isDuplicateEntry()](src/composables/useTimesheetEntryGrid.ts:236) prior to save.
- Always keep backend as the final source of truth (handle 409/422 by toast).

Concurrency:

- Allow N=2 concurrent saves; additional tasks wait in FIFO.
- If a row is edited while \_isSaving is true, mark pending and re-debounce on completion.

Debounce:

- Default delay 800ms from last change of that row.

7. Save Execution Flow

1) onCellValueChanged in the view marks row as modified and calls orchestrator.
2) Orchestrator validates eligibility (row complete, not duplicate if new).
3) Show non-blocking “Saving…” toast (info) per row with a stable id.
4) Call existing [handleSaveEntry()](src/views/TimesheetEntryView.vue:800).
5) On success:
   - Dismiss info toast; show success toast; clear isModified/isNewRow flags (already handled).
   - Soft refresh that row (see section 8).
   - Recompute day stats locally from grid.
6) On error:
   - Dismiss info toast; show error toast using [extractErrorMessage()](src/utils/errorHandler.ts:1).
   - Keep the row editable; do not block other rows.

8. Soft Refresh Strategy (Single Row)
   Goal: Ensure consistency with backend without full reload or losing focus.
   Approach:

- After a row saves, fetch current entries via [getTimesheetEntries()](src/services/costline.service.ts:12).
- Locate the saved row by id and merge only that row’s authoritative values back into gridData.
- Avoid setting global loading; use local flags if needed; never prevent editing of other rows.
- If the row was created (id was null), adopt the new id and update the orchestrator’s rowKey map.

9. Today Stats Update

- After each save/refresh, recompute todayStats directly from grid rows to avoid a full reload.
- Optionally validate against backend values obtained during the soft refresh.

10. UX and Toast Conventions (Aligned with Purchasing)

- Use vue-sonner with stable toast ids per row (“timesheet-save-{rowKey}”).
- Patterns from Purchasing: [saveLines()](src/views/purchasing/PurchaseOrderFormView.vue:459) and [watch()](src/views/purchasing/PurchaseOrderFormView.vue:781).
- Messages:
  - Info: “Saving entry…”
  - Success: “Entry saved”
  - Error: “Save failed: {message}”

11. Permanent Migration (No Rollback Flag)

- No feature flag. Autosave becomes the only path.
- Remove Save All buttons and “Unsaved changes” banners from all layouts.
- Ctrl+S becomes a convenience status action: when queue is empty, show “All changes saved”.
- Communicate the change in release notes and internal training (no UI fallback).

12. UI Adjustments

- Remove save buttons and “unsaved” badges:
  - Mobile Save button at [TimesheetEntryView.vue](src/views/TimesheetEntryView.vue:125).
  - Desktop Save button at [TimesheetEntryView.vue](src/views/TimesheetEntryView.vue:275).
  - Mobile unsaved notice at [TimesheetEntryView.vue](src/views/TimesheetEntryView.vue:377).
  - Desktop unsaved notice at [TimesheetEntryView.vue](src/views/TimesheetEntryView.vue:409).
- Keyboard:
  - Maintain [handleKeydown()](src/views/TimesheetEntryView.vue:1256).
  - Ctrl+S should emit a success toast if there are no pending saves.

13. Data and Validation Rules (Frontend)

- Row completeness for save:
  - job present (jobId or jobNumber),
  - description non-empty,
  - hours > 0.
- Duplicate rule (new rows only): same staffId + date + jobNumber + description when a persisted row exists.
- Hours limits: 0 < hours ≤ 24 (already validated in calculations/utilities).

14. Error Handling

- Use [extractErrorMessage()](src/utils/errorHandler.ts:1) and [createErrorToast()](src/utils/errorHandler.ts:33).
- Handle 401 by global interceptor ([axios interceptor](src/plugins/axios.ts:34)).
- For 422/409 duplicates: show toast, keep row editable; no global reload.

15. Pseudocode (Orchestrator)

```ts
type RowKey = string
const timers = new Map<RowKey, number>()
const state = new Map<RowKey, { isSaving: boolean; pending: boolean }>()
const queue: RowKey[] = []
const MAX_CONCURRENCY = 2
let inFlight = 0

function scheduleSave(rowKey: RowKey, getEntry: () => Entry) {
  clearTimeout(timers.get(rowKey))
  timers.set(
    rowKey,
    window.setTimeout(() => enqueue(rowKey, getEntry), 800),
  )
}

function enqueue(rowKey: RowKey, getEntry: () => Entry) {
  if (state.get(rowKey)?.isSaving) {
    state.set(rowKey, { isSaving: true, pending: true })
    return
  }
  queue.push(rowKey)
  process(getEntry)
}

function process(getEntry: (rk: RowKey) => Entry) {
  while (inFlight < MAX_CONCURRENCY && queue.length) {
    const rk = queue.shift()!
    const st = state.get(rk) || { isSaving: false, pending: false }
    st.isSaving = true
    st.pending = false
    state.set(rk, st)
    inFlight++
    saveRow(rk, getEntry(rk)).finally(() => {
      inFlight--
      st.isSaving = false
      state.set(rk, st)
      if (st.pending) enqueue(rk, getEntry)
      process(getEntry)
    })
  }
}
```

16. Soft Refresh Merge (Example)

- Fetch entries for (staffId, date).
- Find saved row by id.
- Patch only that row’s fields in gridData and clear local transient flags.

17. Risks and Mitigations

- Excessive network chatter → debounce and concurrency cap.
- Lost focus during refresh → patch row in place; avoid full reload.
- Temporary divergence between UI and backend → soft refresh after save.

18. Manual QA Checklist

- Create new row, fill job/hours/description → autosaves within ~800ms.
- Edit existing row fields → autosaves and shows success toast.
- Duplicate new row (same staff/date/job/desc) → blocked by UI or backend; toast shows error.
- Rapid edits on same row → single final save due to debounce; if in-flight, pending follow-up runs.
- Multiple rows edited concurrently → up to 2 saves in parallel, rest queued.
- Delete a row → still works via [handleDeleteEntry()](src/views/TimesheetEntryView.vue:909); autosave ignores removed rows.
- Ctrl+S shows “All changes saved” when queue empty.
- Mobile and desktop layouts: no Save buttons; toasts visible; grid remains interactive.

19. Deployment and Communication

- Deploy the autosave change as permanent.
- Communicate behavioural change to staff; update help text and keyboard shortcuts dialog in the Timesheet view.
- Monitor logs and error rates post-deploy; iterate on debounce/concurrency if required.

20. Logging and Telemetry

- Prefer debugLog() entries around schedule/enqueue/save to help diagnose timing/race issues.
- Log toast id and rowKey on save start and completion for traceability.

21. Implementation Notes (Where to Wire Things)

- Wire scheduler in [onCellValueChanged()](src/views/TimesheetEntryView.vue:947).
- Keep recalculation in [useTimesheetEntryGrid.handleCellValueChanged()](src/composables/useTimesheetEntryGrid.ts:261).
- Continue to use [handleSaveEntry()](src/views/TimesheetEntryView.vue:800) and services [createCostLine()](src/services/costline.service.ts:29)/[updateCostLine()](src/services/costline.service.ts:45).
- Use [getTimesheetEntries()](src/services/costline.service.ts:12) for soft refresh.
- Use [extractErrorMessage()](src/utils/errorHandler.ts:1) and [createErrorToast()](src/utils/errorHandler.ts:33) for toasts.

22. Progress to Date (2025-08-13)

- Autosave orchestrator implemented at [useTimesheetAutosave.ts](src/composables/useTimesheetAutosave.ts):
  - Debounce 800ms per rowKey, MAX_CONCURRENCY=2, FIFO queue, in-flight and pending handling.
  - Stable toast ids “timesheet-save-{rowKey}”, rowKey migration from tempId to backend id.
- Timesheet view integration (partial):
  - Orchestrator imported and instantiated; schedules per-row save in [onCellValueChanged()](src/views/TimesheetEntryView.vue:947) after grid recalculation.
  - [softRefreshRow()](src/views/TimesheetEntryView.vue:913) implemented to patch only the saved row via [getTimesheetEntries()](src/services/costline.service.ts:12) without blocking edits.
  - Ctrl+S updated to show “All changes saved” when queue idle, or “Saving entries…” otherwise.
- UI migration:
  - Save buttons (mobile/desktop) removed.
  - “Unsaved” banners removed (mobile/desktop).
- Duplicate check:
  - Guard present in orchestrator for new rows (idless) against persisted rows; grid’s [isDuplicateEntry()](src/composables/useTimesheetEntryGrid.ts:236) exposed for reuse.
- Today stats:
  - Computed from local timeEntries; soft refresh updates timeEntries post-save to keep stats consistent.
- Error/toast UX:
  - vue-sonner messages aligned to Purchasing; error messages via [extractErrorMessage()](src/utils/errorHandler.ts:1).
- Persistence path unchanged:
  - Reuses existing [handleSaveEntry()](src/views/TimesheetEntryView.vue:800) and [handleDeleteEntry()](src/views/TimesheetEntryView.vue:909). No backend contract changes.

23. Next Steps

- Type safety and lint:
  - Replace remaining any casts in Timesheet autosave wiring with strict types (TimesheetEntryWithMeta).
  - Remove unused imports left from Save buttons removal (e.g., Save, AlertCircle).
- Remove legacy “Save All” flow:
  - Delete saveChanges() function and update “Keyboard Shortcuts” dialog to remove “Save changes” hint.
- Duplicate validation:
  - Centralize orchestrator duplicate check to call [useTimesheetEntryGrid.isDuplicateEntry()](src/composables/useTimesheetEntryGrid.ts:236) directly.
- Stats and refresh:
  - Validate todayStats after soft refresh for each saved row; no full reloads during editing.
- Telemetry and debug:
  - Add debugLog around schedule/enqueue/saveRow/softRefresh for traceability.
- Manual QA:
  - Execute full checklist in section 18 and document results.

24. Known Issues / Follow-ups

- Editor ts-plugin showing alias resolution warnings for some '@/...' imports; investigate tsconfig/volar if they persist, but not blocking for autosave scope.
- Ensure no global loading state blocks editing while a row is saving; migrate to row-scoped saving flags if needed inside [handleSaveEntry()](src/views/TimesheetEntryView.vue:800).

25. Completion Criteria Update

- Autosave fully replaces explicit save flow.
- Soft refresh per row works reliably; QA checklist passes including duplicates and concurrency.
- Delete continues to work without interference from autosave.
- Purchasing-grade toasts and keyboard shortcut behavior (Ctrl+S status) verified across mobile and desktop.
