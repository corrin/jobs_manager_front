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
- _Company Defaults_: wage_rate, charge_out_rate, materials_markup available via service.

---

## 2. Modular Refactor Plan (Updated)

### PART 1: Centralised CostLinesGrid Component

- Single CostLinesGrid.vue in shared/ for both estimate and quote.
- Always use "$" as the currency symbol.
- Columns: Item, Description, Kind, Quantity, Unit cost, Unit revenue, Total cost, Total revenue, Actions (optional).
- Edit/delete via props/callbacks.
- Component centralised and legacy job/ version removed.

### PART 2: Add Entry Dropdown/Modal (Updated)

- AddCostLineDropdown.vue triggers modals for material/time.
- **Material modal:**
  - Only two fields: unit cost and quantity.
  - Mini summary: unit revenue (editable), total revenue, total cost (all calculated live).
  - unit revenue defaults to unit cost * (1 + materials_markup from company defaults), but is editable.
  - All calculations use company defaults from service.
- **Time modal:**
  - Only one field: hours (decimal, becomes quantity).
  - Mini summary: total cost and total revenue (calculated live).
  - unit cost = wage_rate, unit revenue = charge_out_rate (from company defaults, not shown, sent to backend).
- Both modals implemented conforme requisitos.

### PART 3: Refactor JobEstimateTab.vue

- Remove AG Grid.
- Use shared/CostLinesGrid.vue.
- Use AddCostLineDropdown.vue to add.
- Edit/delete via modals and service.
- Update summary reactively (use generic SummaryCard).
- [em andamento]

### PART 4: Refactor JobQuoteTab.vue

- Use shared/CostLinesGrid.vue for quote if no quote_sheet.
- Dropdown disabled if quote_sheet.
- Generic SummaryCard.
- [próximo]

### PART 5: Generic SummaryCard

- Generalise QuoteSummaryCard.vue for any costset.
- Use in Estimate and Quote.
- [próximo]

### PART 6: Integration and Testing

- Ensure reactive update after CRUD.
- Test edit lock when quote_sheet.
- Test UX of modals and dropdown.
- [próximo]

---

## 3. Endpoints and Services

- createCostLine(jobId, kind, payload)
- updateCostLine(id, payload)
- deleteCostLine(id)
- fetchCostSet(jobId, kind)
- get company defaults from CompanyDefaultsService

---

## 4. Stores/State

- No global store, use props and emits for local reactivity.
- If needed, create a composable useCostLines for local fetch/update.

---

## 5. Incremental Execution

- [x] Part 1: CostLinesGrid.vue (shared, centralised)
- [x] Part 2: AddCostLineDropdown.vue + modals (updated requirements)
- [ ] Part 3: Refactor JobEstimateTab.vue
- [ ] Part 4: Refactor JobQuoteTab.vue
- [ ] Part 5: Generic SummaryCard
- [ ] Part 6: Integration/testing

---

## Notes

- The plan allows incremental execution, with testing at each step.
- Backend is ready for the flow.
- Modal design is simple, prioritising UX and clarity.
- The centralised component makes future maintenance easier.

---

_Plan updated. Part 1 and 2 complete and centralised. Proceeding to refactor tabs and summary._
