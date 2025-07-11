# Deprecated Code Report

## Migration Status

This report lists all deprecated code found in the frontend codebase that needs to be migrated to use the new Zodios API client and Zod schemas.

## Summary

| Category | Count |
|----------|-------|
| API calls | 22 |
| Local types/interfaces | 16 |
| Utils | 0 |
| Vue components | 0 |
| **Total** | **38** |

## Deprecated Items

| File | Line | Category | 3-line Snippet | Replace with | ☐ Refactored |
|------|------|----------|----------------|--------------|---------------|
| `src/views/TimesheetEntryView.vue` | 477 | Local types/interfaces | `/** @deprecated Use generated types from src/api/generated instead` <br> ` * This interface will be removed after migration to openapi-zod-client generated types` <br> ` */` | `import { Job } from '@/src/api/generated/api'` | ✅ |
| `src/views/TimesheetEntryView.vue` | 480 | Local types/interfaces | `interface Job {` <br> `  id: string` <br> `  job_number: number` | Use `Job` schema from generated API | ✅ |
| `src/views/TimesheetEntryView.vue` | 499 | Local types/interfaces | `/** @deprecated Use generated types from src/api/generated instead` <br> ` * This interface will be removed after migration to openapi-zod-client generated types` <br> ` */` | `import { Staff } from '@/src/api/generated/api'` | ✅ |
| `src/views/TimesheetEntryView.vue` | 505 | Local types/interfaces | `interface Staff {` <br> `  id: string` <br> `  firstName: string` | Use `Staff` schema from generated API | ✅ |
| `src/views/TimesheetEntryView.vue` | 516 | Local types/interfaces | `/** @deprecated Use generated types from src/api/generated instead` <br> ` * This interface will be removed after migration to openapi-zod-client generated types` <br> ` */` | `import { CompanyDefaults } from '@/src/api/generated/api'` | ✅ |
| `src/views/TimesheetEntryView.vue` | 522 | Local types/interfaces | `interface CompanyDefaults {` <br> `  defaultWageRate: number` <br> `  defaultChargeOutRate: number` | Use `CompanyDefaults` schema from generated API | ✅ |
| `src/views/TimesheetEntryView.vue` | 743 | Local types/interfaces | `/** @deprecated Use generated types from src/api/generated instead` <br> ` * This interface will be removed after migration to openapi-zod-client generated types` <br> ` */` | `import { TimesheetEntryWithMeta } from '@/src/api/local/schemas'` | ✅ |
| `src/views/TimesheetEntryView.vue` | 749 | Local types/interfaces | `interface TimesheetEntryWithMeta {` <br> `  id?: number` <br> `  staff_id: string` | Use `TimesheetEntryWithMeta` schema from generated schemas OR local schemas if it's related to UI control | ✅ |
| `src/views/TimesheetEntryView.vue` | 1037 | Local types/interfaces | `/** @deprecated Use generated types from src/api/generated instead` <br> ` * This interface will be removed after migration to openapi-zod-client generated types` <br> ` */` | `import { CostLine } from '@/src/api/generated/api'` | ✅ |
| `src/views/TimesheetEntryView.vue` | 1043 | Local types/interfaces | `interface BackendCostLine {` <br> `  id: number` <br> `  kind: string` | Use `TimesheetCostLine` schema from generated API | ✅ |
| `src/views/TimesheetEntryView.vue` | 1298 | Local types/interfaces | `/** @deprecated Use generated types from src/api/generated instead` <br> ` * This interface will be removed after migration to openapi-zod-client generated types` <br> ` */` | Remove deprecation comment, keep Window interface | ✅ |
| `src/views/TimesheetEntryView.vue` | 1301 | Local types/interfaces | `interface Window {` <br> `  timesheetJobs?: unknown` <br> `  currentStaff?: unknown` | Remove deprecation comment, keep Window interface | ✅ |
| `src/views/purchasing/PurchaseOrderFormView.vue` | 146 | Local types/interfaces | `/** @deprecated Use generated types from src/api/generated instead` <br> ` * This interface will be removed after migration to openapi-zod-client generated types` <br> ` */` | `import { Status } from '@/src/api/local/schemas'` | ☐ |
| `src/views/purchasing/PurchaseOrderFormView.vue` | 156 | Local types/interfaces | `/** @deprecated Use generated types from src/api/generated instead` <br> ` * This interface will be removed after migration to openapi-zod-client generated types` <br> ` */` | `import { PurchaseOrderLine } from '@/src/api/local/schemas'` | ☐ |
| `src/views/purchasing/PurchaseOrderFormView.vue` | 162 | Local types/interfaces | `interface PurchaseOrderLine {` <br> `  id?: string` <br> `  item_code: string` | Use `PurchaseOrderLine` schema from generated schemas OR local schemas if it's related to UI control | ☐ |
| `src/views/purchasing/PurchaseOrderFormView.vue` | 179 | Local types/interfaces | `/** @deprecated Use generated types from src/api/generated instead` <br> ` * This interface will be removed after migration to openapi-zod-client generated types` <br> ` */` | `import { PurchaseOrder } from '@/src/api/local/schemas'` | ☐ |
| `src/views/purchasing/PurchaseOrderFormView.vue` | 185 | Local types/interfaces | `interface PurchaseOrder {` <br> `  po_number: string` <br> `  supplier: string` | Use `PurchaseOrder` schema from generated schemas OR local schemas if it's related to UI control | ☐ |
| `src/views/purchasing/PurchaseOrderFormView.vue` | 201 | Local types/interfaces | `/** @deprecated Use generated types from src/api/generated instead` <br> ` * This interface will be removed after migration to openapi-zod-client generated types` <br> ` */` | `import { XeroSyncResponse } from '@/src/api/local/schemas'` | ☐ |
| `src/views/purchasing/PurchaseOrderFormView.vue` | 207 | Local types/interfaces | `interface XeroSyncResponse {` <br> `  success: boolean` <br> `  error?: string` | Use `XeroSyncResponse` schema from generated schemas OR local schemas if it's related to UI control | ☐ |
| `src/views/purchasing/PurchaseOrderFormView.vue` | 230 | Local types/interfaces | `/** @deprecated Use generated types from src/api/generated instead` <br> ` * This interface will be removed after migration to openapi-zod-client generated types` <br> ` */` | `import { Job } from '@/src/api/local/schemas'` | ☐ |
| `src/views/purchasing/PurchaseOrderFormView.vue` | 236 | Local types/interfaces | `interface Job {` <br> `  id: string` <br> `  job_number: string` | Use `Job` schema from generated schemas OR local schemas if it's related to UI control | ☐ |
| `src/views/purchasing/PurchaseOrderFormView.vue` | 282 | API calls | `const response = await axios.get('/purchasing/rest/jobs/')` <br> `debugLog('📊 Raw response:', response)` <br> `const rawJobs = response.data || []` | `api.getPurchasingJobs()` | ☐ |
| `src/views/purchasing/PurchaseOrderFormView.vue` | 653 | API calls | `const { data: res } = await axios.post<XeroSyncResponse>(` <br> `  '/purchasing/rest/purchase-order/sync-to-xero/',` <br> `  { po_id: orderId }` | `api.syncPurchaseOrderToXero({ po_id: orderId })` | ☐ |
| `src/views/purchasing/PoCreateView.vue` | 37 | Local types/interfaces | `/** @deprecated Use generated types from src/api/generated instead` <br> ` * This interface will be removed after migration to openapi-zod-client generated types` <br> ` */` | `import { PurchaseOrder } from '@/src/api/local/schemas'` | ☐ |
| `src/views/purchasing/PoCreateView.vue` | 47 | Local types/interfaces | `/** @deprecated Use generated types from src/api/generated instead` <br> ` * This interface will be removed after migration to openapi-zod-client generated types` <br> ` */` | `import { PurchaseOrderLine } from '@/src/api/local/schemas'` | ☐ |
| `src/views/purchasing/DeliveryReceiptListView.vue` | 81 | Local types/interfaces | `/** @deprecated Use generated types from src/api/generated instead` <br> ` * This interface will be removed after migration to openapi-zod-client generated types` <br> ` */` | `import { DeliveryReceipt } from '@/src/api/local/schemas'` | ☐ |
| `src/views/purchasing/DeliveryReceiptFormView.vue` | 238 | Local types/interfaces | `/** @deprecated Use generated types from src/api/generated instead` <br> ` * This interface will be removed after migration to openapi-zod-client generated types` <br> ` */` | `import { DeliveryReceiptLine } from '@/src/api/local/schemas'` | ☐ |
| `src/views/KanbanView.vue` | 256 | Local types/interfaces | `/** @deprecated Use generated types from src/api/generated instead` <br> ` * This interface will be removed after migration to openapi-zod-client generated types` <br> ` */` | `import { Job } from '@/src/api/local/schemas'` | ☐ |
| `src/views/JobCreateView.vue` | 215 | Local types/interfaces | `/** @deprecated Use generated types from src/api/generated instead` <br> ` * This interface will be removed after migration to openapi-zod-client generated types` <br> ` */` | `import { Job } from '@/src/api/local/schemas'` | ☐ |
| `src/views/AdminMonthEnd.vue` | 204 | Local types/interfaces | `/** @deprecated Use generated types from src/api/generated instead` <br> ` * This interface will be removed after migration to openapi-zod-client generated types` <br> ` */` | `import { Job } from '@/src/api/local/schemas'` | ☐ |
| `src/views/AdminMonthEnd.vue` | 218 | Local types/interfaces | `/** @deprecated Use generated types from src/api/generated instead` <br> ` * This interface will be removed after migration to openapi-zod-client generated types` <br> ` */` | `import { CostSet } from '@/src/api/local/schemas'` | ☐ |
| `src/views/AdminMonthEnd.vue` | 236 | Local types/interfaces | `/** @deprecated Use generated types from src/api/generated instead` <br> ` * This interface will be removed after migration to openapi-zod-client generated types` <br> ` */` | `import { JobArchiveRequest } from '@/src/api/local/schemas'` | ☐ |
| `src/views/AdminMonthEnd.vue` | 250 | Local types/interfaces | `/** @deprecated Use generated types from src/api/generated instead` <br> ` * This interface will be removed after migration to openapi-zod-client generated types` <br> ` */` | `import { JobArchiveResponse } from '@/src/api/local/schemas'` | ☐ |
| `src/views/AdminArchiveJobsView.vue` | 97 | API calls | `const res = await axios.get('/job/api/job/completed/', { withCredentials: true })` <br> `const jobs = res.data` <br> `completedJobs.value = jobs.map((job: Job) => ({` | `api.getCompletedJobs()` | ☐ |
| `src/views/AdminArchiveJobsView.vue` | 136 | API calls | `const res = await axios.post(` <br> `  '/job/api/job/archive/',` <br> `  { jobs: jobsToArchive },` | `api.archiveJobs({ jobs: jobsToArchive })` | ☐ |
| `src/services/django-jobs-service.ts` | 38 | API calls | `const res = await axios.get(\`\${API_BASE}django-jobs/\`)` <br> `return res.data` <br> `} catch (error) {` | `api.getDjangoJobs()` | ☐ |
| `src/services/django-jobs-service.ts` | 43 | API calls | `const res = await axios.post(\`\${API_BASE}django-jobs/\`, data)` <br> `return res.data` <br> `} catch (error) {` | `api.createDjangoJob(data)` | ☐ |
| `src/services/django-jobs-service.ts` | 48 | API calls | `const res = await axios.put(\`\${API_BASE}django-jobs/\${id}/\`, data)` <br> `return res.data` <br> `} catch (error) {` | `api.updateDjangoJob({ id, data })` | ☐ |
| `src/services/django-jobs-service.ts` | 53 | API calls | `await axios.delete(\`\${API_BASE}django-jobs/\${id}/\`)` <br> `} catch (error) {` <br> `console.error('Error deleting Django job:', error)` | `api.deleteDjangoJob({ id })` | ☐ |
| `src/services/django-jobs-service.ts` | 59 | API calls | `const res = await axios.get(\`\${API_BASE}django-job-executions/\`, { params })` <br> `return res.data` <br> `} catch (error) {` | `api.getDjangoJobExecutions(params)` | ☐ |
| `src/services/admin-company-defaults-service.ts` | 41 | API calls | `const { data } = await axios.get('/api/company-defaults/')` <br> `return data` <br> `} catch (error) {` | `api.getCompanyDefaults()` | ☐ |
| `src/services/admin-company-defaults-service.ts` | 46 | API calls | `const { data } = await axios.put('/api/company-defaults/', payload)` <br> `return data` <br> `} catch (error) {` | `api.updateCompanyDefaults(payload)` | ☐ |
| `src/composables/useXeroAuth.ts` | 102 | API calls | `await axios.get(\`\${getApiBaseUrl()}/api/xero/ping\`, { withCredentials: true })` <br> `setConnected(true)` <br> `} catch (error) {` | `api.xeroHealthCheck()` | ☐ |
| `src/composables/useXeroAuth.ts` | 126 | API calls | `const pingRes = await axios.get(\`\${getApiBaseUrl()}/api/xero/ping\`, { withCredentials: true })` <br> `if (pingRes.status === 200) {` <br> `setConnected(true)` | `api.xeroHealthCheck()` | ☐ |
| `src/composables/useXeroAuth.ts` | 132 | API calls | `const res = await axios.get(\`\${getApiBaseUrl()}/api/xero/sync-info/\`, {` <br> `  withCredentials: true,` <br> `})` | `api.getXeroSyncInfo()` | ☐ |
| `src/composables/useXeroAuth.ts` | 163 | API calls | `const res = await axios.post(` <br> `  \`\${getApiBaseUrl()}/api/xero/sync/\`,` <br> `  {},` | `api.startXeroSync()` | ☐ |
| `src/composables/useStaffApi.ts` | 13 | API calls | `const res = await axios.get(API_URL)` <br> `return res.data` <br> `} catch (e: unknown) {` | `api.getStaff()` | ☐ |
| `src/composables/useStaffApi.ts` | 34 | API calls | `const res = await axios.post(API_URL, formData)` <br> `return res.data` <br> `} catch (e: unknown) {` | `api.createStaff(formData)` | ☐ |
| `src/composables/useStaffApi.ts` | 55 | API calls | `const res = await axios.put(\`\${API_URL}\${id}/\`, formData)` <br> `return res.data` <br> `} catch (e: unknown) {` | `api.updateStaff({ id, data: formData })` | ☐ |
| `src/composables/useStaffApi.ts` | 70 | API calls | `await axios.delete(\`\${API_URL}\${id}/\`)` <br> `} catch (e: unknown) {` <br> `if (e instanceof Error) {` | `api.deleteStaff({ id })` | ☐ |
| `src/components/job/JobFinancialTab.vue` | 270 | API calls | `const response = await axios.post(\`/api/xero/create_quote/\${props.jobData.id}\`)` <br> `if (response.data.success) {` <br> `quoteUrl.value = response.data.online_url` | `api.createXeroQuote({ jobId: props.jobData.id })` | ☐ |
| `src/components/job/JobFinancialTab.vue` | 292 | API calls | `const response = await axios.post(\`/api/xero/create_invoice/\${props.jobData.id}\`)` <br> `if (response.data.success) {` <br> `invoiceUrl.value = response.data.online_url` | `api.createXeroInvoice({ jobId: props.jobData.id })` | ☐ |
| `src/components/job/JobQuoteTab.vue` | 327 | API calls | `const response = await fetch(\`/api/job/\${props.jobId}\`)` <br> `const updatedJob = await response.json()` <br> `if (updatedJob && updatedJob.latest_quote) {` | `api.getJob({ id: props.jobId })` | ☐ |

## Progress Tracking

- **Stage 1 - Mapping**: ✅ Complete
- **Stage 2 - API Migration**: ☐ Pending  
- **Stage 3 - Type Migration**: ☐ Pending
- **Stage 4 - Validation**: ☐ Pending

## Next Steps

1. Create `src/api/local/schemas.ts` with all required Zod schemas
2. Replace direct Axios calls with `api.<alias>()` calls
3. Update imports to use schemas from generated schemas OR local schemas if it's related to UI control file
4. Validate with `npm run lint` after each batch of changes
5. Test functionality to ensure no behavioural changes
