# Loading States Mapping Report

Total files with potential loading state issues: 115
Total matches found: 728

## Vue Components

### src\components\admin\AIProviderFormModal.vue

- **Linha 31**: `<SelectValue placeholder="Select a provider type" />`
- **Linha 52**: `placeholder="e.g., gemini-2.5-flash-lite-preview-06-17"`
- **Linha 68**: `:placeholder="isEditing ? 'Leave blank to keep unchanged' : 'Enter API Key'"`

### src\components\admin\errors\ErrorFilter.vue

- **Linha 45**: `<Input v-model="localSearch" placeholder="Search…" class="md:w-64" />`

### src\components\admin\errors\ErrorTable.vue

- **Linha 54**: `<TableRow v-if="props.loading">`
- **Linha 54**: `<TableRow v-if="props.loading">`
- **Linha 68**: `<TableRow v-if="!props.loading && props.errors.length === 0">`
- **Linha 68**: `<TableRow v-if="!props.loading && props.errors.length === 0">`
- **Linha 68**: `<TableRow v-if="!props.loading && props.errors.length === 0">`
- **Linha 69**: `<TableCell colspan="4" class="text-center py-6">No errors found.</TableCell>`

### src\components\admin\MonthEndSummary.vue

- **Linha 72**: `<TableRow v-if="jobsWithTotals.length === 0">`

### src\components\AdvancedSearchDialog.vue

- **Linha 17**: `placeholder="Enter job number"`
- **Linha 27**: `placeholder="Enter job name"`
- **Linha 41**: `placeholder="Contact person"`
- **Linha 53**: `placeholder="Job description"`
- **Linha 111**: `:disabled="isLoading"`
- **Linha 113**: `{{ isLoading ? 'Searching...' : 'Search' }}`
- **Linha 166**: `isLoading?: boolean`
- **Linha 170**: `isLoading: false,`

### src\components\AIProvidersDialog.vue

- **Linha 25**: `placeholder="Provider Name"`
- **Linha 34**: `placeholder="Model"`
- **Linha 60**: `:placeholder="localProviders[idx].id ? 'Leave blank to keep current' : 'API Key *'"`

### src\components\ClientDropdown.vue

- **Linha 11**: `<option value="">{{ placeholder }}</option>`
- **Linha 45**: `placeholder?: string`
- **Linha 62**: `placeholder: 'Any Client',`
- **Linha 69**: `const isLoading = ref(false)`
- **Linha 74**: `isLoading.value = true`
- **Linha 74**: `isLoading.value = true`
- **Linha 76**: `const data = await clientService.getAllClients()`
- **Linha 82**: `isLoading.value = false`
- **Linha 82**: `isLoading.value = false`

### src\components\ClientLookup.vue

- **Linha 14**: `:placeholder="placeholder"`
- **Linha 23**: `<div v-if="isLoading" class="absolute right-3 top-1/2 transform -translate-y-1/2">`
- **Linha 23**: `<div v-if="isLoading" class="absolute right-3 top-1/2 transform -translate-y-1/2">`
- **Linha 28**: `v-if="showSuggestions && (suggestions.length > 0 || searchQuery.length >= 3)"`
- **Linha 42**: `v-if="searchQuery.length >= 3"`
- **Linha 53**: `v-if="suggestions.length === 0 && searchQuery.length >= 3 && !isLoading"`
- **Linha 53**: `v-if="suggestions.length === 0 && searchQuery.length >= 3 && !isLoading"`
- **Linha 53**: `v-if="suggestions.length === 0 && searchQuery.length >= 3 && !isLoading"`
- **Linha 56**: `No clients found`
- **Linha 112**: `placeholder?: string`
- **Linha 119**: `placeholder: 'Search for a client...',`
- **Linha 134**: `isLoading,`

### src\components\ContactSelectionModal.vue

- **Linha 12**: `<div v-if="isLoading" class="text-center py-8">`
- **Linha 12**: `<div v-if="isLoading" class="text-center py-8">`
- **Linha 18**: `<div v-if="contacts.length > 0" class="mb-6">`
- **Linha 60**: `<p>No contacts found for this client</p>`
- **Linha 74**: `placeholder="Contact name"`
- **Linha 84**: `placeholder="Job title/position"`
- **Linha 94**: `placeholder="Phone number"`
- **Linha 104**: `placeholder="Email address"`
- **Linha 114**: `placeholder="Additional notes"`
- **Linha 147**: `:disabled="isLoading || !localContactForm.name.trim()"`
- **Linha 149**: `{{ isLoading ? 'Saving...' : 'Save' }}`
- **Linha 184**: `isLoading: boolean`

### src\components\ContactSelector.vue

- **Linha 15**: `:placeholder="placeholder"`
- **Linha 51**: `:is-loading="isLoading"`
- **Linha 79**: `placeholder?: string`
- **Linha 88**: `placeholder: 'No contact selected',`
- **Linha 103**: `isLoading,`

### src\components\CreateClientModal.vue

- **Linha 47**: `placeholder="Enter client name"`
- **Linha 64**: `placeholder="client@example.com"`
- **Linha 81**: `placeholder="Phone number"`
- **Linha 98**: `placeholder="Client address"`
- **Linha 118**: `<Button type="button" variant="outline" @click="handleCancel" :disabled="isLoading">`
- **Linha 123**: `:disabled="!isFormValid || isLoading"`
- **Linha 126**: `{{ isLoading ? 'Creating...' : 'Create Client' }}`
- **Linha 201**: `const isLoading = ref(false)`
- **Linha 247**: `isLoading.value = true`
- **Linha 247**: `isLoading.value = true`
- **Linha 253**: `const result: CreateClientResponse = await clientService.createClient(formData.value)`
- **Linha 286**: `isLoading.value = false`
- **Linha 286**: `isLoading.value = false`

### src\components\DataTable.vue

- **Linha 44**: `v-if="!header.isPlaceholder"`
- **Linha 52**: `<template v-if="table.getRowModel().rows.length">`

### src\components\ExecutionsModal.vue

- **Linha 28**: `<tr v-if="paginatedExecutions.length === 0">`
- **Linha 29**: `<td colspan="5" class="text-center text-gray-400 py-4">No executions found.</td>`

### src\components\job\JobActualTab.vue

- **Linha 7**: `<span v-if="isLoading" class="ml-2 text-sm text-gray-500">Loading...</span>`
- **Linha 7**: `<span v-if="isLoading" class="ml-2 text-sm text-gray-500">Loading...</span>`
- **Linha 22**: `<div v-if="isLoading" class="flex-1 flex items-center justify-center">`
- **Linha 22**: `<div v-if="isLoading" class="flex-1 flex items-center justify-center">`
- **Linha 201**: `<!-- No source info -->`
- **Linha 216**: `:isLoading="isLoading"`
- **Linha 266**: `const isLoading = ref(false)`
- **Linha 322**: `isLoading.value = true`
- **Linha 322**: `isLoading.value = true`
- **Linha 337**: `isLoading.value = false`
- **Linha 337**: `isLoading.value = false`

### src\components\job\JobAttachmentsModal.vue

- **Linha 170**: `<div v-if="files.length === 0" class="text-center py-8">`
- **Linha 259**: `const list = await jobRestService.listJobFiles(String(props.jobNumber))`
- **Linha 398**: `uploading.value = true`
- **Linha 401**: `const uploaded = await jobRestService.uploadJobFile(`
- **Linha 417**: `uploading.value = false`
- **Linha 431**: `await jobRestService.deleteJobFile(id)`
- **Linha 452**: `const response = await jobRestService.updateJobFile({`

### src\components\job\JobCostAnalysisTab.vue

- **Linha 17**: `<div v-if="loading" class="flex items-center justify-center py-12">`
- **Linha 227**: `loading.value = true`
- **Linha 237**: `loading.value = false`

### src\components\job\JobEditModal.vue

- **Linha 21**: `placeholder="Enter job name"`
- **Linha 34**: `placeholder="Customer order number"`
- **Linha 68**: `placeholder="Search for a client..."`
- **Linha 98**: `placeholder="No contact selected"`
- **Linha 141**: `placeholder="Enter job description..."`
- **Linha 151**: `placeholder="Enter internal notes about this job..."`
- **Linha 172**: `:disabled="isLoading || !isFormValid"`
- **Linha 174**: `<span v-if="isLoading" class="flex items-center">`
- **Linha 174**: `<span v-if="isLoading" class="flex items-center">`
- **Linha 257**: `const isLoading = ref(false)`
- **Linha 265**: `isLoading: isContactLoading,`
- **Linha 387**: `isLoading.value = true`
- **Linha 387**: `isLoading.value = true`
- **Linha 400**: `const result = await jobRestService.updateJob(props.jobData.id, updateData)`
- **Linha 460**: `isLoading.value = false`
- **Linha 460**: `isLoading.value = false`

### src\components\job\JobEstimateTab.vue

- **Linha 7**: `<span v-if="isLoading" class="ml-2 text-sm text-gray-500">Loading...</span>`
- **Linha 7**: `<span v-if="isLoading" class="ml-2 text-sm text-gray-500">Loading...</span>`
- **Linha 10**: `:disabled="isLoading"`
- **Linha 38**: `:isLoading="isLoading"`
- **Linha 101**: `const isLoading = ref(false)`
- **Linha 105**: `isLoading.value = true`
- **Linha 105**: `isLoading.value = true`
- **Linha 118**: `isLoading.value = false`
- **Linha 118**: `isLoading.value = false`
- **Linha 170**: `isLoading.value = true`
- **Linha 170**: `isLoading.value = true`
- **Linha 171**: `toast.loading('Updating cost line...', { id: 'update-cost-line' })`
- **Linha 173**: `const updated = await costlineService.updateCostLine(payload.id, payload)`
- **Linha 181**: `isLoading.value = false`
- **Linha 181**: `isLoading.value = false`
- **Linha 188**: `isLoading.value = true`
- **Linha 188**: `isLoading.value = true`
- **Linha 189**: `toast.loading('Deleting cost line...', { id: 'delete-cost-line' })`
- **Linha 191**: `await costlineService.deleteCostLine(line.id)`
- **Linha 198**: `isLoading.value = false`
- **Linha 198**: `isLoading.value = false`
- **Linha 209**: `isLoading.value = true`
- **Linha 209**: `isLoading.value = true`
- **Linha 210**: `toast.loading('Adding material cost line...', { id: 'add-material' })`
- **Linha 221**: `const created = await costlineService.createCostLine(props.jobId, 'estimate', createPayload)`
- **Linha 239**: `isLoading.value = false`
- **Linha 239**: `isLoading.value = false`
- **Linha 250**: `isLoading.value = true`
- **Linha 250**: `isLoading.value = true`
- **Linha 251**: `toast.loading('Adding time cost line...', { id: 'add-time' })`
- **Linha 262**: `const created = await costlineService.createCostLine(props.jobId, 'estimate', createPayload)`
- **Linha 280**: `isLoading.value = false`
- **Linha 280**: `isLoading.value = false`

### src\components\job\JobHistoryModal.vue

- **Linha 25**: `placeholder="Describe what happened..."`
- **Linha 61**: `<div v-if="events.length === 0" class="text-center text-gray-500 py-8">`
- **Linha 116**: `const isAdding = computed(() => props.loading)`

### src\components\job\JobPdfDialog.vue

- **Linha 65**: `const blob = await jobRestService.fetchWorkshopPdf(props.jobId)`
- **Linha 83**: `const blob = await jobRestService.fetchWorkshopPdf(props.jobId)`

### src\components\job\JobQuoteTab.vue

- **Linha 27**: `:disabled="isLoading || isRefreshing"`
- **Linha 44**: `:disabled="isLoading"`
- **Linha 77**: `:isLoading="isLoading"`
- **Linha 95**: `:isLoading="isLoading"`
- **Linha 268**: `const isLoading = ref(false)`
- **Linha 299**: `isLoading.value = true`
- **Linha 299**: `isLoading.value = true`
- **Linha 324**: `isLoading.value = false`
- **Linha 324**: `isLoading.value = false`
- **Linha 330**: `toast.loading('Applying changes...', { id: 'quote-apply' })`
- **Linha 332**: `const result = await quoteService.applyQuote(props.jobId)`
- **Linha 350**: `toast.loading('Checking for updates...', { id: 'quote-refresh' })`
- **Linha 352**: `const preview = await quoteService.previewQuote(props.jobId)`
- **Linha 365**: `isLoading.value = true`
- **Linha 365**: `isLoading.value = true`
- **Linha 366**: `toast.loading('Linking spreadsheet...')`
- **Linha 368**: `await quoteService.linkQuote(props.jobId)`
- **Linha 377**: `isLoading.value = false`
- **Linha 377**: `isLoading.value = false`
- **Linha 388**: `isLoading.value = true`
- **Linha 388**: `isLoading.value = true`
- **Linha 389**: `toast.loading('Adding material cost line...')`
- **Linha 400**: `const created = await costlineService.createCostLine(props.jobId, 'quote', createPayload)`
- **Linha 408**: `isLoading.value = false`
- **Linha 408**: `isLoading.value = false`
- **Linha 414**: `isLoading.value = true`
- **Linha 414**: `isLoading.value = true`
- **Linha 415**: `toast.loading('Adding time cost line...')`
- **Linha 426**: `const created = await costlineService.createCostLine(props.jobId, 'quote', createPayload)`
- **Linha 434**: `isLoading.value = false`
- **Linha 434**: `isLoading.value = false`
- **Linha 450**: `isLoading.value = true`
- **Linha 450**: `isLoading.value = true`
- **Linha 451**: `toast.loading('Updating cost line...')`
- **Linha 462**: `const updated = await costlineService.updateCostLine(Number(payload.id), updatePayload)`
- **Linha 470**: `isLoading.value = false`
- **Linha 470**: `isLoading.value = false`
- **Linha 476**: `isLoading.value = true`
- **Linha 476**: `isLoading.value = true`
- **Linha 477**: `toast.loading('Deleting cost line...')`
- **Linha 479**: `await costlineService.deleteCostLine(line.id)`
- **Linha 486**: `isLoading.value = false`
- **Linha 486**: `isLoading.value = false`

### src\components\job\JobSettingsModal.vue

- **Linha 28**: `placeholder="Job description..."`
- **Linha 70**: `placeholder="Search for a new client..."`
- **Linha 125**: `placeholder="Customer order number"`
- **Linha 148**: `placeholder="Internal notes..."`
- **Linha 159**: `:disabled="isLoading"`
- **Linha 167**: `:disabled="isLoading"`
- **Linha 170**: `<span v-if="isLoading" class="flex items-center">`
- **Linha 170**: `<span v-if="isLoading" class="flex items-center">`
- **Linha 242**: `const isLoading = ref(false)`
- **Linha 256**: `const statusMap = await jobRestService.getStatusValues()`
- **Linha 437**: `isLoading.value = true`
- **Linha 437**: `isLoading.value = true`
- **Linha 450**: `const result = await jobRestService.updateJob(props.jobData.id, sanitizedData)`
- **Linha 483**: `isLoading.value = false`
- **Linha 483**: `isLoading.value = false`
- **Linha 677**: ``JobSettingsModal - Enriching client_id from props.jobData (${props.jobData.client_id}) as it was missing or empty in jobDataToStore.`,`
- **Linha 687**: `'JobSettingsModal - jobDataToStore is missing client_id or it is empty, and props.jobData.client_id is also unavailable or empty for enrichment.',`

### src\components\job\JobWorkflowModal.vue

- **Linha 18**: `<option v-if="isLoadingStatuses" value="">Loading statuses...</option>`
- **Linha 18**: `<option v-if="isLoadingStatuses" value="">Loading statuses...</option>`
- **Linha 110**: `:disabled="isLoading"`
- **Linha 113**: `<span v-if="isLoading" class="flex items-center">`
- **Linha 113**: `<span v-if="isLoading" class="flex items-center">`
- **Linha 196**: `const isLoadingStatuses = ref(false)`
- **Linha 239**: `isLoadingStatuses.value = true`
- **Linha 241**: `const statusMap = await jobRestService.getStatusValues()`
- **Linha 261**: `isLoadingStatuses.value = false`
- **Linha 294**: `isLoading.value = true`
- **Linha 294**: `isLoading.value = true`
- **Linha 307**: `const response = (await JobRestService.updateJob(jobData.value.id, updatedJobData)) as unknown`
- **Linha 337**: `isLoading.value = false`
- **Linha 337**: `isLoading.value = false`

### src\components\job\WorkshopPdfViewer.vue

- **Linha 20**: `const blob = await jobRestService.fetchWorkshopPdf(props.jobId)`

### src\components\JobCard.vue

- **Linha 58**: `v-if="!job.people || job.people.length === 0"`

### src\components\JobFormModal.vue

- **Linha 10**: `<Input v-model="form.id" placeholder="Job ID" :required="!job" :readonly="!!job" />`
- **Linha 14**: `<Input v-model="form.next_run_time" placeholder="YYYY-MM-DDTHH:mm:ssZ" required />`

### src\components\JobsModal.vue

- **Linha 11**: `<Input v-model="search" placeholder="Search jobs..." class="w-64" />`
- **Linha 36**: `<tr v-if="filteredJobs.length === 0">`
- **Linha 37**: `<td colspan="4" class="text-center text-gray-400 py-4">No jobs found.</td>`

### src\components\KanbanColumn.vue

- **Linha 47**: `<div v-if="jobs.length === 0" class="flex items-center justify-center text-gray-500 h-32">`
- **Linha 49**: `<div class="text-sm">No jobs in {{ status.label.toLowerCase() }}</div>`
- **Linha 50**: `<div class="text-xs mt-1">Drag jobs here to update status</div>`
- **Linha 55**: `v-if="showLoadMore && !isLoading"`
- **Linha 55**: `v-if="showLoadMore && !isLoading"`
- **Linha 67**: `<div v-if="isLoading" :class="jobs.length > 0 ? 'col-span-2' : ''" class="mt-4 text-center">`
- **Linha 67**: `<div v-if="isLoading" :class="jobs.length > 0 ? 'col-span-2' : ''" class="mt-4 text-center">`
- **Linha 67**: `<div v-if="isLoading" :class="jobs.length > 0 ? 'col-span-2' : ''" class="mt-4 text-center">`
- **Linha 99**: `<div v-if="jobs.length === 0" class="col-span-full text-center py-8">`
- **Linha 103**: `<div v-if="showLoadMore && !isLoading" class="col-span-full text-center">`
- **Linha 103**: `<div v-if="showLoadMore && !isLoading" class="col-span-full text-center">`
- **Linha 112**: `<div v-if="isLoading" class="col-span-full text-center">`
- **Linha 112**: `<div v-if="isLoading" class="col-span-full text-center">`
- **Linha 139**: `isLoading?: boolean`
- **Linha 164**: `isLoading: false,`

### src\components\kpi\KPIDayDetailsModal.vue

- **Linha 95**: `v-if="dayData && dayData.details.job_breakdown.length > 0"`

### src\components\kpi\MonthSelector.vue

- **Linha 7**: `<SelectValue :placeholder="displayValue" />`

### src\components\purchasing\DeliveryReceiptLinesTable.vue

- **Linha 397**: `<SelectValue placeholder="Select Job or Stock" />`
- **Linha 431**: `placeholder="Enter quantity"`
- **Linha 449**: `placeholder="e.g., 20.5"`
- **Linha 462**: `placeholder="e.g., Pallet 12 - Rack D, Shelf 3 etc."`

### src\components\purchasing\JobSelect.vue

- **Linha 8**: `:placeholder="placeholder"`
- **Linha 59**: `v-if="filteredJobs.length === 0 && searchTerm.trim()"`
- **Linha 62**: `No jobs found for "{{ searchTerm }}"`
- **Linha 65**: `<!-- No jobs available -->`
- **Linha 67**: `v-if="filteredJobs.length === 0 && !searchTerm.trim()"`
- **Linha 70**: `No jobs available`
- **Linha 89**: `placeholder: {`

### src\components\purchasing\PendingItemsTable.vue

- **Linha 169**: `<!-- Empty State -->`
- **Linha 170**: `<div v-if="lines.length === 0" class="p-8 text-center text-gray-500">`

### src\components\purchasing\PoLinesTable.vue

- **Linha 244**: `placeholder: 'Select Job (Optional)',`
- **Linha 438**: `<Input v-model="additionalFields.alloy" type="text" placeholder="e.g., 304, 6061" />`
- **Linha 447**: `placeholder="e.g., m8 countersunk socket screw"`
- **Linha 457**: `placeholder="Where this item will be stored"`
- **Linha 467**: `placeholder="Product dimensions"`

### src\components\purchasing\PoPdfDialog.vue

- **Linha 62**: `toast.loading('Generating PDF...', { id: 'po-pdf-loading' })`

### src\components\purchasing\PoSummaryCard.vue

- **Linha 104**: `placeholder="Search supplier…"`
- **Linha 118**: `placeholder="No supplier selected"`

### src\components\purchasing\ReceivedItemsTable.vue

- **Linha 204**: `default: () => h(SelectValue, { placeholder: 'Select job...' }),`
- **Linha 315**: `<!-- Empty State -->`
- **Linha 316**: `<div v-if="lines.length === 0" class="p-8 text-center text-gray-500">`

### src\components\quote\QuoteCostLinesGrid.vue

- **Linha 3**: `<div v-if="isLoading" class="flex-1 flex items-center justify-center">`
- **Linha 3**: `<div v-if="isLoading" class="flex-1 flex items-center justify-center">`
- **Linha 159**: `isLoading?: boolean`
- **Linha 163**: `isLoading: false,`

### src\components\quote\QuoteSummaryCard.vue

- **Linha 13**: `<div v-if="isLoading" class="flex-1 flex items-center justify-center">`
- **Linha 13**: `<div v-if="isLoading" class="flex-1 flex items-center justify-center">`
- **Linha 285**: `v-if="previewData.validation_report.errors?.length"`
- **Linha 296**: `v-if="previewData.validation_report.warnings?.length"`
- **Linha 390**: `isLoading?: boolean`
- **Linha 395**: `isLoading: false,`
- **Linha 463**: `toast.loading('Linking spreadsheet...', {`
- **Linha 470**: `const result = await quoteService.linkQuote(props.job.id)`
- **Linha 522**: `toast.loading('Checking for updates...', {`
- **Linha 530**: `const preview = await quoteService.previewQuote(props.job.id)`
- **Linha 561**: `const result = await quoteService.applyQuote(props.job.id)`
- **Linha 580**: `toast.info('No changes found', {`

### src\components\QuoteImportDialog.vue

- **Linha 22**: `:disabled="!selectedFile || isLoading"`
- **Linha 25**: `<svg v-if="isLoading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">`
- **Linha 25**: `<svg v-if="isLoading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">`
- **Linha 40**: `{{ isLoading ? 'Loading...' : 'Preview Import' }}`
- **Linha 45**: `:disabled="isLoading"`
- **Linha 162**: `<div v-if="previewData.preview.draft_lines?.length > 0" class="draft-lines mb-6">`
- **Linha 168**: `v-if="previewData.preview.draft_lines.length > 5"`
- **Linha 223**: `:disabled="!canProceed || isLoading"`
- **Linha 226**: `<svg v-if="isLoading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">`
- **Linha 226**: `<svg v-if="isLoading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">`
- **Linha 241**: `{{ isLoading ? 'Importing...' : 'Execute Import' }}`
- **Linha 247**: `:disabled="isLoading"`
- **Linha 361**: `isLoading,`

### src\components\QuoteStatus.vue

- **Linha 3**: `<div v-if="isLoading" class="loading-state">`
- **Linha 3**: `<div v-if="isLoading" class="loading-state">`
- **Linha 101**: `<h3 class="text-lg font-medium text-gray-900 mb-2">No Quote Available</h3>`
- **Linha 111**: `:disabled="isLoading"`
- **Linha 115**: `:class="['w-4 h-4', isLoading ? 'animate-spin' : '']"`
- **Linha 154**: `const { isLoading, currentQuote, error, loadQuoteStatus } = useQuoteImport()`

### src\components\RichTextEditor.vue

- **Linha 37**: `placeholder?: string`
- **Linha 47**: `placeholder: 'Enter text...',`
- **Linha 81**: `placeholder: props.placeholder,`

### src\components\SectionModal.vue

- **Linha 25**: `placeholder="08:00"`
- **Linha 35**: `placeholder="17:00"`

### src\components\shared\CostLinesGrid.vue

- **Linha 3**: `<div v-if="isLoading" class="flex-1 flex items-center justify-center">`
- **Linha 3**: `<div v-if="isLoading" class="flex-1 flex items-center justify-center">`
- **Linha 196**: `isLoading?: boolean`
- **Linha 200**: `isLoading: false,`

### src\components\shared\CostSetSummaryCard.vue

- **Linha 12**: `<div v-if="isLoading" class="flex-1 flex items-center justify-center">`
- **Linha 12**: `<div v-if="isLoading" class="flex-1 flex items-center justify-center">`
- **Linha 134**: `isLoading?: boolean`

### src\components\StaffDropdown.vue

- **Linha 11**: `<option value="">{{ placeholder }}</option>`
- **Linha 41**: `placeholder?: string`
- **Linha 58**: `placeholder: 'Any Staff Member',`
- **Linha 65**: `const isLoading = ref(false)`
- **Linha 70**: `isLoading.value = true`
- **Linha 70**: `isLoading.value = true`
- **Linha 72**: `const data = await staffService.getAllStaff()`
- **Linha 78**: `isLoading.value = false`
- **Linha 78**: `isLoading.value = false`

### src\components\StaffFormModal.vue

- **Linha 33**: `<Input id="first_name" v-model="form.first_name" placeholder="First Name" required />`
- **Linha 37**: `<Input id="last_name" v-model="form.last_name" placeholder="Last Name" required />`
- **Linha 48**: `placeholder="Preferred Name"`
- **Linha 53**: `<Input id="email" v-model="form.email" type="email" placeholder="E-mail" required />`
- **Linha 65**: `placeholder="Wage Rate"`
- **Linha 78**: `placeholder="IMS Payroll ID"`
- **Linha 145**: `placeholder="Monday Hours"`
- **Linha 157**: `placeholder="Tuesday Hours"`
- **Linha 169**: `placeholder="Wednesday Hours"`
- **Linha 181**: `placeholder="Thursday Hours"`
- **Linha 193**: `placeholder="Friday Hours"`
- **Linha 205**: `placeholder="Saturday Hours"`
- **Linha 217**: `placeholder="Sunday Hours"`
- **Linha 238**: `<Input id="groups" v-model="form.groups" placeholder="Group IDs (comma separated)" />`
- **Linha 247**: `placeholder="Permission IDs (comma separated)"`

### src\components\StaffPanel.vue

- **Linha 73**: `const isLoading = ref(false)`
- **Linha 79**: `isLoading.value = true`
- **Linha 79**: `isLoading.value = true`
- **Linha 81**: `const data = await staffService.getAllStaff()`
- **Linha 96**: `isLoading.value = false`
- **Linha 96**: `isLoading.value = false`

### src\components\StatusMultiSelect.vue

- **Linha 11**: `<span v-if="selectedStatuses.length === 0" class="text-gray-500"> Select status... </span>`
- **Linha 54**: `<div v-if="selectedStatuses.length > 0" class="mt-2 flex flex-wrap gap-1">`

### src\components\timesheet\PaidAbsenceModal.vue

- **Linha 100**: `placeholder="Enter hours (e.g., 6.5)"`
- **Linha 110**: `placeholder="Optional: Add additional details about the absence..."`
- **Linha 321**: `loading.value = true`
- **Linha 334**: `loading.value = false`

### src\components\timesheet\StaffDetailModal.vue

- **Linha 62**: `v-if="staff.alerts.length > 0"`
- **Linha 76**: `<div v-if="staff.job_breakdown.length > 0">`

### src\components\timesheet\StaffRow.vue

- **Linha 129**: `v-if="staff.alerts.length > 0 && staff.status !== 'No Entry'"`

### src\components\ui\date-picker\DatePicker.vue

- **Linha 15**: `placeholder?: string`
- **Linha 48**: `internal.value ? df.format(internal.value.toDate(tz)) : (props.placeholder ?? 'Pick a date'),`

### src\components\ui\input\Input.vue

- **Linha 29**: `'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',`

### src\components\ui\select\SelectTrigger.vue

- **Linha 24**: ``border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4`,`

### src\components\ui\textarea\Textarea.vue

- **Linha 29**: `'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',`

### src\views\AdminAIProvidersView.vue

- **Linha 13**: `<div v-if="isLoading" class="text-center py-10">`
- **Linha 13**: `<div v-if="isLoading" class="text-center py-10">`
- **Linha 37**: `<template v-if="providers.length > 0">`
- **Linha 113**: `const isLoading = ref(false)`
- **Linha 124**: `isLoading.value = true`
- **Linha 124**: `isLoading.value = true`
- **Linha 127**: `providers.value = await aiProviderService.getProviders()`
- **Linha 134**: `isLoading.value = false`
- **Linha 134**: `isLoading.value = false`
- **Linha 156**: `await aiProviderService.updateProvider(providerData.id, providerData)`
- **Linha 159**: `await aiProviderService.createProvider(providerData)`
- **Linha 177**: `await aiProviderService.setDefaultProvider(provider.id)`
- **Linha 198**: `await aiProviderService.deleteProvider(providerToDelete.value.id)`

### src\views\AdminArchiveJobsView.vue

- **Linha 8**: `<div v-if="loading" class="flex-1 flex items-center justify-center text-2xl text-slate-400">`
- **Linha 89**: `loading.value = true`
- **Linha 100**: `loading.value = false`
- **Linha 129**: `const toastId = toast.loading('Arquivando jobs...')`

### src\views\AdminCompanyView.vue

- **Linha 118**: `loading.value = true`
- **Linha 124**: `loading.value = false`
- **Linha 127**: `loading.value = true`
- **Linha 138**: `loading.value = false`

### src\views\AdminErrorView.vue

- **Linha 16**: `:loading="loading"`
- **Linha 28**: `<Progress v-if="loading" class="absolute top-0 left-0 right-0" />`
- **Linha 70**: `loading.value = true`
- **Linha 74**: `loading.value = false`
- **Linha 80**: `loading.value = false`

### src\views\AdminMonthEnd.vue

- **Linha 130**: `<TableRow v-if="jobs.length === 0">`
- **Linha 169**: `<Progress v-if="loading" class="mt-4" :model-value="progress" />`
- **Linha 264**: `loading.value = true`
- **Linha 265**: `toast.loading('Loading Month-End data...', { id: 'month-end-loading' })`
- **Linha 275**: `loading.value = false`
- **Linha 305**: `loading.value = true`
- **Linha 306**: `toast.loading(`Loading data for ${month.label}...`, { id: `month-end-${month.key}` })`
- **Linha 327**: `loading.value = false`
- **Linha 333**: `loading.value = true`
- **Linha 334**: `toast.loading('Loading Month-End data...', { id: 'month-end-custom' })`
- **Linha 357**: `loading.value = false`
- **Linha 382**: `loading.value = true`
- **Linha 401**: `loading.value = false`

### src\views\AdminStaffView.vue

- **Linha 24**: `v-if="loading"`
- **Linha 99**: `<tr v-if="!filteredStaff.length">`
- **Linha 101**: `No staff found.`
- **Linha 208**: `loading.value = true`
- **Linha 210**: `loading.value = false`

### src\views\DailyTimesheetView.vue

- **Linha 95**: `<div v-if="loading" class="flex items-center justify-center py-8 sm:py-12">`
- **Linha 236**: `loading.value = true`
- **Linha 248**: `loading.value = false`

### src\views\JobCreateView.vue

- **Linha 24**: `placeholder="Enter job name"`
- **Linha 39**: `placeholder="Search for a client..."`
- **Linha 53**: `placeholder="Search or add contact person"`
- **Linha 74**: `placeholder="0.00"`
- **Linha 92**: `placeholder="0.00"`
- **Linha 111**: `placeholder="Job description for invoice"`
- **Linha 124**: `placeholder="PO/Order number"`
- **Linha 132**: `placeholder="Internal notes about the job"`
- **Linha 287**: `toast.loading('Creating job…', { id: 'create-job' })`
- **Linha 290**: `const result = await jobRestService.createJob(formData.value)`
- **Linha 295**: `await costlineService.createCostLine(job_id, 'estimate', {`
- **Linha 309**: `await costlineService.createCostLine(job_id, 'estimate', {`

### src\views\JobTable.vue

- **Linha 88**: `v-if="!header.isPlaceholder"`
- **Linha 96**: `<template v-if="table.getRowModel().rows?.length">`

### src\views\JobView.vue

- **Linha 160**: `v-if="loadingJob || jobError"`
- **Linha 263**: `:loading="loadingJob || jobEventsLoading"`
- **Linha 321**: `const loadingJob = computed(() => jobsStore.isLoadingJob)`
- **Linha 408**: `const result = await jobRestService.deleteJob(jobId.value)`

### src\views\KanbanView.vue

- **Linha 25**: `placeholder="Search..."`
- **Linha 89**: `:is-loading="isLoading"`
- **Linha 119**: `:is-loading="isLoading"`
- **Linha 142**: `:is-loading="isLoading"`
- **Linha 162**: `:is-loading="isLoading"`
- **Linha 203**: `isLoading,`

### src\views\KPIReportsView.vue

- **Linha 170**: `v-if="kpiLoading"`
- **Linha 358**: `kpiLoading.value = true`
- **Linha 361**: `const response = await kpiService.getAccountingKPICalendarData({`
- **Linha 371**: `kpiLoading.value = false`

### src\views\LoginView.vue

- **Linha 57**: `class="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"`
- **Linha 62**: `placeholder="Enter your username"`
- **Linha 81**: `class="w-full px-4 py-3 pr-12 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"`
- **Linha 86**: `placeholder="Enter your password"`
- **Linha 114**: `:disabled="isLoading || !isFormValid"`
- **Linha 116**: `<span v-if="isLoading" class="flex items-center justify-center">`
- **Linha 116**: `<span v-if="isLoading" class="flex items-center justify-center">`
- **Linha 157**: `const { credentials, hasError, isFormValid, isLoading, error, handleLogin } = useLogin()`

### src\views\purchasing\CreateFromQuoteView.vue

- **Linha 77**: `<Sparkles v-if="!isUploading" class="w-4 h-4" />`
- **Linha 184**: `isUploading.value = true`
- **Linha 223**: `isUploading.value = false`

### src\views\purchasing\DeliveryReceiptFormView.vue

- **Linha 19**: `<div v-if="isLoading" class="flex justify-center py-8">`
- **Linha 19**: `<div v-if="isLoading" class="flex justify-center py-8">`
- **Linha 246**: `const isLoading = ref(true)`
- **Linha 451**: `isLoading.value = true`
- **Linha 451**: `isLoading.value = true`
- **Linha 485**: `isLoading.value = false`
- **Linha 485**: `isLoading.value = false`

### src\views\purchasing\ItemSelect.vue

- **Linha 24**: `if (store.items.length === 0 && !store.loading) {`
- **Linha 50**: `<SelectValue :placeholder="'Select'">`

### src\views\purchasing\PurchaseOrderFormView.vue

- **Linha 5**: `<div v-if="isLoading" class="flex justify-center py-8">`
- **Linha 5**: `<div v-if="isLoading" class="flex justify-center py-8">`
- **Linha 168**: `const isLoading = ref(false)`
- **Linha 171**: `const isLoadingJobs = ref(false)`
- **Linha 197**: `if (isLoadingJobs.value) return`
- **Linha 199**: `isLoadingJobs.value = true`
- **Linha 211**: `toast.warning('No jobs available for purchase order creation')`
- **Linha 224**: `isLoadingJobs.value = false`
- **Linha 235**: `isLoading.value = true`
- **Linha 235**: `isLoading.value = true`
- **Linha 272**: `isLoading.value = false`
- **Linha 272**: `isLoading.value = false`
- **Linha 274**: `isReloading.value = false`
- **Linha 457**: `if (isReloading.value || isDeletingLine.value) {`
- **Linha 458**: `debugLog('⏸️ Skipping save - reloading:', isReloading.value, 'deleting:', isDeletingLine.value)`
- **Linha 543**: `toast.loading('Syncing with Xero…', { id: 'po-sync-loading' })`
- **Linha 610**: `toast.loading('Preparing email...', { id: 'po-email-loading' })`
- **Linha 658**: `if (isReloading.value || isDeletingLine.value) {`
- **Linha 661**: `isReloading.value,`

### src\views\purchasing\StockView.vue

- **Linha 13**: `<Input v-model="searchQuery" placeholder="Search stock items..." class="w-full" />`
- **Linha 64**: `<tr v-if="filteredItems.length === 0">`
- **Linha 101**: `placeholder="0.00"`
- **Linha 421**: `const data = await jobService.getAllJobs()`

### src\views\QuotingChatView.vue

- **Linha 68**: `placeholder="Describe what you need fabricated..."`
- **Linha 71**: `:disabled="isLoading"`
- **Linha 91**: `:disabled="!currentInput.trim() || isLoading"`
- **Linha 131**: `const isLoading = ref(false)`
- **Linha 136**: `if (!currentInput.value.trim() || isLoading.value) return`
- **Linha 136**: `if (!currentInput.value.trim() || isLoading.value) return`
- **Linha 140**: `isLoading.value = true`
- **Linha 140**: `isLoading.value = true`
- **Linha 159**: `const backendAssistantMessage = await quoteChatService.getAssistantResponse(`
- **Linha 173**: `isLoading.value = false`
- **Linha 173**: `isLoading.value = false`
- **Linha 201**: `const response = await quoteChatService.getChatHistory(jobContext.value.jobId)`
- **Linha 235**: `await quoteChatService.saveMessage(jobContext.value.jobId, backendMessage)`
- **Linha 249**: `await quoteChatService.clearChatHistory(jobContext.value.jobId)`

### src\views\TimesheetEntryView.vue

- **Linha 7**: `v-if="loading"`
- **Linha 47**: `<SelectValue placeholder="Staff..." />`
- **Linha 184**: `<SelectValue placeholder="Select staff..." />`
- **Linha 297**: `v-if="loading"`
- **Linha 702**: `loading.value = true`
- **Linha 742**: `savedLine = await costlineService.updateCostLine(entry.id, costLinePayload)`
- **Linha 746**: `savedLine = await costlineService.createCostLine(job.id, 'actual', costLinePayload)`
- **Linha 765**: `loading.value = false`
- **Linha 772**: `loading.value = true`
- **Linha 774**: `await costlineService.deleteCostLine(id)`
- **Linha 784**: `loading.value = false`
- **Linha 940**: `loading.value = true`
- **Linha 948**: `const response = await costlineService.getTimesheetEntries(`
- **Linha 988**: `loading.value = false`
- **Linha 1042**: `loading.value = true`

### src\views\WeeklyTimesheetView.vue

- **Linha 112**: `<div v-if="loading" class="flex items-center justify-center py-8 sm:py-12">`
- **Linha 310**: `loading.value = true`
- **Linha 323**: `loading.value = false`

### src\views\XeroView.vue

- **Linha 24**: `v-if="!isAuthenticated && !loading"`
- **Linha 32**: `v-if="isAuthenticated && !syncing && !loading"`
- **Linha 41**: `v-if="isAuthenticated && !loading"`
- **Linha 50**: `<div v-if="loading" class="flex justify-center items-center h-40">`

## Services

### src\services\aiProviderService.ts

- **Linha 16**: `async getProviders(): Promise<AIProvider[]> {`
- **Linha 26**: `async createProvider(providerData: Omit<AIProvider, 'id'>): Promise<AIProvider> {`
- **Linha 39**: `async updateProvider(id: number, providerData: Partial<AIProvider>): Promise<AIProvider> {`
- **Linha 52**: `async deleteProvider(id: number): Promise<void> {`
- **Linha 61**: `async setDefaultProvider(id: number): Promise<AIProvider> {`

### src\services\auth.service.ts

- **Linha 5**: `async authenticate(credentials: LoginCredentials): Promise<void> {`
- **Linha 9**: `async getCurrentUser(): Promise<User> {`
- **Linha 14**: `async logout(): Promise<void> {`
- **Linha 18**: `async userIsLogged(): Promise<boolean> {`

### src\services\clientService.ts

- **Linha 70**: `async createClient(data: CreateClientData): Promise<CreateClientResponse> {`
- **Linha 91**: `async getAllClients(): Promise<Client[]> {`

### src\services\company-defaults.service.ts

- **Linha 9**: `async getDefaults(): Promise<CompanyDefaults> {`

### src\services\ims.service.ts

- **Linha 76**: `async exportToIMS(startDate: Date): Promise<IMSExportData> {`

### src\services\job-rest.service.ts

- **Linha 23**: `async createJob(data: JobCreateRequest): Promise<JobDetailResponse> {`
- **Linha 31**: `async getJobForEdit(jobId: string): Promise<JobDetailResponse> {`
- **Linha 39**: `async updateJob(jobId: string, data: Partial<JobCreateRequest>): Promise<JobDetailResponse> {`
- **Linha 50**: `async deleteJob(jobId: string): Promise<void> {`
- **Linha 58**: `async toggleComplexJob(jobId: string, complexJob: boolean): Promise<{ success: boolean }> {`
- **Linha 71**: `async addJobEvent(jobId: string, description: string): Promise<void> {`
- **Linha 82**: `async getCompanyDefaults(): Promise<CompanyDefaults> {`
- **Linha 90**: `async getStatusValues(): Promise<FetchStatusValuesResponse> {`
- **Linha 98**: `async fetchWorkshopPdf(jobId: string): Promise<WorkshopPDFResponse> {`
- **Linha 106**: `async attachWorkshopPdf(jobNumber: number, pdfBlob: Blob): Promise<JobFileUploadSuccessResponse> {`
- **Linha 123**: `async listJobFiles(jobNumber: string): Promise<JobFile[]> {`
- **Linha 136**: `async deleteJobFile(fileId: string): Promise<void> {`
- **Linha 147**: `async uploadJobFile(`
- **Linha 171**: `async updateJobFile(params: {`

### src\services\job.service.ts

- **Linha 72**: `async getAllJobs(): Promise<{ activeJobs: Job[]; archivedJobs: Job[]; totalArchived: number }> {`
- **Linha 88**: `async getJobsByStatus(status: string, searchTerms?: string): Promise<JobsApiResponse> {`
- **Linha 108**: `async getStatusChoices(): Promise<StatusApiResponse> {`
- **Linha 118**: `async updateJobStatus(jobId: string, status: string): Promise<void> {`
- **Linha 141**: `async reorderJob(`
- **Linha 176**: `async performAdvancedSearch(filters: AdvancedFilters): Promise<JobsApiResponse> {`
- **Linha 201**: `async getJobsByKanbanColumn(columnId: string, searchTerms?: string): Promise<JobsApiResponse> {`

### src\services\kpi.service.ts

- **Linha 37**: `async getKPICalendarData(params: KPICalendarParams): Promise<KPICalendarData> {`
- **Linha 52**: `async getAccountingKPICalendarData(`

### src\services\quote-chat.service.ts

- **Linha 20**: `async getChatHistory(jobId: string): Promise<JobQuoteChatHistoryResponse> {`
- **Linha 29**: `async saveMessage(jobId: string, message: Omit<JobQuoteChat, 'id'>): Promise<JobQuoteChat> {`
- **Linha 41**: `async updateMessage(`
- **Linha 58**: `async clearChatHistory(jobId: string): Promise<void> {`
- **Linha 90**: `async getAssistantResponse(jobId: string, message: string): Promise<JobQuoteChat> {`

### src\services\quote.service.ts

- **Linha 14**: `async linkQuote(jobId: string, templateUrl?: string): Promise<QuoteSpreadsheet> {`
- **Linha 28**: `async previewQuote(jobId: string): Promise<PreviewQuoteResponse> {`
- **Linha 35**: `async applyQuote(jobId: string): Promise<ApplyQuoteResponse> {`
- **Linha 51**: `async previewQuoteImport(jobId: string, file: File): Promise<QuoteImportPreviewResponse> {`
- **Linha 64**: `async importQuote(`
- **Linha 84**: `async getQuoteStatus(jobId: string): Promise<QuoteImportStatusResponse> {`

### src\services\staff.service.ts

- **Linha 49**: `async getAllStaff(): Promise<Staff[]> {`
- **Linha 64**: `async assignStaffToJob(`
- **Linha 81**: `async removeStaffFromJob(`
- **Linha 100**: `async getJobStaffAssignments(jobId: number): Promise<StaffAssignment[]> {`

### src\services\timesheet.service.ts

- **Linha 10**: `static async getStaff(): Promise<Staff[]> {`
- **Linha 74**: `static async getTimeEntries(staffId: string, date: string): Promise<CostLine[]> {`
- **Linha 87**: `static async getJobs(): Promise<Job[]> {`
- **Linha 128**: `static async getWeeklyOverview(startDate: string): Promise<WeeklyOverviewData> {`
- **Linha 167**: `static async getStaffList(): Promise<Staff[]> {`
- **Linha 171**: `static async getAvailableJobs(): Promise<Job[]> {`
- **Linha 175**: `static async exportToIMS(weekStart: Date): Promise<string> {`

## Composables/Stores

### src\composables\useClientLookup.ts

- **Linha 42**: `const isLoading = ref(false)`
- **Linha 64**: `isLoading.value = true`
- **Linha 64**: `isLoading.value = true`
- **Linha 79**: `isLoading.value = false`
- **Linha 79**: `isLoading.value = false`
- **Linha 153**: `isLoading,`

### src\composables\useContactManagement.ts

- **Linha 27**: `const isLoading = ref(false)`
- **Linha 80**: `isLoading.value = true`
- **Linha 80**: `isLoading.value = true`
- **Linha 93**: `isLoading.value = false`
- **Linha 93**: `isLoading.value = false`
- **Linha 117**: `isLoading.value = true`
- **Linha 117**: `isLoading.value = true`
- **Linha 148**: `isLoading.value = false`
- **Linha 148**: `isLoading.value = false`
- **Linha 200**: `isLoading,`

### src\composables\useDashboard.ts

- **Linha 24**: `const isLoading = computed(() => authStore.isLoading)`
- **Linha 29**: `isLoading,`

### src\composables\useJobData.ts

- **Linha 16**: `loading.value = true`
- **Linha 34**: `loading.value = false`
- **Linha 40**: `loading.value = true`
- **Linha 47**: `loading.value = false`
- **Linha 53**: `loading.value = true`
- **Linha 60**: `loading.value = false`

### src\composables\useJobEvents.ts

- **Linha 30**: `debugLog('[useJobEvents] No events found in jobData, set to empty array.')`
- **Linha 30**: `debugLog('[useJobEvents] No events found in jobData, set to empty array.')`
- **Linha 56**: `loading.value = true`
- **Linha 60**: `const response = await jobRestService.addJobEvent(id, description)`
- **Linha 78**: `loading.value = false`
- **Linha 79**: `debugLog('[useJobEvents] addEvent finished. loading:', loading.value)`

### src\composables\useJobFiles.ts

- **Linha 17**: `loading.value = true`
- **Linha 24**: `loading.value = false`
- **Linha 30**: `loading.value = true`
- **Linha 37**: `loading.value = false`

### src\composables\useJobNotifications.ts

- **Linha 72**: `toast.loading('Linking spreadsheet...', {`
- **Linha 101**: `toast.loading('Fetching updates...', {`
- **Linha 114**: `toast.info('No changes found', {`
- **Linha 130**: `toast.loading(`Saving ${dataType}...`, {`
- **Linha 150**: `toast.loading(`Deleting ${itemType}...`, {`
- **Linha 182**: `return toast.loading(message, {`

### src\composables\useJobReactivity.ts

- **Linha 38**: `const response = await jobRestService.getJobForEdit(jobId)`

### src\composables\useKanban.ts

- **Linha 14**: `const isLoading = ref(false)`
- **Linha 94**: `if (isLoading.value) return`
- **Linha 94**: `if (isLoading.value) return`
- **Linha 97**: `isLoading.value = true`
- **Linha 97**: `isLoading.value = true`
- **Linha 103**: `const data = await jobService.getAllJobs()`
- **Linha 143**: `isLoading.value = false`
- **Linha 143**: `isLoading.value = false`
- **Linha 150**: `const data = await jobService.getStatusChoices()`
- **Linha 193**: `isLoading.value = true`
- **Linha 193**: `isLoading.value = true`
- **Linha 194**: `const response = await jobService.performAdvancedSearch(advancedFilters.value)`
- **Linha 201**: `isLoading.value = false`
- **Linha 201**: `isLoading.value = false`
- **Linha 248**: `await jobService.updateJobStatus(jobId, newStatus)`
- **Linha 270**: `await jobService.reorderJob(jobId, beforeId, afterId, status)`
- **Linha 308**: `isLoading,`

### src\composables\useLogin.ts

- **Linha 68**: `isLoading: computed(() => authStore.isLoading),`

### src\composables\useQuoteImport.ts

- **Linha 11**: `const isLoading = ref(false)`
- **Linha 49**: `isLoading.value = true`
- **Linha 49**: `isLoading.value = true`
- **Linha 54**: `currentQuote.value = await quoteService.getQuoteStatus(jobId)`
- **Linha 60**: `isLoading.value = false`
- **Linha 60**: `isLoading.value = false`
- **Linha 65**: `isLoading.value = true`
- **Linha 65**: `isLoading.value = true`
- **Linha 70**: `previewData.value = await quoteService.previewQuoteImport(jobId, file)`
- **Linha 80**: `isLoading.value = false`
- **Linha 80**: `isLoading.value = false`
- **Linha 85**: `isLoading.value = true`
- **Linha 85**: `isLoading.value = true`
- **Linha 90**: `importResult.value = await quoteService.importQuote(jobId, file, skipValidation)`
- **Linha 104**: `isLoading.value = false`
- **Linha 104**: `isLoading.value = false`
- **Linha 112**: `isLoading.value = false`
- **Linha 112**: `isLoading.value = false`
- **Linha 120**: `isLoading,`

### src\composables\useSimpleDragAndDrop.ts

- **Linha 301**: `debugLog(`⚠️ No element found for status: ${status}`)`

### src\composables\useTimesheetEntryGrid.ts

- **Linha 250**: `loading.value = true`
- **Linha 285**: `loading.value = false`
- **Linha 413**: `loading.value = true`
- **Linha 424**: `loading.value = false`

### src\composables\useXeroAuth.ts

- **Linha 124**: `loading.value = true`
- **Linha 130**: `loading.value = false`
- **Linha 157**: `loading.value = false`

### src\stores\auth.ts

- **Linha 29**: `const isLoading = ref(false)`
- **Linha 44**: `isLoading.value = loading`
- **Linha 44**: `isLoading.value = loading`
- **Linha 146**: `isLoading,`

### src\stores\companyDefaults.ts

- **Linha 8**: `const isLoading = ref(false)`
- **Linha 12**: `isLoading.value = true`
- **Linha 12**: `isLoading.value = true`
- **Linha 15**: `companyDefaults.value = await CompanyDefaultsService.getDefaults()`
- **Linha 20**: `isLoading.value = false`
- **Linha 20**: `isLoading.value = false`
- **Linha 27**: `isLoading,`

### src\stores\costing.ts

- **Linha 46**: `loading.value = true`
- **Linha 81**: `loading.value = false`

### src\stores\deliveryReceiptStore.ts

- **Linha 36**: `loading.value = true`
- **Linha 49**: `loading.value = false`
- **Linha 103**: `loading.value = true`
- **Linha 122**: `loading.value = false`
- **Linha 133**: `loading.value = true`
- **Linha 152**: `loading.value = false`

### src\stores\jobs.ts

- **Linha 39**: `isLoadingJob: boolean`
- **Linha 49**: `const isLoadingJob = ref(false)`
- **Linha 177**: `isLoadingJob.value = loading`
- **Linha 181**: `isLoadingKanban.value = loading`
- **Linha 243**: `const response = await jobRestService.getJobForEdit(jobId)`
- **Linha 266**: `isLoadingJob,`

### src\stores\purchaseOrderStore.ts

- **Linha 23**: `loading.value = true`
- **Linha 36**: `loading.value = false`

### src\stores\stockStore.ts

- **Linha 28**: `loading.value = true`
- **Linha 33**: `loading.value = false`

### src\stores\timesheet.ts

- **Linha 92**: `loading.value = true`
- **Linha 111**: `loading.value = false`
- **Linha 120**: `loading.value = true`
- **Linha 124**: `const newLine = await costlineService.createCostLine(jobId.value, kind.value, payload)`
- **Linha 136**: `loading.value = false`
- **Linha 141**: `loading.value = true`
- **Linha 145**: `const updatedLine = await costlineService.updateCostLine(id, payload)`
- **Linha 163**: `loading.value = false`
- **Linha 168**: `loading.value = true`
- **Linha 172**: `await costlineService.deleteCostLine(id)`
- **Linha 183**: `loading.value = false`
- **Linha 197**: `await CompanyDefaultsService.getDefaults()`
- **Linha 204**: `loading.value = true`
- **Linha 208**: `staff.value = await TimesheetService.getStaff()`
- **Linha 213**: `loading.value = false`
- **Linha 218**: `loading.value = true`
- **Linha 222**: `jobs.value = await TimesheetService.getJobs()`
- **Linha 227**: `loading.value = false`
- **Linha 234**: `loading.value = true`
- **Linha 244**: `loading.value = false`
- **Linha 249**: `loading.value = true`
- **Linha 256**: `currentWeekData.value = await TimesheetService.getWeeklyOverview(weekStart)`
- **Linha 268**: `loading.value = false`
- **Linha 288**: `loading.value = true`
- **Linha 311**: `const newCostLine = await costlineService.create(costLineData)`
- **Linha 329**: `loading.value = false`
- **Linha 348**: `loading.value = true`
- **Linha 372**: `const updatedCostLine = await costlineService.update(entryId, updatePayload)`
- **Linha 393**: `loading.value = false`

### src\stores\xeroItemStore.ts

- **Linha 21**: `loading.value = true`
- **Linha 27**: `loading.value = false`

## Templates

### src\components\purchasing\PurchaseOrderJobCellEditor.ts

- **Linha 66**: `this.input.placeholder = 'Search jobs... (start typing job number or name)'`
- **Linha 155**: `noResults.textContent = 'No jobs found'`

### src\components\timesheet\TimesheetEntryJobCellEditor.ts

- **Linha 34**: `debugLog('⚠️ No jobs found in window.timesheetJobs:', win.timesheetJobs)`
- **Linha 60**: `this.input.placeholder = 'Search jobs... (start typing job number or name)'`
- **Linha 155**: `noResults.textContent = 'No jobs found'`
