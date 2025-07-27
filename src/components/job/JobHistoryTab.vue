<template>
  <div class="h-full overflow-y-auto">
    <div class="max-w-4xl">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Job History</h2>
          <p class="text-sm text-gray-600">View and manage the history of events for this job.</p>
        </div>
        <button
          @click="showAddEventForm = !showAddEventForm"
          class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          Add Event
        </button>
      </div>

      <div class="space-y-4">
        <div v-if="showAddEventForm" class="p-4 bg-gray-50 rounded">
          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-800 mb-2"> Event Description </label>
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
              :disabled="isAdding || !newEventDescription.trim()"
            >
              <span v-if="isAdding">Adding...</span>
              <span v-else>Add Event</span>
            </button>
            <button
              @click="cancelAddEvent"
              class="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>

        <div class="max-h-96 overflow-y-auto space-y-3">
          <div v-if="events && events.length > 0">
            <div v-for="event in events" :key="event.id" class="p-3 border border-gray-200 rounded">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <p class="text-sm text-gray-900">{{ event.description }}</p>
                  <div class="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                    <span>{{ formatDate(event.created_date) }}</span>
                    <span>•</span>
                    <span>{{ event.event_type || 'General' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-6 text-gray-500">No events recorded yet.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useJobEvents } from '@/composables/useJobEvents'

interface Props {
  jobId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'event-added': [event: unknown]
}>()

const showAddEventForm = ref(false)
const newEventDescription = ref('')
const isAdding = ref(false)

const { jobEvents: events, addEvent: addJobEvent } = useJobEvents(ref(props.jobId))

onMounted(() => {
  // Events are automatically loaded by the composable
})

const formatDate = (dateString: string) => {
  if (!dateString) return ''
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
    showAddEventForm.value = false
  } catch (error) {
    console.error('Failed to add event:', error)
  } finally {
    isAdding.value = false
  }
}

const cancelAddEvent = () => {
  newEventDescription.value = ''
  showAddEventForm.value = false
}
</script>
