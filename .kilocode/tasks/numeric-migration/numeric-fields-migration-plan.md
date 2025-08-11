# Audit and Migration Plan: Native Numeric Fields

Date: 2025-08-07  
Version: 1.1  
Objective: Eliminate unnecessary conversions of fields that were previously numeric strings and are now native numeric types

---

## Executive Summary

Migration scope

- 96 fields identified in previous_fields_mapping.md
- 388 occurrences of conversions found in code (261 in .vue + 127 in .ts)
- Key categories: Financial, Quantities, Time, Percentages, Metrics

Impact assessment

- High: Timesheet components, job costing, purchasing
- Medium: Reports, KPIs, forms
- Low: Formatting utilities, UI components

Key constraints for this plan

- No unit or integration test suites are available at this stage
- Validation will rely on:
  - TypeScript strict type-checking (tsc)
  - ESLint rules for numeric conversion regressions
  - Manual exploratory testing guided by checklists
  - Staging UAT on critical flows (timesheet and costing)
  - Targeted data spot checks and result parity checks

---

## Mapped Fields by Category

Category A: Financial Fields (HIGH priority)

```typescript
// Fields critical to financial calculations
// occurrences (previous audit):
// - unit_cost: 23
// - unit_rev: 23
// - wage_rate: 8
// - charge_out_rate: 6
// - total_cost: 2
// - total_rev: 2
// - daily_gp_target: 2
```

Category B: Quantity Fields (HIGH priority)

```typescript
// Critical for inventory and production
// occurrences:
// - quantity: 15
// - received_quantity: 2
// - remaining_quantity: 1
// - total_received: 1
```

Category C: Time Fields (MEDIUM priority)

```typescript
// Hours control
// occurrences:
// - hours: 4 (various contexts)
// - total_hours: 4
// - billable_hours: 4
// - scheduled_hours: 2
// - duration: 1
```

Category D: Percentage Fields (MEDIUM priority)

```typescript
// Metrics and markups
// occurrences:
// - billable_percentage: 4
// - time_markup: 2
// - materials_markup: 2
// - shop_hours_target_percentage: 2
```

Category E: Metrics Fields (LOW priority)

```typescript
// Calculated and reporting fields
// occurrences:
// - total_estimated_profit: 1
// - total_actual_profit: 1
// - total_profit: 1
// - billable_threshold_green: 2
// - billable_threshold_amber: 2
```

---

## Identified Problematic Conversion Patterns

1. Unnecessary conversions in API calls

```typescript
// Problematic - unnecessary conversion
quantity: formData.value.quantity.toString()
unit_cost: formData.value.unit_cost.toString()

// Correct - native numeric values
quantity: formData.value.quantity
unit_cost: formData.value.unit_cost
```

2. Redundant parsing of API data

```typescript
// Problematic - unnecessary parse
const hours = parseFloat(line.quantity)
const cost = parseFloat(line.unit_cost)

// Correct - direct usage
const hours = line.quantity
const cost = line.unit_cost
```

3. Conversions in calculations

```typescript
// Problematic - multiple conversions
const total = Number(quantity) * Number(unitCost)

// Correct - direct calculation
const total = quantity * unitCost
```

Most affected files (Top 10)

1. TimesheetEntryView.vue - 25 conversions
2. JobEstimateTab.vue - 18 conversions
3. StaffFormModal.vue - 15 conversions
4. JobActualTab.vue - 12 conversions
5. useTimesheetEntryCalculations.ts - 11 conversions
6. CostSetSummaryCard.vue - 10 conversions
7. JobCreateView.vue - 9 conversions
8. StockConsumptionModal.vue - 8 conversions
9. purchasing/PurchaseOrderFormView.vue - 7 conversions
10. timesheet.service.ts - 6 conversions

---

## Phased Migration Strategy

Phase 1: Critical Timesheet components

- Priority: CRITICAL
- Risk: HIGH
- Impact: Daily data entry

Files:

- TimesheetEntryView.vue
- useTimesheetEntryCalculations.ts
- useTimesheetEntryGrid.ts
- timesheet.service.ts
- TimesheetEntryJobCellEditor.ts

Conversions to eliminate:

```typescript
// Timesheet entries
parseFloat(entry.hours)         → entry.hours
parseFloat(entry.wageRate)      → entry.wageRate
parseFloat(entry.chargeOutRate) → entry.chargeOutRate
hours.toString()                → hours
wageRate.toString()             → wageRate
```

Phase 2: Costing and Jobs

- Priority: HIGH
- Risk: MEDIUM
- Impact: Financial calculations

Files:

- JobEstimateTab.vue
- JobActualTab.vue
- JobCreateView.vue
- CostSetSummaryCard.vue
- CostLinesGrid.vue
- costline.service.ts

Conversions to eliminate:

```typescript
// Cost calculations
Number(line.quantity)   → line.quantity
Number(line.unit_cost)  → line.unit_cost
parseFloat(value)       → value
quantity.toString()     → quantity
```

Phase 3: Purchasing

- Priority: MEDIUM
- Risk: MEDIUM
- Impact: Purchasing management

Files:

- purchasing/PurchaseOrderFormView.vue
- purchasing/ReceivedItemsTable.vue
- purchasing/PendingItemsTable.vue
- StockConsumptionModal.vue

Phase 4: Forms and Modals

- Priority: MEDIUM
- Risk: LOW
- Impact: User interface

Files:

- StaffFormModal.vue
- CostLineAdjustmentModal.vue
- CostLineMaterialModal.vue
- CostLineTimeModal.vue

Phase 5: Reports and Utilities

- Priority: LOW
- Risk: LOW
- Impact: Data visualization

Files:

- Reporting components
- Formatting utilities
- KPI components

---

## Validation Strategy (No Unit/Integration Test Suites)

Given the current project phase without automated unit or integration tests, validation will focus on static analysis and guided manual verification.

Static analysis (mandatory)

- TypeScript strict mode: zero errors
- ESLint rules to prevent numeric conversion regressions
- Pattern scanning scripts for parseFloat/parseInt/Number/toString on mapped fields

Guided manual validation (mandatory)

- Component-level checklists executed by developers
- Critical flow exploratory testing:
  - Timesheet entry: create/edit lines, verify wage/bill totals
  - Costing: create/edit cost lines, verify totals and summaries
  - Purchasing: PO lines, received quantities, remaining quantities
- Data parity spot checks:
  - Before/after comparison for several realistic scenarios
  - Cross-check displayed totals vs. hand calculations
- Staging UAT sign-off for:
  - Timesheet daily workflow
  - Job costing overview (estimate/actual)
  - Purchase order receive flow

Performance sampling (optional but recommended)

- Manual timing (devtools Performance) on heavy grids pre/post migration
- Target: no degradation; modest improvement is a plus

Documentation

- Each migrated file annotated in the migration checklist with:
  - Conversions removed
  - Scenarios manually tested
  - Known limitations (if any)

Note: This strategy aligns with docs/12-testing-protocols.md indicating automated tests are not yet required at this stage.

---

## Risks and Mitigations

High Risk: Financial calculation breakage

- Impact: Incorrect values in timesheet/costing
- Probability: Medium
- Mitigation:
  - File-level manual checklists on critical calculations
  - Data parity spot checks with sample datasets
  - Ready rollback plan per phase

Medium Risk: Legacy API incompatibility

- Impact: Backend communication failures
- Probability: Low
- Mitigation:
  - Backend coordination
  - OpenAPI schema validation
  - Type-only compile checks across service layer

Low Risk: UI formatting issues

- Impact: Incorrect value display
- Probability: Low
- Mitigation:
  - Keep formatting utilities isolated
  - Visual spot checks on currency/number formatting

Rollback plan

1. Problem detection
   - Console error monitoring and Sentry/console logs in staging
   - Visual checks on totals in critical views
2. Rapid rollback
   - Git revert to previous commit for the specific phase
   - Automated deploy
   - Post-rollback validation (open critical screens, check totals)

---

## Tools and Automation

Migration scripts

```bash
# Identify remaining conversions
npm run audit:numeric-conversions

# Validate types after migration
npm run validate:numeric-types
```

Linting rules (examples)

```typescript
// ESLint rules to prevent regressions (illustrative)
"no-unnecessary-type-conversion": "error"
"prefer-native-numeric": "warn"
```

Automated checks (CI-friendly)

- Pre-commit hooks for type checks and conversion audits
- CI checks for unnecessary conversion patterns
- No dependence on unit/integration test runners

---

## Success Metrics

Technical metrics

- Conversion reduction: ≥ 95% of identified unnecessary conversions eliminated
- Type safety: 0 TypeScript errors; no any casts introduced for numeric fields
- Lint cleanliness: 0 lint errors related to numeric conversion rules
- Performance: No degradation observed in heavy calculation paths (manual sampling OK)

Quality metrics

- Zero functional regressions in critical flows based on manual checklists
- 100% compatibility with backend numeric schemas
- Maintainability: Clearer, more readable code (reduced parsing/serialization noise)

Business metrics

- Zero downtime during phased rollout
- Maintained accuracy in financial calculations (validated by spot checks)
- Unchanged or improved user experience

---

## Acceptance Criteria

Functional

- [ ] All 96 mapped fields migrated to native numeric types where applicable
- [ ] Zero unnecessary conversions in CRUD operations for migrated areas
- [ ] Financial calculations retain accuracy (manual spot checks passed)
- [ ] APIs function with native numeric values (no string casts)

Technical

- [ ] 0 TypeScript errors (strict mode)
- [ ] ESLint: no errors related to numeric conversion rules
- [ ] No new fallbacks or any casts added to bypass typing
- [ ] Conversion audit scripts report no offending patterns in migrated files

Quality and process

- [ ] Code review approved
- [ ] Manual validation checklists completed for each migrated file
- [ ] Documentation updated (changelogs, notes, guides)
- [ ] Staging UAT sign-off for timesheet and costing flows

---

Last Update: 2025-08-11
