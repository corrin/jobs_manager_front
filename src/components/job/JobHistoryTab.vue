<template>
  <div class="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto bg-gray-50/50">
    <div class="max-w-7xl mx-auto">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Job History</h2>
          <p class="text-sm text-gray-600">View and manage the history of events for this job.</p>
        </div>
        <button
          @click="isAddEventOpen = !isAddEventOpen"
          class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
        >
          <ChevronDown
            :class="[
              'w-4 h-4 mr-2 transition-transform duration-200',
              isAddEventOpen ? 'rotate-180' : '',
            ]"
          />
          Add Event
        </button>
      </div>

      <div class="space-y-6">
        <!-- Collapsible Add Event Form -->
        <Collapsible v-model:open="isAddEventOpen">
          <CollapsibleContent>
            <div class="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Add New Event</h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2"
                    >Event Description</label
                  >
                  <textarea
                    v-model="newEventDescription"
                    rows="3"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe what happened..."
                  ></textarea>
                </div>
                <div class="flex justify-end space-x-3">
                  <button
                    @click="cancelAddEvent"
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    @click="addEvent"
                    class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="isAdding || !newEventDescription.trim()"
                  >
                    <span v-if="isAdding">Adding...</span>
                    <span v-else>Add Event</span>
                  </button>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <!-- Timeline -->
        <div class="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 class="text-lg font-medium text-gray-900 mb-6">Event Timeline</h3>

          <div v-if="isLoading" class="text-center py-12">
            <div
              class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"
            ></div>
            <p class="text-gray-500">Loading events...</p>
          </div>

          <div v-else-if="timelineItems.length > 0" class="relative">
            <!-- Timeline line -->
            <div class="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            <div class="space-y-6">
              <div
                v-for="item in timelineItems"
                :key="item.id"
                class="relative flex items-start group hover:bg-gray-50 -mx-3 px-3 py-2 rounded-lg transition-colors duration-200"
              >
                <!-- Timeline dot -->
                <div class="relative flex-shrink-0">
                  <div
                    :class="[
                      'w-3 h-3 rounded-full border-2 border-white shadow-sm',
                      item.type === 'job_event'
                        ? 'bg-blue-600'
                        : item.type === 'costline_created'
                          ? 'bg-green-600'
                          : 'bg-amber-600',
                    ]"
                  ></div>
                </div>

                <!-- Event content -->
                <div class="ml-6 flex-1 min-w-0">
                  <div
                    class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm group-hover:shadow-md transition-shadow duration-200"
                  >
                    <p class="text-sm text-gray-900 leading-relaxed">{{ item.description }}</p>
                    <template v-if="item.costlineDesc">
                      <p class="text-xs text-gray-600 mt-1 italic">{{ item.costlineDesc }}</p>
                    </template>
                    <div
                      class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100"
                    >
                      <div class="flex items-center space-x-3 text-xs text-gray-500 flex-wrap">
                        <span class="font-medium">{{ formatDate(item.timestamp) }}</span>
                        <span>•</span>
                        <span
                          :class="[
                            'px-2 py-1 rounded-full',
                            item.type === 'job_event'
                              ? 'bg-blue-100 text-blue-700'
                              : item.type === 'costline_created'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700',
                          ]"
                        >
                          {{
                            item.type === 'job_event'
                              ? formatEventType(item.eventType) || 'General'
                              : item.type === 'costline_created'
                                ? 'Costline Created'
                                : 'Costline Updated'
                          }}
                        </span>
                        <template v-if="item.costlineKind">
                          <span>•</span>
                          <span
                            :class="[
                              'px-2 py-1 rounded-full capitalize',
                              getCostlineTypeColor(item.costlineKind),
                            ]"
                          >
                            {{ item.costlineKind }}
                          </span>
                        </template>
                        <template v-if="item.staff">
                          <span>•</span>
                          <span class="font-medium text-gray-700">{{ item.staff }}</span>
                        </template>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div v-else class="text-center py-12">
            <div
              class="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4"
            >
              <svg
                class="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            <h3 class="text-sm font-medium text-gray-900 mb-1">No events recorded yet</h3>
            <p class="text-sm text-gray-500">Get started by adding the first event to this job.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { Collapsible, CollapsibleContent } from '../ui/collapsible'
import { formatEventType } from '@/utils/string-formatting'
import { api } from '@/api/client'
import { schemas } from '@/api/generated/api'
import type { z } from 'zod'
import { toast } from 'vue-sonner'
import { debugLog } from '../../utils/debug'

type JobEventCreateRequest = z.infer<typeof schemas.JobEventCreateRequest>
type JobEventCreateResponse = z.infer<typeof schemas.JobEventCreateResponse>

// Timeline entry from the unified backend endpoint
// TODO: This will be replaced by schemas.TimelineEntry once schema is regenerated
interface TimelineEntry {
  id: string
  timestamp: string
  entry_type: 'job_event' | 'costline'
  description: string
  staff?: string | null
  event_type?: string
  // CostLine-specific fields
  cost_set_kind?: 'estimate' | 'quote' | 'actual'
  costline_kind?: 'time' | 'material' | 'adjust'
  quantity?: number
  unit_cost?: number
  unit_rev?: number
  total_cost?: number
  total_rev?: number
}

interface Props {
  jobId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'event-added': [event: JobEventCreateResponse['event']] }>()

// UI state
const isAddEventOpen = ref(false)
const newEventDescription = ref('')
const isAdding = ref(false)
const isLoading = ref(false)

const timelineEntries = ref<TimelineEntry[]>([])

// Transform timeline entries to camelCase format for template
const timelineItems = computed(() => {
  return timelineEntries.value.map((entry) => ({
    id: entry.id,
    timestamp: entry.timestamp,
    type:
      entry.entry_type === 'costline'
        ? entry.cost_set_kind === 'actual'
          ? 'costline_updated'
          : 'costline_created'
        : 'job_event',
    description: entry.description,
    staff: entry.staff || null,
    eventType: entry.event_type,
    costlineDesc: entry.cost_set_kind
      ? `${entry.cost_set_kind.charAt(0).toUpperCase() + entry.cost_set_kind.slice(1)} - ${entry.costline_kind || ''}`
      : null,
    costlineKind: entry.costline_kind,
  }))
})

async function loadTimeline() {
  if (!props.jobId) return
  isLoading.value = true
  try {
    const response = await api.job_rest_jobs_timeline_retrieve({ params: { job_id: props.jobId } })
    timelineEntries.value = response.timeline || []
  } catch (e) {
    toast.error('Failed to load timeline')
    debugLog('Failed to load timeline:', e)
    timelineEntries.value = []
  } finally {
    isLoading.value = false
  }
}

// Add a new manual event via REST
async function addEvent() {
  const description = newEventDescription.value.trim()
  if (!description || !props.jobId) return

  isAdding.value = true
  try {
    const body: JobEventCreateRequest = { description }
    const resp: JobEventCreateResponse = await api.job_rest_jobs_events_create(body, {
      params: { job_id: props.jobId },
    })

    if (resp.success && resp.event) {
      // Reload the full timeline to include the new event
      await loadTimeline()
      emit('event-added', resp.event)
      newEventDescription.value = ''
      isAddEventOpen.value = false
      toast.success('Event added')
    } else {
      toast.error('Could not add event')
    }
  } catch (e) {
    toast.error('Failed to add event')
    debugLog('Failed to add event:', e)
  } finally {
    isAdding.value = false
  }
}

function getCostlineTypeColor(type: 'time' | 'material' | 'adjust'): string {
  switch (type) {
    case 'time':
      return 'bg-purple-100 text-purple-700'
    case 'material':
      return 'bg-orange-100 text-orange-700'
    case 'adjust':
      return 'bg-pink-100 text-pink-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

function cancelAddEvent() {
  newEventDescription.value = ''
  isAddEventOpen.value = false
}

function formatDate(dateString: unknown) {
  if (!dateString || typeof dateString !== 'string') return ''
  return new Date(dateString).toLocaleString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

watch(
  () => props.jobId,
  () => {
    void loadTimeline()
  },
  { immediate: true },
)
</script>
