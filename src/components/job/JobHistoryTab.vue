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

          <div v-if="events && events.length > 0" class="relative">
            <!-- Timeline line -->
            <div class="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            <div class="space-y-6">
              <div
                v-for="event in events"
                :key="event.id"
                class="relative flex items-start group hover:bg-gray-50 -mx-3 px-3 py-2 rounded-lg transition-colors duration-200"
              >
                <!-- Timeline dot -->
                <div class="relative flex-shrink-0">
                  <div
                    class="w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow-sm"
                  ></div>
                </div>

                <!-- Event content -->
                <div class="ml-6 flex-1 min-w-0">
                  <div
                    class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm group-hover:shadow-md transition-shadow duration-200"
                  >
                    <p class="text-sm text-gray-900 leading-relaxed">{{ event.description }}</p>
                    <div
                      class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100"
                    >
                      <div class="flex items-center space-x-3 text-xs text-gray-500">
                        <span class="font-medium">{{
                          formatDate(event.timestamp || event.created_date)
                        }}</span>
                        <span>•</span>
                        <span class="px-2 py-1 bg-gray-100 rounded-full">{{
                          formatEventType(event.event_type) || 'General'
                        }}</span>
                        <span v-if="event.staff">•</span>
                        <span v-if="event.staff" class="font-medium text-gray-700">{{
                          event.staff
                        }}</span>
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
import { ref, onMounted } from 'vue'
import { useJobEvents } from '../../composables/useJobEvents'
import { Collapsible, CollapsibleContent } from '../ui/collapsible'
import { ChevronDown } from 'lucide-vue-next'
import { formatEventType } from '@/utils/string-formatting'

interface Props {
  jobId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'event-added': [event: unknown]
}>()

const isAddEventOpen = ref(false)
const newEventDescription = ref('')
const isAdding = ref(false)

const { jobEvents: events, addEvent: addJobEvent } = useJobEvents(ref(props.jobId))

onMounted(() => {
  // Events are automatically loaded by the composable
})

const formatDate = (dateString: string | unknown) => {
  if (!dateString || typeof dateString !== 'string') return ''
  return new Date(dateString).toLocaleString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const addEvent = async () => {
  if (!newEventDescription.value.trim()) return

  isAdding.value = true
  try {
    await addJobEvent(newEventDescription.value.trim())
    emit('event-added', { description: newEventDescription.value.trim() })
    newEventDescription.value = ''
    isAddEventOpen.value = false
  } catch (error) {
    console.error('Failed to add event:', error)
  } finally {
    isAdding.value = false
  }
}

const cancelAddEvent = () => {
  newEventDescription.value = ''
  isAddEventOpen.value = false
}
</script>
