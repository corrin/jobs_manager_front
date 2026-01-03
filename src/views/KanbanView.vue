<template>
  <AppLayout>
    <div class="flex flex-col min-h-screen mt-5 md:mt-15 lg:mt-0">
      <div class="flex-shrink-0 p-3 sm:p-4 lg:p-6 pt-2 sm:pt-3 md:pt-1 lg:pt-6">
        <div class="mb-2 md:mb-3 space-y-2">
          <div
            class="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 w-full"
          >
            <button
              @click="showAdvancedSearchDialog = true"
              class="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md transition-all duration-200 flex items-center flex-shrink-0"
            >
              <Search class="mr-1.5 h-3.5 w-3.5" />
              Advanced Search
            </button>

            <div class="w-full max-w-xs sm:max-w-md">
              <div class="relative">
                <Search
                  class="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-grey-400"
                />
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search..."
                  class="w-full pl-8 pr-3 py-2 text-sm border border-grey-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  @input="handleSearch"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="flex-1 flex flex-col px-2 sm:px-4 lg:px-6 py-1 md:py-2">
          <div class="mb-2 md:mb-3 w-full">
            <div v-if="isDesktop" class="flex justify-center px-2">
              <div class="w-full max-w-6xl">
                <StaffPanel
                  :active-filters="activeStaffFilters"
                  @staff-filter-changed="handleStaffFilterChanged"
                />
              </div>
            </div>
            <div v-else class="staff-panel-container">
              <div class="staff-panel-scroll">
                <div class="mobile-assign-info">
                  <div class="text-xs text-gray-600">
                    <span class="font-semibold text-gray-900">Quick assign:</span>
                    Tap <span class="font-semibold">Assign</span> on a teammate, then tap a job
                    card.
                  </div>
                  <div
                    v-if="mobileAssignStaffId"
                    class="flex items-center justify-between text-xs text-blue-900 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1 mt-2"
                  >
                    <span>Assigning to {{ mobileAssignStaffName }}</span>
                    <button
                      type="button"
                      class="text-blue-600 font-semibold hover:text-blue-800"
                      @click="clearMobileAssignSelection"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <StaffPanel
                  class="staff-panel-inline"
                  :active-filters="activeStaffFilters"
                  :enable-mobile-quick-assign="true"
                  :active-mobile-assign-staff-id="mobileAssignStaffId"
                  @staff-filter-changed="handleStaffFilterChanged"
                  @mobile-assign-select="handleMobileAssignSelect"
                />
              </div>
            </div>
          </div>

          <div class="flex-1 flex flex-col space-y-1 md:space-y-2">
            <div class="md:hidden space-y-3">
              <div
                class="sticky top-0 z-30 bg-white/95 backdrop-blur border border-grey-200 rounded-2xl shadow-sm p-3 space-y-2 mobile-status-toolbar"
              >
                <div class="flex items-center justify-between text-xs font-semibold text-grey-500">
                  <span>Focused Column</span>
                  <span class="uppercase tracking-wide"
                    >{{ visibleStatusChoices.length }} total</span
                  >
                </div>
                <select
                  v-model="selectedMobileStatus"
                  class="w-full p-2.5 text-sm border border-grey-300 rounded-lg bg-white text-grey-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option
                    v-for="status in visibleStatusChoices"
                    :key="status.key"
                    :value="status.key"
                  >
                    {{ status.label }} ({{ getJobsByStatus(status.key).length }})
                  </option>
                </select>

                <div class="flex gap-2 overflow-x-auto mobile-status-pills">
                  <button
                    v-for="status in visibleStatusChoices"
                    :key="status.key"
                    type="button"
                    class="mobile-status-pill"
                    :class="{ 'mobile-status-pill--active': selectedMobileStatus === status.key }"
                    @click="selectMobileStatus(status.key)"
                  >
                    <span class="truncate">{{ status.label }}</span>
                    <span class="mobile-status-pill__count">{{
                      getJobsByStatus(status.key).length
                    }}</span>
                  </button>
                </div>
              </div>

              <div class="mobile-columns-wrapper">
                <div ref="mobileColumnsScroller" class="mobile-columns-scroller">
                  <div
                    v-for="status in visibleStatusChoices"
                    :key="status.key"
                    class="mobile-column-panel"
                    :ref="(el) => setMobileColumnRef(status.key, el as HTMLElement | null)"
                  >
                    <KanbanColumn
                      :status="status"
                      :jobs="getSortedJobsByStatus(status.key)"
                      :is-loading="isLoading"
                      :is-dragging="isDragging"
                      :mobile-selected-staff-id="mobileAssignStaffId"
                      :enable-tap-assign="isTapAssignActive"
                      @job-click="viewJob"
                      @load-more="loadMoreJobs(status.key)"
                      @sortable-ready="handleSortableReady"
                      @staff-assigned="handleStaffAssigned"
                      @staff-unassigned="handleStaffUnassigned"
                      @status-change="openStatusDrawer"
                      class="kanban-column"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="hidden md:flex md:flex-1 md:flex-col">
              <div class="block lg:hidden">
                <div class="w-full mx-auto px-2">
                  <div
                    class="grid gap-3"
                    :class="{
                      'grid-cols-1': visibleStatusChoices.length <= 2,
                      'grid-cols-2':
                        visibleStatusChoices.length <= 4 && visibleStatusChoices.length > 2,
                      'grid-cols-3':
                        visibleStatusChoices.length <= 6 && visibleStatusChoices.length > 4,
                      'grid-cols-4': visibleStatusChoices.length > 6,
                    }"
                  >
                    <KanbanColumn
                      v-for="status in visibleStatusChoices"
                      :key="status.key"
                      :status="status"
                      :jobs="getSortedJobsByStatus(status.key)"
                      :is-loading="isLoading"
                      :is-dragging="isDragging"
                      :mobile-selected-staff-id="mobileAssignStaffId"
                      :enable-tap-assign="isTapAssignActive"
                      @job-click="viewJob"
                      @load-more="loadMoreJobs(status.key)"
                      @sortable-ready="handleSortableReady"
                      @staff-assigned="handleStaffAssigned"
                      @staff-unassigned="handleStaffUnassigned"
                      @status-change="openStatusDrawer"
                      class="kanban-column-responsive"
                    />
                  </div>
                </div>
              </div>

              <div class="hidden lg:block">
                <div class="w-full mx-auto px-2 overflow-x-auto">
                  <div
                    class="grid gap-2 xl:gap-3"
                    :style="`grid-template-columns: repeat(${visibleStatusChoices.length}, minmax(0, 1fr))`"
                  >
                    <KanbanColumn
                      v-for="status in visibleStatusChoices"
                      :key="status.key"
                      :status="status"
                      :jobs="getSortedJobsByStatus(status.key)"
                      :is-loading="isLoading"
                      :is-dragging="isDragging"
                      :mobile-selected-staff-id="mobileAssignStaffId"
                      :enable-tap-assign="isTapAssignActive"
                      @job-click="viewJob"
                      @load-more="loadMoreJobs(status.key)"
                      @sortable-ready="handleSortableReady"
                      @staff-assigned="handleStaffAssigned"
                      @staff-unassigned="handleStaffUnassigned"
                      @status-change="openStatusDrawer"
                      class="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <AdvancedSearchDialog
      :is-open="showAdvancedSearchDialog"
      :filters="advancedFilters"
      :is-loading="isLoading"
      @close="showAdvancedSearchDialog = false"
      @search="handleAdvancedSearchFromDialog"
      @clear-filters="clearFilters"
    />

    <Drawer v-model:open="statusDrawerOpen">
      <DrawerContent class="max-h-[85vh]">
        <div class="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle>Update Job Status</DrawerTitle>
            <DrawerDescription v-if="statusDrawerJob">
              Job #{{ statusDrawerJob.job_number }} - {{ statusDrawerJob.client_name }}
            </DrawerDescription>
            <DrawerDescription v-else>Select a job to update.</DrawerDescription>
          </DrawerHeader>

          <div v-if="statusDrawerJob" class="px-4 pb-4 space-y-4">
            <div class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="text-xs text-slate-500">Current status</p>
                  <p class="text-sm font-semibold text-slate-900">
                    {{ currentStatusLabel }}
                  </p>
                </div>
                <span
                  class="text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-1 rounded-full"
                >
                  {{ currentStatusLabel }}
                </span>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                v-for="option in statusOptions"
                :key="option.key"
                type="button"
                class="group w-full text-left border rounded-xl p-3 transition"
                :class="
                  option.key === currentStatusKey
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                "
                :disabled="isStatusUpdating"
                @click="applyJobStatus(option.key)"
              >
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <div class="text-sm font-semibold text-slate-900">{{ option.label }}</div>
                    <div v-if="option.tooltip" class="text-xs text-slate-500 mt-1">
                      {{ option.tooltip }}
                    </div>
                  </div>
                  <div class="mt-0.5">
                    <Loader2
                      v-if="statusUpdateKey === option.key"
                      class="h-4 w-4 animate-spin text-blue-600"
                    />
                    <Check
                      v-else-if="option.key === currentStatusKey"
                      class="h-4 w-4 text-blue-600"
                    />
                  </div>
                </div>
              </button>
            </div>

            <p class="text-xs text-slate-500">Tap a status to update. Changes save immediately.</p>
          </div>

          <DrawerFooter>
            <DrawerClose as-child>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onUnmounted, onMounted, nextTick, watch, computed } from 'vue'
import { toast } from 'vue-sonner'
import { useMediaQuery } from '@vueuse/core'
import { Search, Check, Loader2 } from 'lucide-vue-next'
import { useRoute } from 'vue-router'
import KanbanColumn from '@/components/KanbanColumn.vue'
import AppLayout from '@/components/AppLayout.vue'
import StaffPanel from '@/components/StaffPanel.vue'
import AdvancedSearchDialog from '@/components/AdvancedSearchDialog.vue'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { useOptimizedKanban } from '@/composables/useOptimizedKanban'
import { useOptimizedDragAndDrop } from '../composables/useOptimizedDragAndDrop'
import { useJobsStore } from '@/stores/jobs'
import { KanbanCategorizationService } from '@/services/kanban-categorization.service'
import type { AdvancedFilters } from '@/constants/advanced-filters'
import { schemas } from '@/api/generated/api'
import type { z } from 'zod'

type KanbanStaff = z.infer<typeof schemas.KanbanStaff>
type KanbanJob = z.infer<typeof schemas.KanbanJob>
type StatusOption = {
  key: string
  label: string
  tooltip?: string
}

const jobsStore = useJobsStore()
const isDesktop = useMediaQuery('(min-width: 768px)')
const route = useRoute()
const mobileAssignStaffId = ref<string | null>(null)
const mobileAssignStaffName = ref('')
const isTapAssignActive = computed(() => !isDesktop.value && Boolean(mobileAssignStaffId.value))
const statusDrawerOpen = ref(false)
const statusDrawerJob = ref<KanbanJob | null>(null)
const statusUpdateKey = ref<string | null>(null)

const syncAllowScrollMeta = () => {
  route.meta.allowScroll = !isDesktop.value
}

const clearMobileAssignSelection = () => {
  mobileAssignStaffId.value = null
  mobileAssignStaffName.value = ''
}

watch(
  isDesktop,
  (value) => {
    syncAllowScrollMeta()
    if (value) {
      clearMobileAssignSelection()
    }
  },
  { immediate: true },
)

watch(statusDrawerOpen, (open) => {
  if (!open) {
    statusDrawerJob.value = null
    statusUpdateKey.value = null
  }
})

const handleMobileAssignSelect = (staff: KanbanStaff) => {
  if (isDesktop.value) {
    return
  }

  if (mobileAssignStaffId.value === staff.id) {
    clearMobileAssignSelection()
    return
  }

  mobileAssignStaffId.value = staff.id
  mobileAssignStaffName.value = staff.display_name
}

onMounted(() => {
  jobsStore.setCurrentContext('kanban')
})

onUnmounted(() => {
  if (jobsStore.currentContext === 'kanban') {
    jobsStore.setCurrentContext(null)
  }
  route.meta.allowScroll = false
  clearMobileAssignSelection()
})

const {
  isLoading,
  searchQuery,
  advancedFilters,
  activeStaffFilters,
  selectedMobileStatus,
  statusChoices,

  visibleStatusChoices,

  getJobsByStatus,

  loadJobs,
  handleSearch,
  handleAdvancedSearch,
  clearFilters,
  loadMoreJobs,
  viewJob,
  updateJobStatus,
  reorderJob,
  handleStaffFilterChanged,
  revalidateColumns,
} = useOptimizedKanban(() => {
  nextTick(() => {
    initialiseSortableForAllColumns()
    // Ensure draft column is always initialized
    setTimeout(() => {
      ensureDraftColumnInitialized()
    }, 100)
  })
})

const openStatusDrawer = (job: KanbanJob) => {
  statusDrawerJob.value = job
  statusDrawerOpen.value = true
}

const resolveJobStatus = (job: KanbanJob | null): string => {
  if (!job) return ''
  return String(job.status_key || job.status || '')
}

const formatStatusLabel = (statusKey: string): string => {
  if (!statusKey) return 'Unknown'
  return statusKey
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const currentStatusKey = computed(() => resolveJobStatus(statusDrawerJob.value))

const statusOptions = computed<StatusOption[]>(() => {
  const seen = new Set<string>()
  const options: StatusOption[] = []
  const addOption = (option: StatusOption) => {
    if (seen.has(option.key)) return
    seen.add(option.key)
    options.push(option)
  }

  visibleStatusChoices.value.forEach((choice) => addOption(choice))
  statusChoices.value.forEach((choice) => addOption(choice))

  const current = currentStatusKey.value
  if (current && !seen.has(current)) {
    addOption({ key: current, label: formatStatusLabel(current), tooltip: 'Current status' })
  }

  return options
})

const statusLabelMap = computed(() => {
  const map = new Map<string, StatusOption>()
  statusOptions.value.forEach((option) => map.set(option.key, option))
  return map
})

const currentStatusLabel = computed(() => {
  const key = currentStatusKey.value
  return statusLabelMap.value.get(key)?.label ?? formatStatusLabel(key)
})

const isStatusUpdating = computed(() => statusUpdateKey.value !== null)

const applyJobStatus = async (statusKey: string) => {
  if (!statusDrawerJob.value || !statusKey || isStatusUpdating.value) return

  const jobId = statusDrawerJob.value.id
  if (!jobId) return

  if (statusKey === currentStatusKey.value) {
    statusDrawerOpen.value = false
    return
  }

  statusUpdateKey.value = statusKey
  const label = statusLabelMap.value.get(statusKey)?.label ?? formatStatusLabel(statusKey)
  const updated = await updateJobStatus(jobId, statusKey)

  if (updated) {
    toast.success(`Status updated to ${label}`)
    statusDrawerOpen.value = false
  } else {
    toast.error('Failed to update job status')
  }

  statusUpdateKey.value = null
}

const mobileColumnsScroller = ref<HTMLElement | null>(null)
const mobileColumnRefs = new Map<string, HTMLElement>()

const setMobileColumnRef = (statusKey: string, element: HTMLElement | null) => {
  if (!element) {
    mobileColumnRefs.delete(statusKey)
    return
  }
  mobileColumnRefs.set(statusKey, element)
}

const selectMobileStatus = (statusKey: string) => {
  if (statusKey) {
    selectedMobileStatus.value = statusKey
  }
}

const scrollMobileColumnIntoView = (statusKey: string) => {
  if (!statusKey || !mobileColumnsScroller.value) {
    return
  }

  const container = mobileColumnsScroller.value
  const targetColumn = mobileColumnRefs.get(statusKey)

  if (!targetColumn) {
    return
  }

  const targetOffset = targetColumn.offsetLeft - container.offsetLeft
  const centeredPosition = targetOffset - (container.clientWidth - targetColumn.clientWidth) / 2

  container.scrollTo({
    left: Math.max(0, centeredPosition),
    behavior: 'smooth',
  })
}

watch(
  selectedMobileStatus,
  (statusKey) => {
    if (!statusKey) {
      return
    }
    nextTick(() => {
      scrollMobileColumnIntoView(statusKey)
    })
  },
  { flush: 'post', immediate: true },
)

watch(mobileColumnsScroller, (scroller) => {
  if (scroller && selectedMobileStatus.value) {
    nextTick(() => {
      scrollMobileColumnIntoView(selectedMobileStatus.value)
    })
  }
})

// Staff assignment handler with granular revalidation
const handleStaffAssigned = async (payload: { staffId: string; jobId: string }) => {
  try {
    // Find which column contains this job for revalidation
    let jobColumn: string | null = null
    for (const status of visibleStatusChoices.value) {
      const jobs = getJobsByStatus.value(status.key)
      if (jobs.some((job) => job.id === payload.jobId)) {
        jobColumn = status.key
        break
      }
    }

    if (jobColumn) {
      // Revalidate only the affected column
      await revalidateColumns([jobColumn])
    }

    console.log(`✅ Staff ${payload.staffId} assigned to job ${payload.jobId}`)
  } catch (error) {
    console.error('Error handling staff assignment:', error)
    toast.error('Failed to update job assignments')
  }
}

// Staff unassignment handler with granular revalidation
const handleStaffUnassigned = async (payload: { staffId: string; jobId: string }) => {
  try {
    // Find which column contains this job for revalidation
    let jobColumn: string | null = null
    for (const status of visibleStatusChoices.value) {
      const jobs = getJobsByStatus.value(status.key)
      if (jobs.some((job) => job.id === payload.jobId)) {
        jobColumn = status.key
        break
      }
    }

    if (jobColumn) {
      // Revalidate only the affected column
      await revalidateColumns([jobColumn])
    }

    console.log(`✅ Staff ${payload.staffId} unassigned from job ${payload.jobId}`)
  } catch (error) {
    console.error('Error handling staff unassignment:', error)
    toast.error('Failed to update job assignments')
  }
}

const showAdvancedSearchDialog = ref(false)

const handleAdvancedSearchFromDialog = async (filters: AdvancedFilters) => {
  try {
    Object.assign(advancedFilters.value, filters)
    await handleAdvancedSearch()
  } catch (error) {
    console.error('Error performing advanced search from dialog:', error)
    toast.error('Search failed')
  }
}

const { isDragging, initializeSortable, destroyAllSortables } = useOptimizedDragAndDrop(
  (event, payload) => {
    if (event === 'job-moved') {
      const { jobId, fromStatus, toStatus, beforeId, afterId } = payload
      if (fromStatus !== toStatus) {
        const actualStatus = KanbanCategorizationService.getDefaultStatusForColumn(toStatus)
        // First update the status
        void updateJobStatus(jobId, actualStatus)
        // Then reorder to the correct position if we have positioning info
        if (beforeId || afterId) {
          setTimeout(() => {
            reorderJob(jobId, beforeId, afterId, toStatus)
          }, 500) // Wait for status update to complete
        }
      } else {
        reorderJob(jobId, beforeId, afterId, toStatus)
      }
    }
  },
)

const sortableInitialized = ref<Set<string>>(new Set())
const columnsReadyForSortable = ref<Map<string, HTMLElement>>(new Map())

const handleSortableReady = (element: HTMLElement, status: string) => {
  console.log(`🔧 handleSortableReady called for ${status}`, {
    status,
    element,
    elementConnected: element.isConnected,
    elementDataStatus: element.dataset.status,
    elementId: element.id,
    elementClasses: element.className,
  })

  columnsReadyForSortable.value.set(status, element)

  const columnJobs = getJobsByStatus.value(status)

  if (status === 'draft') {
    console.log(`🎯 DRAFT COLUMN: handleSortableReady called`, {
      status,
      element,
      jobsCount: columnJobs.length,
      alreadyInitialized: sortableInitialized.value.has(status),
      elementConnected: element.isConnected,
      elementDataStatus: element.dataset.status,
    })
  }

  // Special case for draft column - always initialize even without jobs
  if (status === 'draft') {
    if (!sortableInitialized.value.has(status)) {
      console.log(`🎯 DRAFT COLUMN: Initializing draft column regardless of job count`)
      initializeSortableForColumn(status, element)
    }
  } else if (columnJobs.length > 0 && !sortableInitialized.value.has(status)) {
    initializeSortableForColumn(status, element)
  }
}

const initializeSortableForColumn = (status: string, element: HTMLElement) => {
  if (sortableInitialized.value.has(status)) {
    return
  }

  if (status === 'draft') {
    console.log(`🎯 DRAFT COLUMN: initializeSortableForColumn called`, {
      status,
      element,
      elementConnected: element.isConnected,
      elementDataStatus: element.dataset.status,
      hasChildren: element.children.length > 0,
    })
  }

  nextTick(() => {
    // Special handling for draft column - ensure it's always initialized
    if (status === 'draft') {
      console.log(`🎯 DRAFT COLUMN: About to initialize sortable in nextTick`)

      // Force re-initialization for draft column if needed
      if (!element.isConnected) {
        console.warn(`🎯 DRAFT COLUMN: Element not connected, skipping initialization`)
        return
      }
    }

    initializeSortable(element, status)
    sortableInitialized.value.add(status)

    if (status === 'draft') {
      console.log(`🎯 DRAFT COLUMN: Sortable initialized successfully`)
    }
  })
}

const initialiseSortableForAllColumns = () => {
  columnsReadyForSortable.value.forEach((element, status) => {
    if (!sortableInitialized.value.has(status)) {
      initializeSortableForColumn(status, element)
    }
  })

  // Special handling for draft column - force initialization even if no jobs
  const draftElement = columnsReadyForSortable.value.get('draft')
  if (draftElement && !sortableInitialized.value.has('draft')) {
    console.log(`🎯 DRAFT COLUMN: Force initializing draft column even without jobs`)
    initializeSortableForColumn('draft', draftElement)
  }
}

// New function to specifically handle draft column initialization issues
const ensureDraftColumnInitialized = () => {
  const draftElement = columnsReadyForSortable.value.get('draft')
  if (draftElement) {
    console.log(`🎯 DRAFT COLUMN: Ensuring draft column is initialized`, {
      element: draftElement,
      isInitialized: sortableInitialized.value.has('draft'),
      isConnected: draftElement.isConnected,
      dataStatus: draftElement.dataset.status,
    })

    if (!sortableInitialized.value.has('draft')) {
      initializeSortableForColumn('draft', draftElement)
    }
  }
}

function getSortedJobsByStatus(statusKey: string) {
  // Use the filtered getJobsByStatus from useKanban instead of directly calling KanbanCategorizationService
  return getJobsByStatus.value(statusKey)
}

onMounted(async () => {
  await loadJobs()
})

onUnmounted(() => {
  destroyAllSortables()
  sortableInitialized.value.clear()
  columnsReadyForSortable.value.clear()
})
</script>

<style scoped>
.mobile-column {
  min-width: 320px;
  max-width: 400px;
  width: 100%;
}

.staff-panel-container {
  width: 100%;
  background: #ffffff;
  border-radius: 1.5rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  padding: 0.5rem 0.75rem 1rem;
}

.staff-panel-scroll {
  overflow-x: auto;
  padding: 0 0.25rem 0.5rem;
}

.staff-panel-scroll::-webkit-scrollbar {
  height: 6px;
}

.staff-panel-scroll::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.6);
  border-radius: 999px;
}

.staff-panel-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.staff-panel-scroll :deep(.staff-scroll-list) {
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  padding-bottom: 0.25rem;
}

.staff-panel-scroll :deep(.staff-scroll-list .staff-item) {
  flex: 0 0 auto;
}

@media (max-width: 767px) {
  .staff-panel-scroll {
    overflow-x: hidden;
    overflow-y: auto;
    max-height: 220px;
  }
}

.mobile-assign-info {
  margin-bottom: 0.5rem;
}

.mobile-status-toolbar {
  backdrop-filter: blur(8px);
}

.mobile-status-pills {
  scrollbar-width: none;
  padding-bottom: 0.25rem;
}

.mobile-status-pills::-webkit-scrollbar {
  display: none;
}

.mobile-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 0.8rem;
  font-size: 0.8rem;
  border-radius: 999px;
  border: 1px solid rgba(37, 99, 235, 0.3);
  background-color: rgba(255, 255, 255, 0.8);
  color: #1d4ed8;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.mobile-status-pill--active {
  background-color: #1d4ed8;
  color: #fff;
  border-color: #1d4ed8;
  box-shadow: 0 10px 20px rgba(59, 130, 246, 0.35);
}

.mobile-status-pill__count {
  font-weight: 700;
  font-size: 0.75rem;
  opacity: 0.85;
}

.mobile-columns-wrapper {
  position: relative;
}

.mobile-columns-scroller {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding: 0.5rem 0.25rem 1.5rem;
  scrollbar-width: thin;
}

.mobile-columns-scroller::-webkit-scrollbar {
  height: 6px;
}

.mobile-columns-scroller::-webkit-scrollbar-track {
  background: transparent;
}

.mobile-columns-scroller::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.5);
  border-radius: 999px;
}

.mobile-column-panel {
  flex: 0 0 calc(100vw - 3rem);
  scroll-snap-align: center;
  max-width: 420px;
}

@media (min-width: 480px) {
  .mobile-column-panel {
    flex-basis: calc(100vw - 6rem);
  }
}

@media (max-width: 767px) {
  .mobile-column :deep(.kanban-column) {
    min-width: 320px;
    max-width: 400px;
    width: 100%;
  }

  .mobile-column :deep(.job-card) {
    min-width: 280px;
    width: 100%;
    padding: 16px;
  }

  .mobile-column :deep(.p-1) {
    padding: 12px;
  }

  .mobile-column :deep(.space-y-1 > * + *) {
    margin-top: 8px;
  }
}

.tablet-column {
  min-width: 200px;
  max-width: 280px;
  width: 100%;
}

@media (min-width: 768px) and (max-width: 1023px) {
  .tablet-column {
    width: calc((100% - 0.75rem) / 4);
    min-width: 160px;
    max-width: 200px;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .tablet-column :deep(.kanban-column) {
    min-width: 160px;
    max-width: 200px;
    width: 100%;
    height: fit-content;
  }
}

[data-is-clone='true'] {
  pointer-events: none !important;
  z-index: 9999;
}

.sortable-ghost,
.staff-sortable-ghost {
  opacity: 0.3 !important;
  pointer-events: none !important;
}

.staff-sortable-chosen {
  opacity: 0.8 !important;
}

.staff-sortable-drag {
  opacity: 0.6 !important;
  transform: rotate(5deg);
}

.staff-list [data-is-clone='true'],
.sortable-chosen[data-is-clone='true'] {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
}

.is-staff-dragging * {
  will-change: transform;
  transform: translate3d(0, 0, 0);
}

[style*='position: absolute'][style*='left: -9999px'] {
  display: none !important;
}

/* Staff drag visual feedback on job cards */
.job-card {
  transition: outline 0.2s ease;
}

.job-card:hover {
  cursor: default;
}

/* When staff is being dragged, job cards get visual feedback */
.sortable-fallback {
  display: none !important;
}

/* Drag handle styles */
.drag-handle {
  transition: all 0.2s ease;
  font-size: 8px;
  line-height: 1;
}

.drag-handle:hover {
  transform: scale(1.1);
  background-color: #2563eb !important;
}

/* Simple scrolling styles */
.scroll-smooth {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

/* Custom scrollbar styling */
.scroll-smooth::-webkit-scrollbar {
  width: 8px;
}

.scroll-smooth::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.scroll-smooth::-webkit-scrollbar-thumb {
  background: #3b82f6;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.scroll-smooth::-webkit-scrollbar-thumb:hover {
  background: #2563eb;
}

/* Firefox scrollbar */
.scroll-smooth {
  scrollbar-width: thin;
  scrollbar-color: #3b82f6 #f1f5f9;
}

/* Special styles for draft column drag and drop */
.sortable-ghost-draft {
  opacity: 0.4 !important;
  background: #fef3c7 !important;
  border: 2px dashed #f59e0b !important;
  transform: rotate(2deg) !important;
}

.sortable-chosen-draft {
  opacity: 0.9 !important;
  transform: scale(1.05) !important;
  box-shadow: 0 8px 25px rgba(245, 158, 11, 0.3) !important;
  border-color: #f59e0b !important;
}

.sortable-drag-draft {
  opacity: 0.7 !important;
  transform: rotate(-2deg) scale(1.02) !important;
  box-shadow: 0 12px 30px rgba(245, 158, 11, 0.4) !important;
}

/* Ensure draft column drop zones are always active */
[data-status='draft'] {
  min-height: 200px !important;
}

[data-status='draft']:empty::after {
  content: 'Drop jobs here to set as Draft';
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  color: #9ca3af;
  font-size: 14px;
  text-align: center;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  margin: 8px;
  background: #f9fafb;
}
</style>
