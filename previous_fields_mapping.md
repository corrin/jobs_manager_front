┌─────────┬────────────────────────────────┬─────────────────────────────────┬─────────────────────────────────────────────────────────────────────────────────────┐
│ (index) │ field │ pattern │ path │
├─────────┼────────────────────────────────┼─────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────┤
│ 0 │ 'time_markup' │ '^-?\\d{0,3}(?:\\.\\d{0,2})?$'  │ 'components.schemas.CompanyDefaults.properties.time_markup'                         │
│ 1       │ 'materials_markup'             │ '^-?\\d{0,3}(?:\\.\\d{0,2})?$' │ 'components.schemas.CompanyDefaults.properties.materials_markup' │
│ 2 │ 'charge_out_rate' │ '^-?\\d{0,4}(?:\\.\\d{0,2})?$'  │ 'components.schemas.CompanyDefaults.properties.charge_out_rate'                     │
│ 3       │ 'wage_rate'                    │ '^-?\\d{0,4}(?:\\.\\d{0,2})?$' │ 'components.schemas.CompanyDefaults.properties.wage_rate' │
│ 4 │ 'billable_threshold_green' │ '^-?\\d{0,3}(?:\\.\\d{0,2})?$'  │ 'components.schemas.CompanyDefaults.properties.billable_threshold_green'            │
│ 5       │ 'billable_threshold_amber'     │ '^-?\\d{0,3}(?:\\.\\d{0,2})?$' │ 'components.schemas.CompanyDefaults.properties.billable_threshold_amber' │
│ 6 │ 'daily_gp_target' │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$'  │ 'components.schemas.CompanyDefaults.properties.daily_gp_target'                     │
│ 7       │ 'shop_hours_target_percentage' │ '^-?\\d{0,3}(?:\\.\\d{0,2})?$' │ 'components.schemas.CompanyDefaults.properties.shop_hours_target_percentage' │
│ 8 │ 'quantity' │ '^-?\\d{0,7}(?:\\.\\d{0,3})?$'  │ 'components.schemas.CostLine.properties.quantity'                                   │
│ 9       │ 'unit_cost'                    │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$' │ 'components.schemas.CostLine.properties.unit_cost' │
│ 10 │ 'unit_rev' │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$'  │ 'components.schemas.CostLine.properties.unit_rev'                                   │
│ 11      │ 'quantity'                     │ '^-?\\d{0,7}(?:\\.\\d{0,3})?$' │ 'components.schemas.CostLineCreateUpdate.properties.quantity' │
│ 12 │ 'unit_cost' │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$'  │ 'components.schemas.CostLineCreateUpdate.properties.unit_cost'                      │
│ 13      │ 'unit_rev'                     │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$' │ 'components.schemas.CostLineCreateUpdate.properties.unit_rev' │
│ 14 │ 'quantity' │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$'  │ 'components.schemas.DeliveryReceiptAllocation.properties.quantity'                  │
│ 15      │ 'total_received'               │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$' │ 'components.schemas.DeliveryReceiptLine.properties.total_received' │
│ 16 │ 'duration' │ '^-?\\d{0,13}(?:\\.\\d{0,2})?$' │ 'components.schemas.DjangoJobExecution.properties.duration'                         │
│ 17      │ 'quantity'                     │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$' │ 'components.schemas.DraftLine.properties.quantity' │
│ 18 │ 'unit_cost' │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$'  │ 'components.schemas.DraftLine.properties.unit_cost'                                 │
│ 19      │ 'unit_rev'                     │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$' │ 'components.schemas.DraftLine.properties.unit_rev' │
│ 20 │ 'total_cost' │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$'  │ 'components.schemas.DraftLine.properties.total_cost'                                │
│ 21      │ 'total_rev'                    │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$' │ 'components.schemas.DraftLine.properties.total_rev' │
│ 22 │ 'total_hours' │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$'  │ 'components.schemas.IMSWeeklyStaffData.properties.total_hours'                      │
│ 23      │ 'total_billable_hours'         │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$' │ 'components.schemas.IMSWeeklyStaffData.properties.total_billable_hours' │
│ 24 │ 'billable_percentage' │ '^-?\\d{0,3}(?:\\.\\d{0,2})?$'  │ 'components.schemas.IMSWeeklyStaffData.properties.billable_percentage'              │
│ 25      │ 'total_standard_hours'         │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$' │ 'components.schemas.IMSWeeklyStaffData.properties.total_standard_hours' │
│ 26 │ 'total_time_and_half_hours' │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$'  │ 'components.schemas.IMSWeeklyStaffData.properties.total_time_and_half_hours'        │
│ 27      │ 'total_double_time_hours'      │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$' │ 'components.schemas.IMSWeeklyStaffData.properties.total_double_time_hours' │
│ 28 │ 'total_overtime' │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$'  │ 'components.schemas.IMSWeeklyStaffData.properties.total_overtime'                   │
│ 29      │ 'hours'                        │ '^-?\\d{0,3}(?:\\.\\d{0,2})?$' │ 'components.schemas.IMSWeeklyStaffDataWeeklyHours.properties.hours' │
│ 30 │ 'billable_hours' │ '^-?\\d{0,3}(?:\\.\\d{0,2})?$'  │ 'components.schemas.IMSWeeklyStaffDataWeeklyHours.properties.billable_hours'        │
│ 31      │ 'scheduled_hours'              │ '^-?\\d{0,3}(?:\\.\\d{0,2})?$' │ 'components.schemas.IMSWeeklyStaffDataWeeklyHours.properties.scheduled_hours' │
│ 32 │ 'standard_hours' │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$'  │ 'components.schemas.IMSWeeklyStaffDataWeeklyHours.properties.standard_hours'        │
│ 33      │ 'time_and_half_hours'          │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$' │ 'components.schemas.IMSWeeklyStaffDataWeeklyHours.properties.time_and_half_hours' │
│ 34 │ 'double_time_hours' │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$'  │ 'components.schemas.IMSWeeklyStaffDataWeeklyHours.properties.double_time_hours'     │
│ 35      │ 'unpaid_hours'                 │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$' │ 'components.schemas.IMSWeeklyStaffDataWeeklyHours.properties.unpaid_hours' │
│ 36 │ 'overtime' │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$'  │ 'components.schemas.IMSWeeklyStaffDataWeeklyHours.properties.overtime'              │
│ 37      │ 'leave_hours'                  │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$' │ 'components.schemas.IMSWeeklyStaffDataWeeklyHours.properties.leave_hours' │
│ 38 │ 'charge_out_rate' │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$'  │ 'components.schemas.Job.properties.charge_out_rate'                                 │
│ 39      │ 'total_estimated_profit'       │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$' │ 'components.schemas.JobMetrics.properties.total_estimated_profit' │
│ 40 │ 'total_actual_profit' │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$'  │ 'components.schemas.JobMetrics.properties.total_actual_profit'                      │
│ 41      │ 'total_profit'                 │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$' │ 'components.schemas.JobMetrics.properties.total_profit' │
│ 42 │ 'wageRate' │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$'  │ 'components.schemas.ModernStaff.properties.wageRate'                                │
│ 43      │ 'charge_out_rate'              │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$' │ 'components.schemas.ModernTimesheetJob.properties.charge_out_rate' │
│ 44 │ 'time_markup' │ '^-?\\d{0,3}(?:\\.\\d{0,2})?$'  │ 'components.schemas.PatchedCompanyDefaults.properties.time_markup'                  │
│ 45      │ 'materials_markup'             │ '^-?\\d{0,3}(?:\\.\\d{0,2})?$' │ 'components.schemas.PatchedCompanyDefaults.properties.materials_markup' │
│ 46 │ 'charge_out_rate' │ '^-?\\d{0,4}(?:\\.\\d{0,2})?$'  │ 'components.schemas.PatchedCompanyDefaults.properties.charge_out_rate'              │
│ 47      │ 'wage_rate'                    │ '^-?\\d{0,4}(?:\\.\\d{0,2})?$' │ 'components.schemas.PatchedCompanyDefaults.properties.wage_rate' │
│ 48 │ 'billable_threshold_green' │ '^-?\\d{0,3}(?:\\.\\d{0,2})?$'  │ 'components.schemas.PatchedCompanyDefaults.properties.billable_threshold_green'     │
│ 49      │ 'billable_threshold_amber'     │ '^-?\\d{0,3}(?:\\.\\d{0,2})?$' │ 'components.schemas.PatchedCompanyDefaults.properties.billable_threshold_amber' │
│ 50 │ 'daily_gp_target' │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$'  │ 'components.schemas.PatchedCompanyDefaults.properties.daily_gp_target'              │
│ 51      │ 'shop_hours_target_percentage' │ '^-?\\d{0,3}(?:\\.\\d{0,2})?$' │ 'components.schemas.PatchedCompanyDefaults.properties.shop_hours_target_percentage' │
│ 52 │ 'quantity' │ '^-?\\d{0,7}(?:\\.\\d{0,3})?$'  │ 'components.schemas.PatchedCostLineCreateUpdate.properties.quantity'                │
│ 53      │ 'unit_cost'                    │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$' │ 'components.schemas.PatchedCostLineCreateUpdate.properties.unit_cost' │
│ 54 │ 'unit_rev' │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$'  │ 'components.schemas.PatchedCostLineCreateUpdate.properties.unit_rev'                │
│ 55      │ 'wage_rate'                    │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$' │ 'components.schemas.PatchedStaff.properties.wage_rate' │
│ 56 │ 'hours_mon' │ '^-?\\d{0,2}(?:\\.\\d{0,2})?$'  │ 'components.schemas.PatchedStaff.properties.hours_mon'                              │
│ 57      │ 'hours_tue'                    │ '^-?\\d{0,2}(?:\\.\\d{0,2})?$' │ 'components.schemas.PatchedStaff.properties.hours_tue' │
│ 58 │ 'hours_wed' │ '^-?\\d{0,2}(?:\\.\\d{0,2})?$'  │ 'components.schemas.PatchedStaff.properties.hours_wed'                              │
│ 59      │ 'hours_thu'                    │ '^-?\\d{0,2}(?:\\.\\d{0,2})?$' │ 'components.schemas.PatchedStaff.properties.hours_thu' │
│ 60 │ 'hours_fri' │ '^-?\\d{0,2}(?:\\.\\d{0,2})?$'  │ 'components.schemas.PatchedStaff.properties.hours_fri'                              │
│ 61      │ 'hours_sat'                    │ '^-?\\d{0,2}(?:\\.\\d{0,2})?$' │ 'components.schemas.PatchedStaff.properties.hours_sat' │
│ 62 │ 'hours_sun' │ '^-?\\d{0,2}(?:\\.\\d{0,2})?$'  │ 'components.schemas.PatchedStaff.properties.hours_sun'                              │
│ 63      │ 'quantity'                     │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$' │ 'components.schemas.PurchaseOrderLine.properties.quantity' │
│ 64 │ 'received_quantity' │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$'  │ 'components.schemas.PurchaseOrderLine.properties.received_quantity'                 │
│ 65      │ 'unit_cost'                    │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$' │ 'components.schemas.PurchaseOrderLine.properties.unit_cost' │
│ 66 │ 'quantity' │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$'  │ 'components.schemas.PurchaseOrderLineCreate.properties.quantity'                    │
│ 67      │ 'unit_cost'                    │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$' │ 'components.schemas.PurchaseOrderLineCreate.properties.unit_cost' │
│ 68 │ 'quantity' │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$'  │ 'components.schemas.PurchaseOrderLineUpdate.properties.quantity'                    │
│ 69      │ 'unit_cost'                    │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$' │ 'components.schemas.PurchaseOrderLineUpdate.properties.unit_cost' │
│ 70 │ 'wage_rate' │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$'  │ 'components.schemas.Staff.properties.wage_rate'                                     │
│ 71      │ 'hours_mon'                    │ '^-?\\d{0,2}(?:\\.\\d{0,2})?$' │ 'components.schemas.Staff.properties.hours_mon' │
│ 72 │ 'hours_tue' │ '^-?\\d{0,2}(?:\\.\\d{0,2})?$'  │ 'components.schemas.Staff.properties.hours_tue'                                     │
│ 73      │ 'hours_wed'                    │ '^-?\\d{0,2}(?:\\.\\d{0,2})?$' │ 'components.schemas.Staff.properties.hours_wed' │
│ 74 │ 'hours_thu' │ '^-?\\d{0,2}(?:\\.\\d{0,2})?$'  │ 'components.schemas.Staff.properties.hours_thu'                                     │
│ 75      │ 'hours_fri'                    │ '^-?\\d{0,2}(?:\\.\\d{0,2})?$' │ 'components.schemas.Staff.properties.hours_fri' │
│ 76 │ 'hours_sat' │ '^-?\\d{0,2}(?:\\.\\d{0,2})?$'  │ 'components.schemas.Staff.properties.hours_sat'                                     │
│ 77      │ 'hours_sun'                    │ '^-?\\d{0,2}(?:\\.\\d{0,2})?$' │ 'components.schemas.Staff.properties.hours_sun' │
│ 78 │ 'quantity' │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$'  │ 'components.schemas.StockConsumeRequest.properties.quantity'                        │
│ 79      │ 'unit_cost'                    │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$' │ 'components.schemas.StockConsumeRequest.properties.unit_cost' │
│ 80 │ 'unit_rev' │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$'  │ 'components.schemas.StockConsumeRequest.properties.unit_rev'                        │
│ 81      │ 'remaining_quantity'           │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$' │ 'components.schemas.StockConsumeResponse.properties.remaining_quantity' │
│ 82 │ 'quantity' │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$'  │ 'components.schemas.StockCreate.properties.quantity'                                │
│ 83      │ 'unit_cost'                    │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$' │ 'components.schemas.StockCreate.properties.unit_cost' │
│ 84 │ 'quantity' │ '^-?\\d{0,7}(?:\\.\\d{0,3})?$'  │ 'components.schemas.TimesheetCostLine.properties.quantity'                          │
│ 85      │ 'unit_cost'                    │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$' │ 'components.schemas.TimesheetCostLine.properties.unit_cost' │
│ 86 │ 'unit_rev' │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$'  │ 'components.schemas.TimesheetCostLine.properties.unit_rev'                          │
│ 87      │ 'charge_out_rate'              │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$' │ 'components.schemas.TimesheetCostLine.properties.charge_out_rate' │
│ 88 │ 'total_hours' │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$'  │ 'components.schemas.WeeklyStaffData.properties.total_hours'                         │
│ 89      │ 'total_billable_hours'         │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$' │ 'components.schemas.WeeklyStaffData.properties.total_billable_hours' │
│ 90 │ 'billable_percentage' │ '^-?\\d{0,3}(?:\\.\\d{0,2})?$'  │ 'components.schemas.WeeklyStaffData.properties.billable_percentage'                 │
│ 91      │ 'hours'                        │ '^-?\\d{0,3}(?:\\.\\d{0,2})?$' │ 'components.schemas.WeeklyStaffDataWeeklyHours.properties.hours' │
│ 92 │ 'billable_hours' │ '^-?\\d{0,3}(?:\\.\\d{0,2})?$'  │ 'components.schemas.WeeklyStaffDataWeeklyHours.properties.billable_hours'           │
│ 93      │ 'scheduled_hours'              │ '^-?\\d{0,3}(?:\\.\\d{0,2})?$' │ 'components.schemas.WeeklyStaffDataWeeklyHours.properties.scheduled_hours' │
│ 94 │ 'total_hours' │ '^-?\\d{0,8}(?:\\.\\d{0,2})?$'  │ 'components.schemas.WeeklySummary.properties.total_hours'                           │
│ 95      │ 'billable_percentage'          │ '^-?\\d{0,3}(?:\\.\\d{0,2})?$' │ 'components.schemas.WeeklySummary.properties.billable_percentage' │
└─────────┴────────────────────────────────┴─────────────────────────────────┴─────────────────────────────────────────────────────────────────────────────────────┘

Unique regex patterns found:
^-?\d{0,3}(?:\.\d{0,2})?$
^-?\d{0,4}(?:\.\d{0,2})?$
^-?\d{0,8}(?:\.\d{0,2})?$
^-?\d{0,7}(?:\.\d{0,3})?$
^-?\d{0,13}(?:\.\d{0,2})?$
^-?\d{0,2}(?:\.\d{0,2})?$
