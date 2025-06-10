<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[9999] overflow-y-auto" @click.self="closeModal">
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <!-- Overlay -->
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="closeModal"></div>

        <!-- Modal -->
        <div
          class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full z-[10000]">
          <!-- Header -->
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Job Settings
                </h3>

                <!-- Cliente -->
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Client
                  </label>
                  <input v-model="localJobData.client_name" type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    readonly />
                </div>

                <!-- Nome -->
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Job Name
                  </label>
                  <input v-model="localJobData.name" type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>

                <!-- Toggle Itemised Pricing -->
                <div class="mb-4">
                  <label class="flex items-center">
                    <input v-model="localJobData.complex_job" type="checkbox" class="mr-2" />
                    <span class="text-sm font-medium text-gray-700">Itemised Pricing</span>
                  </label>
                </div>

                <!-- Pricing Type -->
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Pricing Type
                  </label>
                  <select v-model="localJobData.pricing_methodology"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="time_materials">Time & Materials</option>
                    <option value="fixed_price">Fixed Price</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button @click="saveSettings" type="button"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm">
              Save
            </button>
            <button @click="closeModal" type="button"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { JobData } from '@/services/jobRestService'

// Props
interface Props {
  jobData: JobData | null
  isOpen: boolean
}

const props = defineProps<Props>()

// Events
const emit = defineEmits<{
  close: []
  'job-updated': [job: JobData]
}>()

// Local copy of job data for editing
const localJobData = ref<Partial<JobData>>({})

// Watch for props changes
watch(() => props.jobData, (newJobData) => {
  if (newJobData) {
    localJobData.value = { ...newJobData }
  }
}, { immediate: true })

// Methods
const closeModal = () => {
  emit('close')
}

const saveSettings = () => {
  if (props.jobData && localJobData.value) {
    // Emit the updated job data
    emit('job-updated', {
      ...props.jobData,
      ...localJobData.value
    } as JobData)
  }
  closeModal()
}
</script>
