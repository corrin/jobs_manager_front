<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto"
    @click.self="closeModal"
  >
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Overlay -->
      <div
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        @click="closeModal"
      ></div>

      <!-- Modal -->
      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
        <!-- Header -->
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg leading-6 font-medium text-gray-900">
                  Job History
                </h3>
                <button
                  @click="showAddEventForm = !showAddEventForm"
                  class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Add Event
                </button>
              </div>

              <!-- Add Event Form -->
              <div v-if="showAddEventForm" class="mb-4 p-4 bg-gray-50 rounded">
                <div class="mb-3">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Event Description
                  </label>
                  <textarea
                    v-model="newEventDescription"
                    rows="3"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Describe what happened..."
                  ></textarea>
                </div>
                <div class="flex space-x-2">
                  <button
                    @click="addEvent"
                    class="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    Add Event
                  </button>
                  <button
                    @click="cancelAddEvent"
                    class="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              <!-- Events List -->
              <div class="max-h-96 overflow-y-auto">
                <div
                  v-for="event in events"
                  :key="event.id"
                  class="mb-3 p-3 border border-gray-200 rounded"
                >
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <p class="text-sm text-gray-900">{{ event.description }}</p>
                      <p class="text-xs text-gray-500 mt-1">
                        {{ formatDate(event.timestamp) }} by {{ event.staff }}
                      </p>
                    </div>
                    <span
                      class="px-2 py-1 text-xs rounded"
                      :class="getEventTypeClass(event.event_type)"
                    >
                      {{ event.event_type }}
                    </span>
                  </div>
                </div>

                <div v-if="events.length === 0" class="text-center text-gray-500 py-8">
                  No events recorded yet.
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            @click="closeModal"
            type="button"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { JobEvent } from '@/services/jobRestService'

// Props
interface Props {
  jobId: string
  events: JobEvent[]
  isOpen: boolean
}

defineProps<Props>()

// Events
const emit = defineEmits<{
  close: []
  'event-added': [event: JobEvent]
}>()

// Local state
const showAddEventForm = ref(false)
const newEventDescription = ref('')

// Methods
const closeModal = () => {
  emit('close')
}

const addEvent = () => {
  if (newEventDescription.value.trim()) {
    // Create a mock event for now
    const newEvent: JobEvent = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      event_type: 'manual_note',
      description: newEventDescription.value.trim(),
      staff: 'Current User'
    }

    emit('event-added', newEvent)
    cancelAddEvent()
  }
}

const cancelAddEvent = () => {
  showAddEventForm.value = false
  newEventDescription.value = ''
}

const formatDate = (timestamp: string) => {
  return new Date(timestamp).toLocaleString()
}

const getEventTypeClass = (eventType: string) => {
  switch (eventType) {
    case 'job_created':
      return 'bg-green-100 text-green-800'
    case 'job_updated':
      return 'bg-blue-100 text-blue-800'
    case 'manual_note':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
</script>
