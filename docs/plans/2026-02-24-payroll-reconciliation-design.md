# Payroll Reconciliation Report — Design

## Purpose

Compare what Xero says we paid staff vs what JM recorded in timesheets. Surface where JM is wrong so we can fix it.

## API

`GET /accounting/api/reports/payroll-reconciliation/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`

Backend must return a typed response schema (not `additionalProperties: {}`). Frontend types come from generated schema only.

## Page Structure

### 1. Header

- Title: "Payroll Reconciliation"
- Date range: start_date + end_date inputs
- Presets: This FY, Last FY, Last 30 Weeks
- Refresh button

### 2. Summary Row

Three cards:

- **Xero Total** — total gross pay from Xero pay runs
- **JM Total** — total cost from JM timesheets
- **Difference** — gap in $ and %

### 3. Heatmap Grid

- **Columns** = staff members (one per column)
- **Rows** = pay run weeks (date-labeled, one per row)
- **Cells** = dollar difference between Xero and JM for that person+week
  - Color: green = match (zero/near-zero), red intensity scales with gap size
  - Null/absent = gray or empty
- **Extra columns** at end for staff who are "JM only" (tracked in JM, not paid in Xero)
- **Extra rows** at bottom for pay runs that are "Xero only" (Xero pays, JM has no record)
- **Hover tooltip** on each cell showing: Xero hours, JM hours, Xero gross, JM cost, hours_cost_impact, rate_cost_impact

## Interaction

- No drill-down panels needed for now
- Tooltip/popover on cell hover for detail breakdown
- Export CSV button for the full dataset

## Data Flow

- Single API call per load
- Service function fetches typed data
- View manages loading/error/data states directly (no Pinia store — read-only report)

## Files

- `src/views/PayrollReconciliationReportView.vue` — the page
- `src/services/payroll-reconciliation-report.service.ts` — API call + export
- Route entry in `src/router/index.ts`

## Layout Approach

Dashboard style: summary cards at top, heatmap below occupying the main viewport. Follows existing report patterns (AppLayout wrapper, same header/filter style).

## Blocked On

- Backend must add typed response serializer to the endpoint (currently returns untyped `object`)
- Backend must add `start_date` and `end_date` query parameters to the OpenAPI spec
