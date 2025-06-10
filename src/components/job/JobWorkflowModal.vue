<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[99999] overflow-y-auto" @click.self="closeModal">
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <!-- Overlay -->
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="closeModal"></div>

        <!-- Modal -->
        <div
          class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full z-[100000] relative">
          <!-- Header -->
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Workflow Settings
                </h3>

                <p class="text-sm text-gray-500 mb-4">
                  Configure job status, delivery dates, and workflow actions.
                </p>

                <!-- Job Status -->
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Job Status
                    </label>
                    <select v-model="localJobData.status"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <!-- Delivery Date -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Date
                    </label>
                    <input v-model="localJobData.delivery_date" type="date"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>

                  <!-- Quote Acceptance Date -->
                  <div v-if="localJobData.quote_acceptance_date">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Quote Accepted On
                    </label>
                    <input :value="formatDate(localJobData.quote_acceptance_date)" type="text" readonly
                      class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50" />
                  </div>

                  <!-- Status Checkboxes -->
                  <div class="space-y-3">
                    <h4 class="text-sm font-medium text-gray-700">Job Status Tracking</h4>

                    <div class="flex items-center">
                      <input v-model="localJobData.quoted" type="checkbox"
                        class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                      <label class="ml-2 text-sm text-gray-700">
                        Already Quoted?
                        <div class="text-xs text-gray-500">Indicator of whether the job was already quoted in Xero</div>
                      </label>
                    </div>

                    <div class="flex items-center">
                      <input v-model="localJobData.invoiced" type="checkbox"
                        class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                      <label class="ml-2 text-sm text-gray-700">
                        Already Invoiced?
                        <div class="text-xs text-gray-500">Indicator of whether the job was already invoiced in Xero
                        </div>
                      </label>
                    </div>

                    <div class="flex items-center">
                      <input v-model="localJobData.paid" type="checkbox"
                        class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                      <label class="ml-2 text-sm text-gray-700">
                        Job Paid
                      </label>
                    </div>
                  </div>

                  <!-- Workflow Actions -->
                  <div class="space-y-3">
                    <h4 class="text-sm font-medium text-gray-700">Workflow Actions</h4>

                    <div class="flex flex-wrap gap-2">
                      <button @click="acceptQuote" :disabled="!canAcceptQuote"
                        class="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
                        Accept Quote
                      </button>

                      <button @click="createQuote"
                        class="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                        Create Quote
                      </button>

                      <button @click="invoiceJob" :disabled="localJobData.invoiced"
                        class="px-3 py-2 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
                        Invoice Job
                      </button>

                      <button @click="contactClient"
                        class="px-3 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700">
                        Contact Client
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button @click="saveWorkflow" type="button"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 sm:ml-3 sm:w-auto sm:text-sm">
              Save Changes
            </button>
            <button @click="closeModal" type="button"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Teleport } from 'vue'
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
  'workflow-updated': [data: Partial<JobData>]
}>()

// Local job data for editing
const localJobData = ref<Partial<JobData>>({})

// Watch for props changes
watch(() => props.jobData, (newJobData) => {
  if (newJobData) {
    localJobData.value = { ...newJobData }
  }
}, { immediate: true })

// Computed properties
const canAcceptQuote = computed(() => {
  // Can accept quote if there's a total cost greater than 0
  // This would need to be calculated from pricing data
  return true // Placeholder
})

// Methods
const closeModal = () => {
  emit('close')
}

const saveWorkflow = () => {
  if (props.jobData && localJobData.value) {
    emit('workflow-updated', localJobData.value)
  }
  closeModal()
}

const acceptQuote = () => {
  if (localJobData.value) {
    localJobData.value.quote_acceptance_date = new Date().toISOString()
    localJobData.value.quoted = true
    // TODO: Lock quote grids, update status
    console.log('Quote accepted')
  }
}

const createQuote = () => {
  // TODO: Generate and open quote PDF
  console.log('Creating quote...')
}

const invoiceJob = () => {
  // TODO: Create invoice in Xero
  console.log('Creating invoice...')
}

const contactClient = () => {
  // TODO: Open email client with job details
  console.log('Opening email client...')
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}
</script>
