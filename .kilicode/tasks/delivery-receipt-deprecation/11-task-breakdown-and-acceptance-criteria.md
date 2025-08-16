# Task Breakdown and Acceptance Criteria — Inline Receipt Allocation

This document breaks down the migration into implementable tickets with dependencies, estimates, and concrete acceptance criteria (AC). It covers the inline allocation editor embedded in [PoLinesTable.vue](src/components/purchasing/PoLinesTable.vue) and orchestration in [PurchaseOrderFormView.vue](src/views/purchasing/PurchaseOrderFormView.vue).

References:

- Plan overview: [00-executive-summary.md](./00-executive-summary.md)
- UX spec: [03-ux-spec-inline-allocation.md](./03-ux-spec-inline-allocation.md)
- Architecture: [04-architecture-and-data-flow.md](./04-architecture-and-data-flow.md)
- State & guards: [05-state-management-and-dirty-guards.md](./05-state-management-and-dirty-guards.md)
- API adapter: [06-api-adapter-and-endpoints.md](./06-api-adapter-and-endpoints.md)
- Business rules: [07-business-rules-and-edge-cases.md](./07-business-rules-and-edge-cases.md)
- Errors & reconciliation: [08-error-handling-optimism-and-reconciliation.md](./08-error-handling-optimism-and-reconciliation.md)
- Code snippets: [09-code-examples-and-focused-snippets.md](./09-code-examples-and-focused-snippets.md)
- Rollout KPIs: [10-rollout-plan-kpis-and-telemetry.md](./10-rollout-plan-kpis-and-telemetry.md)

---

## Ticket T1 — Confirm Policies and Endpoint Shapes

- Dependencies: None
- Estimate: 1 day
- Description:
  - Resolve open questions: over/under receipt policy, draft multiplicity, returns model, UoM conversions, location/bin permissions, conflict policy, “copy previous” source, ratio source.
  - Validate actual endpoint names and payloads in [`src/api/generated/api.ts`](src/api/generated/api.ts).
- Acceptance Criteria:
  - A finalized decision log answering all items in [01-questions-for-confirmation.md](./01-questions-for-confirmation.md).
  - No ambiguity remains that would affect validation, UX strings, or adapter behavior.

## Ticket T2 — Feature Flag Plumbing

- Dependencies: T1
- Estimate: 0.25 day
- Description:
  - Introduce feature flag `purchasing.inline_receipt_allocation`.
  - Wire conditional rendering of the “Allocations” column and commit button in [`PurchaseOrderFormView.vue`](src/views/purchasing/PurchaseOrderFormView.vue).
- Acceptance Criteria:
  - Flag off: no inline editor visible; legacy flow unaffected.
  - Flag on: inline column visible and interactive.

## Ticket T3 — Adapter: purchasing-receipt.service.ts

- Dependencies: T1
- Estimate: 0.5 day
- Description:
  - Implement thin adapter over generated client in [`src/services/purchasing-receipt.service.ts`](src/services/purchasing-receipt.service.ts) for:
    - getOrCreateDraft(poId)
    - listAllocations(receiptId)
    - upsertAllocation(receiptId, allocation)
    - deleteAllocation(receiptId, allocationId)
    - commitReceipt(receiptId)
  - Add stubs for optional batch ops and metadata caches (locations/bins/policies).
- Acceptance Criteria:
  - Smoke test: ensure a draft receipt can be created, allocations listed, and a no-op commit returns 200/201 as appropriate.
  - No local API entity interfaces; only UI-only shapes where needed.

## Ticket T4 — Store: receiptStore (Pinia)

- Dependencies: T2, T3
- Estimate: 1 day
- Description:
  - Create [`src/stores/receiptStore.ts`](src/stores/receiptStore.ts) with state, selectors, optimistic upsert/delete, conflict handling, and commit action as per [05-state-management-and-dirty-guards.md](./05-state-management-and-dirty-guards.md).
- Acceptance Criteria:
  - Optimistic updates reflect instantly and reconcile correctly on success.
  - Conflict path (simulate 409) reloads line allocations and exposes a retry affordance.
  - Dirty tracking aggregates across lines.

## Ticket T5 — useAllocation Composable

- Dependencies: T1
- Estimate: 0.5 day
- Description:
  - Implement [`src/composables/useAllocation.ts`](src/composables/useAllocation.ts) functions for ratio distribution, UoM conversion, rounding, and sum validation as per [09-code-examples-and-focused-snippets.md](./09-code-examples-and-focused-snippets.md).
- Acceptance Criteria:
  - Unit-friendly functions return expected results for edge rounding cases.
  - No side effects; pure functions tested locally (Vitest optional).

## Ticket T6 — AllocationCellEditor.vue (UI-only)

- Dependencies: T2, T4, T5
- Estimate: 1.5 days
- Description:
  - Implement [`src/components/purchasing/AllocationCellEditor.vue`](src/components/purchasing/AllocationCellEditor.vue).
  - Include quick actions, keyboard map, inline validation, ARIA roles, and i18n keys per [03-ux-spec-inline-allocation.md](./03-ux-spec-inline-allocation.md).
- Acceptance Criteria:
  - Editor opens from the “Allocations” cell; fields editable with Tab/arrow navigation.
  - Quick actions emit events; validation prevents negative or empty invalid states.
  - A11y: role="dialog", focus trap, Esc closes; labels and live region present.

## Ticket T7 — PoLinesTable Integration

- Dependencies: T6
- Estimate: 0.5 day
- Description:
  - Add “Allocations” column to [`src/components/purchasing/PoLinesTable.vue`](src/components/purchasing/PoLinesTable.vue).
  - Wire props (`getLineAllocations`, `getRemaining`) and emits (`allocation:update|delete|quickAction`) to parent.
- Acceptance Criteria:
  - Column renders per row; disabled states propagate from `readOnly`.
  - Events bubble to parent; no network calls executed by the table.

## Ticket T8 — PurchaseOrderFormView Orchestration

- Dependencies: T4, T7
- Estimate: 0.5 day
- Description:
  - Ensure draft receipt on mount; refresh allocations; expose commit button; implement handlers forwarding to store in [`src/views/purchasing/PurchaseOrderFormView.vue`](src/views/purchasing/PurchaseOrderFormView.vue).
- Acceptance Criteria:
  - Draft ensured, allocations loaded.
  - Commit triggers server call, reloads PO, and shows success toast.
  - Navigation guard warns when unsaved state exists.

## Ticket T9 — Validation & Policy Wiring

- Dependencies: T1, T4, T6
- Estimate: 0.5 day
- Description:
  - Enforce cross-field rules (sum equals target at commit checkpoints, non-negative, lot/serial required, over-receipt policy default deny).
  - Connect UoM metadata when provided by backend.
- Acceptance Criteria:
  - Inline and toast messages match i18n keys.
  - Commit blocked with actionable errors when rules are violated.

## Ticket T10 — Permissions & Location/Bin Filtering

- Dependencies: T1, T3
- Estimate: 0.5 day
- Description:
  - Filter locations/bins by permissions from backend list endpoints.
  - Disable fields and actions when permissions are missing; show banner.
- Acceptance Criteria:
  - Users without permission cannot select restricted locations/bins.
  - 403 surfaced as inline banner and actions disabled.

## Ticket T11 — i18n and A11y Polishing

- Dependencies: T6–T8
- Estimate: 0.5 day
- Description:
  - Extract all strings to i18n with en-US and pt-BR.
  - Validate keyboard-only path; ensure high-contrast and ARIA attributes.
- Acceptance Criteria:
  - Screen reader announces validation and status updates.
  - All strings are translatable and present in locales.

## Ticket T12 — E2E Happy Path (Cypress)

- Dependencies: T6–T8
- Estimate: 1 day
- Description:
  - Scenario: allocate remaining on two lines, commit receipt, verify allocations persisted.
  - Optional: conflict mock leading to retry success.
- Acceptance Criteria:
  - Test passes in CI in DEV/UAT environment with feature flag enabled.

## Ticket T13 — Batch Endpoint RFC (Optional)

- Dependencies: parallel to build
- Estimate: 0.25 day
- Description:
  - Draft a short RFC for `/receipts/:id/allocations/batch/` with feature-flagged rollout and safe fallback.
- Acceptance Criteria:
  - Document shared with backend; client keeps fallback to per-row ops.

---

## Cross-Cutting Acceptance Criteria

- Performance:
  - Inline interactions feel instant; background saves do not block editing.
  - Commit P50 < 400ms; P95 < 1s for typical payloads.
- Stability:
  - No console errors in normal use; conflicts handled gracefully.
- Security:
  - 401 triggers global auth handling; 403 disables operations with clear messaging.
- Parity:
  - All capabilities in [02-feature-parity-matrix.md](./02-feature-parity-matrix.md) present or improved.
- No schema duplication:
  - All API entities typed via [`src/api/generated/api.ts`](src/api/generated/api.ts).
- Logging:
  - DEV-only debug logs; no sensitive data (serials) logged.
- Rollout flag:
  - Can disable the feature instantly and fall back to legacy without breaking flows.

---

## Suggested Ordering

1. T1 → T2 → T3 → T4 → T6 → T7 → T8 → T9 → T10 → T5 → T11 → T12 → T13 (optional)

Note:

- T5 (useAllocation) can be developed earlier if needed for quick actions.
- T12 after main flows stabilize; can stub backend responses with MSW if necessary for CI.
