# Numeric Conversions Report - Mon Aug 11 17:53:22 -03 2025

## parseFloat() Occurrences

src/components/job/JobAttachmentsModal.vue:555: return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
src/components/job/JobPricingGrids.vue:223: return total + (parseFloat(String(typedEntry.revenue)) || 0)
src/components/job/JobPricingGrids.vue:231: return total + parseFloat(String(typedEntry.price_adjustment) || '0')
src/components/job/JobPricingGrids.vue:235: return total + parseFloat(String(typedEntry.retail_price) || '0')
src/components/job/JobPricingGrids.vue:238: return total + parseFloat(String(typedEntry.value_of_time) || '0')
src/components/job/JobQuoteTab.vue:478: return rate ? parseFloat(rate) : 0
src/components/job/JobQuoteTab.vue:482: return rate ? parseFloat(rate) : 0
src/components/job/JobQuoteTab.vue:486: return markup ? parseFloat(markup) : 0
src/components/job/SimpleTotalTable.vue:45: const numericValue = parseFloat(inputValue.value)
src/components/job/StockConsumptionModal.vue:63: ? parseFloat(selectedStock.quantity)
src/components/job/StockConsumptionModal.vue:76: ? parseFloat(selectedStock.quantity)
src/components/job/StockConsumptionModal.vue:83: ? parseFloat(selectedStock.quantity)
src/components/job/StockConsumptionModal.vue:187: ? parseFloat(selectedStock.value.quantity)
src/components/job/StockConsumptionModal.vue:231: const quantity = typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity
src/components/job/StockConsumptionModal.vue:333: ? parseFloat(selectedStock.value.quantity)
src/components/purchasing/PendingItemsTable.vue:90: const quantity = parseFloat(row.original.quantity) || 0
src/components/purchasing/PendingItemsTable.vue:91: const receivedQuantity = parseFloat(row.original.received_quantity || '0') || 0
src/components/purchasing/PendingItemsTable.vue:100: const unitCost = row.original.unit_cost ? parseFloat(row.original.unit_cost) : null
src/components/purchasing/ReceivedItemsTable.vue:202: const stockAllocation = parseFloat(row.original.total_received) - 0
src/components/purchasing/ReceivedItemsTable.vue:208: ? parseFloat(row.original.total_received)
src/components/shared/CostLinesGrid.vue:216: const num = typeof value === 'string' ? parseFloat(value) || 0 : value || 0
src/components/shared/CostLinesGrid.vue:224: const num = typeof value === 'string' ? parseFloat(value) || 0 : value || 0
src/components/shared/CostLinesGrid.vue:235: const qty = typeof quantity === 'string' ? parseFloat(quantity) || 0 : quantity || 0
src/components/shared/CostLinesGrid.vue:236: const prc = typeof price === 'string' ? parseFloat(price) || 0 : price || 0
src/components/shared/CostSetSummaryCard.vue:198: return typeof value === 'string' ? parseFloat(value) || 0 : value || 0
src/components/StaffFormModal.vue:375: wage_rate: staff.wage_rate ? parseFloat(staff.wage_rate) : 0,
src/components/StaffFormModal.vue:378: hours_mon: staff.hours_mon ? parseFloat(staff.hours_mon) : 0,
src/components/StaffFormModal.vue:379: hours_tue: staff.hours_tue ? parseFloat(staff.hours_tue) : 0,
src/components/StaffFormModal.vue:380: hours_wed: staff.hours_wed ? parseFloat(staff.hours_wed) : 0,
src/components/StaffFormModal.vue:381: hours_thu: staff.hours_thu ? parseFloat(staff.hours_thu) : 0,
src/components/StaffFormModal.vue:382: hours_fri: staff.hours_fri ? parseFloat(staff.hours_fri) : 0,
src/components/StaffFormModal.vue:383: hours_sat: staff.hours_sat ? parseFloat(staff.hours_sat) : 0,
src/components/StaffFormModal.vue:384: hours_sun: staff.hours_sun ? parseFloat(staff.hours_sun) : 0,
src/components/timesheet/BillablePercentageBadge.vue:22: typeof props.percentage === 'string' ? parseFloat(props.percentage) : props.percentage
src/services/timesheet.service.ts:22: defaultWageRate = parseFloat(defaults.wage_rate || '32') || 32
src/services/timesheet.service.ts:47: parseFloat(String(staff.wageRate || staff.wage_rate || defaultWageRate)) ||
src/types/timesheet.types.ts:64: const parsed = parseFloat(rateValue)
src/utils/string-formatting.ts:39: return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
src/views/JobCreateView.vue:285: const sanitizedValue = parseFloat(target.value)
src/views/JobCreateView.vue:295: const sanitizedValue = parseFloat(target.value)
src/views/purchasing/CreateFromQuoteView.vue:156: return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
src/views/purchasing/StockView.vue:309: const numValue = typeof value === 'string' ? parseFloat(value) : value
src/views/purchasing/StockView.vue:314: const numValue = typeof value === 'string' ? parseFloat(value) : value
src/views/purchasing/StockView.vue:320: typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity
src/views/purchasing/StockView.vue:321: const unitCost = typeof item.unit_cost === 'string' ? parseFloat(item.unit_cost) : item.unit_cost

## parseInt() Occurrences

src/components/kpi/MonthSelector.vue:101: emit('update:year', parseInt(year))
src/components/kpi/MonthSelector.vue:102: emit('update:month', parseInt(month))
src/components/StaffFormModal.vue:499: .map((g) => parseInt(g.trim()))
src/components/StaffFormModal.vue:506: .map((p) => parseInt(p.trim()))
src/services/job.service.ts:112: params: { job_number: parseInt(jobNumber) },
src/views/TimesheetEntryView.vue:572: const year = parseInt(parts[0], 10)
src/views/TimesheetEntryView.vue:573: const month = parseInt(parts[1], 10) - 1
src/views/TimesheetEntryView.vue:574: const day = parseInt(parts[2], 10)
src/views/TimesheetEntryView.vue:636: const year = parseInt(parts[0], 10)
src/views/TimesheetEntryView.vue:637: const month = parseInt(parts[1], 10) - 1
src/views/TimesheetEntryView.vue:638: const day = parseInt(parts[2], 10)
src/views/TimesheetEntryView.vue:654: const year = parseInt(parts[0], 10)
src/views/TimesheetEntryView.vue:655: const month = parseInt(parts[1], 10) - 1
src/views/TimesheetEntryView.vue:656: const day = parseInt(parts[2], 10)
src/views/TimesheetEntryView.vue:780: const jobNumber = parseInt(entry.jobNumber, 10)

## Number() Occurrences

src/components/job/CostLineAdjustmentModal.vue:182: const cost = Number(formData.value.unit_cost) || 0
src/components/job/CostLineAdjustmentModal.vue:183: const markup = Number(companyDefaultsStore.companyDefaults?.materials_markup || 0)
src/components/job/CostLineAdjustmentModal.vue:189: return Number((cost _ (1 + markup)).toFixed(2))
src/components/job/CostLineAdjustmentModal.vue:207: formData.value.unit_cost = Number(input)
src/components/job/CostLineAdjustmentModal.vue:217: formData.value.unit_rev = Number(input)
src/components/job/CostLineAdjustmentModal.vue:282: quantity: Number(props.initial.quantity) || 1,
src/components/job/CostLineAdjustmentModal.vue:283: unit_cost: Number(props.initial.unit_cost) || 0,
src/components/job/CostLineAdjustmentModal.vue:284: unit_rev: Number(props.initial.unit_rev) || 0,
src/components/job/CostLineMaterialModal.vue:166: const cost = Number(form.value.unitCost) || 0
src/components/job/CostLineMaterialModal.vue:173: return Number((cost _ (1 + markup)).toFixed(2))
src/components/job/CostLineMaterialModal.vue:192: form.value.unitCost = Number(input)
src/components/job/CostLineMaterialModal.vue:202: form.value.unitRevenue = Number(input)
src/components/job/CostLineTimeModal.vue:131: form.value.hours = Number(input)
src/components/job/JobActualTab.vue:130: {{ formatNumber(line.quantity) }}
src/components/job/JobActualTab.vue:333:function formatNumber(value: number | string | undefined): string {
src/components/job/JobCostAnalysisTab.vue:98: <td class="py-2 px-4 text-center">{{ formatNumber(estimate.hours) }}</td>
src/components/job/JobCostAnalysisTab.vue:100: {{ formatNumber(quote.hours) }}
src/components/job/JobCostAnalysisTab.vue:104: {{ formatNumber(actual.hours) }}
src/components/job/JobCostAnalysisTab.vue:225: const quantity = typeof line.quantity === 'string' ? Number(line.quantity) : line.quantity
src/components/job/JobCostAnalysisTab.vue:226: const lineCost = quantity _ Number(line.unit_cost)
src/components/job/JobCostAnalysisTab.vue:227: const lineRev = quantity _ Number(line.unit_rev)
src/components/job/JobCostAnalysisTab.vue:346:function formatNumber(value: number): string {
src/components/job/JobFinancialTab.vue:337: const numericAmount = Number(amount)
src/components/job/JobPricingGrids.vue:172: const numericAmount = Number(amount)
src/components/job/JobPricingGrids.vue:227: return total + Number(typedEntry.quantity) \* Number(typedEntry.unit_revenue)
src/components/job/JobQuoteTab.vue:286: {{ formatNumber(revision.summary.hours) }}h
src/components/job/JobQuoteTab.vue:322: <span class="font-medium">{{ formatNumber(line.quantity) }}</span>
src/components/job/JobQuoteTab.vue:819:function formatNumber(value: number): string {
src/components/job/StockConsumptionModal.vue:39: formatCurrency(Number(item.unit_cost))
src/components/job/StockConsumptionModal.vue:276: const unitCostValue = Number(item.unit_cost) || 0
src/components/job/StockConsumptionModal.vue:280: const markup = Number(companyDefaultsStore.companyDefaults?.materials_markup || 0)
src/components/job/StockConsumptionModal.vue:309: const cost = Number(newCost) || 0
src/components/job/StockConsumptionModal.vue:310: const markup = Number(companyDefaultsStore.companyDefaults?.materials_markup || 0)
src/components/purchasing/DeliveryReceiptLinesTable.vue:198: h('span', { class: 'font-bold' }, Number(line.quantity) || 0),
src/components/purchasing/DeliveryReceiptLinesTable.vue:203: h('span', {}, Number(line.received_quantity) || 0),
src/components/purchasing/PoLinesTable.vue:212: const num = Number(val)
src/components/purchasing/PoLinesTable.vue:237: const cost = val === '' ? null : Number(val)
src/components/purchasing/PoLinesTable.vue:252: (row.original.unit_cost !== null && Number(row.original.unit_cost) > 0) || props.readOnly,
src/components/purchasing/ReceivedItemsTable.vue:135: const num = Number(val)
src/components/purchasing/ReceivedItemsTable.vue:197: const num = Number(val)
src/components/purchasing/ReceivedItemsTable.vue:240: const num = Number(val)
src/components/quote/QuoteCostLinesGrid.vue:110: {{ formatNumber(line.quantity) }}
src/components/quote/QuoteCostLinesGrid.vue:149:function formatNumber(value: number): string {
src/components/quote/QuoteSummaryCard.vue:129: {{ formatNumber(quoteData.summary.hours) }} hrs
src/components/quote/QuoteSummaryCard.vue:576:function formatNumber(value: number): string {
src/components/shared/CostLinesGrid.vue:121: {{ formatNumber(line.quantity)
src/components/shared/CostLinesGrid.vue:215:function formatNumber(value: string | number | undefined): string {
src/components/shared/CostSetSummaryCard.vue:105:                >{{ formatNumber(typedSummary.hours) }} hrs</span
src/components/shared/CostSetSummaryCard.vue:207: const quantity = parseNumber(line.quantity)
src/components/shared/CostSetSummaryCard.vue:208: const unitCost = parseNumber(line.unit_cost)
src/components/shared/CostSetSummaryCard.vue:209: const unitRev = parseNumber(line.unit_rev)
src/components/shared/CostSetSummaryCard.vue:222: const quantity = parseNumber(line.quantity)
src/components/shared/CostSetSummaryCard.vue:223: const unitCost = parseNumber(line.unit_cost)
src/components/shared/CostSetSummaryCard.vue:224: const unitRev = parseNumber(line.unit_rev)
src/components/shared/CostSetSummaryCard.vue:237: const quantity = parseNumber(line.quantity)
src/components/shared/CostSetSummaryCard.vue:238: const unitCost = parseNumber(line.unit_cost)
src/components/shared/CostSetSummaryCard.vue:239: const unitRev = parseNumber(line.unit_rev)
src/components/shared/CostSetSummaryCard.vue:254:function formatNumber(value: number): string {
src/components/StaffFormModal.vue:456: wage_rate: Number(form.value.wage_rate),
src/components/StaffFormModal.vue:457: hours_mon: Number(form.value.hours_mon),
src/components/StaffFormModal.vue:458: hours_tue: Number(form.value.hours_tue),
src/components/StaffFormModal.vue:459: hours_wed: Number(form.value.hours_wed),
src/components/StaffFormModal.vue:460: hours_thu: Number(form.value.hours_thu),
src/components/StaffFormModal.vue:461: hours_fri: Number(form.value.hours_fri),
src/components/StaffFormModal.vue:462: hours_sat: Number(form.value.hours_sat),
src/components/StaffFormModal.vue:463: hours_sun: Number(form.value.hours_sun),
src/components/timesheet/WeekPickerModal.vue:151: return getWeekNumber(date)
src/components/timesheet/WeekPickerModal.vue:210:function getWeekNumber(date: Date): number {
src/plugins/ag-grid.ts:35: Number(dateParts[2]),
src/plugins/ag-grid.ts:36: Number(dateParts[1]) - 1,
src/plugins/ag-grid.ts:37: Number(dateParts[0]),
src/plugins/ag-grid.ts:72: return `${Number(params.value).toFixed(2)}h`
src/services/date.service.ts:148: getDayNumber(dateString: string): string {
src/services/date.service.ts:184: number: this.getDayNumber(date),
src/services/date.service.ts:213:export const getDayNumber = (dateString: string) => dateService.getDayNumber(dateString)
src/services/weekly-timesheet.service.ts:82: const numericHours = typeof hours === 'string' ? Number(hours) : hours
src/services/weekly-timesheet.service.ts:98: const numericPercentage = typeof percentage === 'string' ? Number(percentage) : percentage
src/stores/costing.ts:166: return Number(cl.quantity) || 0
src/stores/timesheet.ts:55: return line.kind === 'time' ? sum + Number(line.quantity || 0) : sum
src/stores/timesheet.ts:78: (sum: number, line: CostLine) => sum + Number(line.quantity || 0),
src/stores/timesheet.ts:86: .reduce((sum: number, line: CostLine) => sum + Number(line.quantity || 0), 0),
src/utils/safetyUtils.ts:21:export function getSafeNumber(value: number | undefined, defaultValue: number = 0): number {
src/views/AdminMonthEnd.vue:164: <span class="font-mono text-sm">{{ jobNumber(id) }}</span>
src/views/AdminMonthEnd.vue:268:function jobNumber(id: string) {
src/views/JobCreateView.vue:481: (1 + Number(companyDefaultsStore.companyDefaults?.materials_markup ?? 0))
src/views/JobCreateView.vue:493: unit_cost: Number(companyDefaultsStore.companyDefaults?.wage_rate ?? 0).toFixed(2),
src/views/JobCreateView.vue:494: unit_rev: Number(companyDefaultsStore.companyDefaults?.charge_out_rate ?? 0).toFixed(2),
src/views/purchasing/DeliveryReceiptFormView.vue:354: return purchaseOrder.value.lines.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0)
src/views/purchasing/DeliveryReceiptFormView.vue:360: (sum, line) => sum + (Number(line.received_quantity) || 0),
src/views/purchasing/ItemSelect.vue:45: emit('update:unit_cost', found && found.unit_cost != null ? Number(found.unit_cost) : null)
src/views/purchasing/PurchaseOrderFormView.vue:411: (line.unit_cost != null && Number(line.unit_cost) > 0) ||
src/views/purchasing/PurchaseOrderFormView.vue:454: const hasPrice = (line.unit_cost != null && Number(line.unit_cost) > 0) || line.price_tbc === true
src/views/purchasing/PurchaseOrderFormView.vue:493: (line) => (!line.unit_cost || Number(line.unit_cost) <= 0) && !line.price_tbc,
src/views/WeeklyTimesheetView.vue:266: short: dateService.getDayNumber(d),
src/views/WeeklyTimesheetView.vue:274: short: dateService.getDayNumber(d),

## toString() Occurrences

src/components/job/CostLineAdjustmentModal.vue:254: quantity: formData.value.quantity.toString(),
src/components/job/CostLineAdjustmentModal.vue:255: unit_cost: formData.value.unit_cost.toString(),
src/components/job/CostLineAdjustmentModal.vue:256: unit_rev: unitRevenue.value.toString(),
src/components/job/CostLineAdjustmentModal.vue:268: quantity: formData.value.quantity.toString(),
src/components/job/CostLineAdjustmentModal.vue:269: unit_cost: formData.value.unit_cost.toString(),
src/components/job/CostLineAdjustmentModal.vue:270: unit_rev: unitRevenue.value.toString(),
src/components/job/JobViewTabs.vue:216: jobNumber: props.jobData.job_number.toString(),
src/components/job/SimpleTotalTable.vue:37:const inputValue = ref(props.value.toString())
src/components/job/SimpleTotalTable.vue:48: inputValue.value = props.value.toString()
src/components/job/SimpleTotalTable.vue:60: inputValue.value = newValue.toString()
src/components/JobCard.vue:320: jobId: props.job.id.toString(),
src/components/JobCard.vue:327: jobId: props.job.id.toString(),
src/components/KanbanColumn.vue:42: :is-job-selected-for-movement="isJobSelectedForMovement?.(job.id.toString()) ?? false"
src/components/kpi/MonthSelector.vue:43:const selectedValue = computed(() => `${props.year}-${props.month.toString().padStart(2, '0')}`)
src/components/kpi/MonthSelector.vue:89: const value = `${year}-${month.toString().padStart(2, '0')}`
src/components/purchasing/JobSelect.vue:139: const numberMatch = job.number?.toString().toLowerCase().includes(term)
src/components/purchasing/JobSelect.vue:140: const jobNumberMatch = job.job_number?.toString().toLowerCase().includes(term)
src/components/purchasing/PurchaseOrderJobCellEditor.ts:165: item.dataset.index = index.toString()
src/components/StaffFormModal.vue:482: wage_rate: form.value.wage_rate ? form.value.wage_rate.toString() : '',
src/components/StaffFormModal.vue:487: hours_mon: form.value.hours_mon ? form.value.hours_mon.toString() : '',
src/components/StaffFormModal.vue:488: hours_tue: form.value.hours_tue ? form.value.hours_tue.toString() : '',
src/components/StaffFormModal.vue:489: hours_wed: form.value.hours_wed ? form.value.hours_wed.toString() : '',
src/components/StaffFormModal.vue:490: hours_thu: form.value.hours_thu ? form.value.hours_thu.toString() : '',
src/components/StaffFormModal.vue:491: hours_fri: form.value.hours_fri ? form.value.hours_fri.toString() : '',
src/components/StaffFormModal.vue:492: hours_sat: form.value.hours_sat ? form.value.hours_sat.toString() : '',
src/components/StaffFormModal.vue:493: hours_sun: form.value.hours_sun ? form.value.hours_sun.toString() : '',
src/components/StaffPanel.vue:18: staff.id.toString(),
src/components/StaffPanel.vue:23: @dragstart="handleDragStart(staff.id.toString(), $event)"
src/components/StaffPanel.vue:29:            :is-active="activeFilters.includes(staff.id.toString())"
src/components/StaffPanel.vue:99:  const staffIdString = staffId.toString()
src/components/timesheet/WeeklyMetricsModal.vue:416:      (job as Record<string, number>).job_number.toString().toLowerCase().includes(query) ||
src/components/ui/calendar/Calendar.vue:52:        <CalendarGrid v-for="month in grid" :key="month.value.toString()">
src/components/ui/calendar/Calendar.vue:68:                :key="weekDate.toString()"
src/components/ui/range-calendar/RangeCalendar.vue:51:      <RangeCalendarGrid v-for="month in grid" :key="month.value.toString()">
src/components/ui/range-calendar/RangeCalendar.vue:67:              :key="weekDate.toString()"
src/composables/useKanban.ts:68:    const activeFilterIds = activeStaffFilters.value.map((id) => id.toString())
src/composables/useKanban.ts:71:    const assignedStaffIds = job.people?.map((staff: KanbanJobPerson) => staff.id.toString()) || []
src/composables/useKanban.ts:77:    const createdById = job.created_by_id ? job.created_by_id.toString() : null
src/composables/useKanban.ts:243:        job.job_number.toString().toLowerCase().includes(query) ||
src/composables/useMobileJobMovement.ts:30:    return (jobId: string) => selectedJobForMovement.value?.id.toString() === jobId
src/composables/useMobileJobMovement.ts:57:      await onMoveJob(selectedJobForMovement.value.id.toString(), targetStatus)
src/services/aiProviderService.ts:45:        params: { id: id.toString() },
src/services/aiProviderService.ts:55:      await api.api_workflow_ai_providers_destroy(undefined, { params: { id: id.toString() } })
src/services/aiProviderService.ts:64:      return await api.api_workflow_ai_providers_retrieve({ params: { id: id.toString() } })
src/services/aiProviderService.ts:74:        params: { id: id.toString() },
src/services/costing.service.ts:13:      id: jobId.toString(),
src/services/job-aging-report.service.ts:52:      const queryString = searchParams.toString()
src/services/job.service.ts:301:      formData.append('print_on_jobsheet', printOnJobsheet.toString())
src/services/kpi.service.ts:101:    return Math.round(greenPercentage).toString()
src/services/quote-chat.service.ts:69:      _id: message.id?.toString() || '',
src/services/staff-performance-report.service.ts:28:      const url = `/accounting/api/reports/staff-performance-summary/?${searchParams.toString()}`src/services/staff-performance-report.service.ts:46:      const url =`/accounting/api/reports/staff-performance/${staffId}/?${searchParams.toString()}`
src/stores/costing.ts:60: id: jobId.toString(),
src/stores/stockStore.ts:61: quantity: payload.quantity.toString(),
src/stores/timesheet.ts:153: cost_line_id: id.toString(),
src/stores/timesheet.ts:182: await api.job_rest_cost_lines_delete_destroy({ cost_line_id: id.toString() })
src/stores/timesheet.ts:313: quantity: entryData.hours.toString(),
src/stores/timesheet.ts:314: unit_cost: (entryData.wageRate || 32.0).toString(),
src/stores/timesheet.ts:315: unit_rev: (entryData.chargeOutRate || 105.0).toString(),
src/stores/timesheet.ts:374: if (updates.hours !== undefined) updatePayload.quantity = updates.hours.toString()
src/stores/timesheet.ts:375: if (updates.wageRate !== undefined) updatePayload.unit_cost = updates.wageRate.toString()
src/stores/timesheet.ts:377: updatePayload.unit_rev = updates.chargeOutRate.toString()
src/views/KPIReportsView.vue:436: if (netProfit >= 0) return '+' + Math.round(netProfit).toString()
src/views/KPIReportsView.vue:437: return Math.round(netProfit).toString()
