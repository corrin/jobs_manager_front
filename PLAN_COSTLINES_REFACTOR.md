# Centralisation and Modernisation of CostLines (Estimate/Quote)

## Objective

Unify the cost line management experience (materials and time) in the Estimate and Quote tabs, removing AG Grid from Estimate and using a shared custom table component, with modals for create/edit, and an add dropdown. The flow must be reactive, clean, and consistent.

---

## 1. Diagnosis and Existing Resources

- _CostLine CRUD_: Service for create, update, delete already exists (costline.service.ts).
- _CostSet Fetch_: fetchCostSet already returns cost lines for estimate/quote/actual.
- _QuoteCostLinesGrid.vue_: Custom table for displaying cost lines (quote), no actions.
- _JobEstimateTab.vue_: Uses AG Grid, but already has cost line logic, modals, and summary.
- _JobQuoteTab.vue_: Uses QuoteCostLinesGrid.vue, but no actions.
- _QuoteSummaryCard.vue_: Cost set/quote summary, can be generalised.
- _Endpoints_: Backend already supports create/update/delete costline for any costset (estimate, quote, actual).
- _Company Defaults_: wage_rate, charge_out_rate, materials_markup available via props.

---

## 2. Modular Refactor Plan

### PART 1: Centralised CostLinesGrid Component

- Create CostLinesGrid.vue based on QuoteCostLinesGrid.vue, but with optional "Actions" column (edit/delete).
- Allow edit/delete via props/callbacks.
- Use for estimate and quote.
- **Status: Done**

### PART 2: Add Entry Dropdown/Modal

- Create AddCostLineDropdown.vue (dropdown + modals for material/time).
- Material modal: unit cost, quantity, show unit revenue/total revenue (uses company defaults).
- Time modal: time (decimal), show total cost/revenue (uses wage_rate/charge_out_rate).
- "+ Add entry" button always visible, dropdown disabled if quote_sheet present.
- **Status: Next**

### PART 3: Refactor JobEstimateTab.vue

- Remove AG Grid.
- Use CostLinesGrid.vue to list estimate cost lines.
- Use AddCostLineDropdown.vue to add.
- Edit/delete via modals and service.
- Update summary reactively (use generic SummaryCard).

### PART 4: Refactor JobQuoteTab.vue

- Use CostLinesGrid.vue for quote if no quote_sheet.
- Dropdown disabled if quote_sheet.
- Generic SummaryCard.

### PART 5: Generic SummaryCard

- Generalise QuoteSummaryCard.vue for any costset.
- Use in Estimate and Quote.

### PART 6: Integration and Testing

- Ensure reactive update after CRUD.
- Test edit lock when quote_sheet.
- Test UX of modals and dropdown.

---

## 3. Endpoints and Services

- createCostLine(jobId, kind, payload)
- updateCostLine(id, payload)
- deleteCostLine(id)
- fetchCostSet(jobId, kind)

---

## 4. Stores/State

- No global store, use props and emits for local reactivity.
- If needed, create a composable useCostLines for local fetch/update.

---

## 5. Incremental Execution

- [x] Part 1: CostLinesGrid.vue
- [ ] Part 2: AddCostLineDropdown.vue + modals
- [ ] Part 3: Refactor JobEstimateTab.vue
- [ ] Part 4: Refactor JobQuoteTab.vue
- [ ] Part 5: Generic SummaryCard
- [ ] Part 6: Integration/testing

---

## Notes

- The plan allows incremental execution, with testing at each step.
- Backend is ready for the flow.
- Modal design can be simple, prioritising UX and clarity.
- The centralised component makes future maintenance easier.

---

_Plan updated. Part 1 complete. Ready to proceed with Part 2: AddCostLineDropdown.vue + modals._
