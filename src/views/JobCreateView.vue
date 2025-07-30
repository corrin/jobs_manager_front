<template>
  <AppLayout>
    <div class="flex flex-col min-h-screen">
      <div class="flex-shrink-0 p-4 border-b border-gray-200">
        <h1 class="text-xl font-bold text-gray-900">Create New Job</h1>
      </div>

      <div class="flex-1 p-6">
        <div class="max-w-6xl mx-auto">
          <form @submit.prevent="handleSubmit" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div class="space-y-6">
                <div>
                  <label
                    for="name"
                    class="block text-sm font-medium mb-2"
                    :class="formData.name.trim() ? 'text-gray-700' : 'text-red-600'"
                  >
                    Job Name *
                  </label>
                  <input
                    id="name"
                    v-model="formData.name"
                    type="text"
                    required
                    class="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    :class="[
                      errors.name
                        ? 'border-red-500'
                        : formData.name.trim()
                          ? 'border-gray-300'
                          : 'border-red-300 bg-red-50',
                    ]"
                    placeholder="Enter job name"
                  />
                  <p v-if="errors.name" class="mt-1 text-sm text-red-600">
                    {{ errors.name }}
                  </p>
                </div>

                <div>
                  <ClientLookup
                    id="client"
                    v-model="formData.client_name"
                    @update:selected-id="formData.client_id = $event"
                    @update:selected-client="handleClientSelection"
                    label="Client"
                    :required="true"
                    placeholder="Search for a client..."
                  />
                  <p v-if="errors.client_id" class="mt-1 text-sm text-red-600">
                    {{ errors.client_id }}
                  </p>
                </div>

                <div>
                  <ContactSelector
                    id="contact"
                    v-model="formData.contact_person"
                    :client-id="formData.client_id"
                    :client-name="formData.client_name || ''"
                    label="Contact (Optional)"
                    placeholder="Search or add contact person"
                    :optional="true"
                  />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      for="estimatedMaterials"
                      class="block text-sm font-medium mb-2"
                      :class="
                        formData.estimatedMaterials !== null && formData.estimatedMaterials >= 0
                          ? 'text-gray-700'
                          : 'text-red-600'
                      "
                    >
                      Estimated materials ($) *
                    </label>
                    <input
                      id="estimatedMaterials"
                      type="number"
                      step="0.01"
                      min="0"
                      v-model.number="formData.estimatedMaterials"
                      class="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      :class="[
                        errors.estimatedMaterials
                          ? 'border-red-500'
                          : formData.estimatedMaterials !== null && formData.estimatedMaterials >= 0
                            ? 'border-gray-300'
                            : 'border-red-300 bg-red-50',
                      ]"
                      placeholder="Enter materials cost"
                    />
                    <p v-if="errors.estimatedMaterials" class="mt-1 text-sm text-red-600">
                      {{ errors.estimatedMaterials }}
                    </p>
                  </div>
                  <div>
                    <label
                      for="estimatedTime"
                      class="block text-sm font-medium mb-2"
                      :class="
                        formData.estimatedTime !== null && formData.estimatedTime >= 0
                          ? 'text-gray-700'
                          : 'text-red-600'
                      "
                    >
                      Estimated time (hours) *
                    </label>
                    <input
                      id="estimatedTime"
                      type="number"
                      step="0.01"
                      min="0.01"
                      v-model.number="formData.estimatedTime"
                      class="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      :class="[
                        errors.estimatedTime
                          ? 'border-red-500'
                          : formData.estimatedTime !== null && formData.estimatedTime >= 0
                            ? 'border-gray-300'
                            : 'border-red-300 bg-red-50',
                      ]"
                      placeholder="Enter estimated hours"
                    />
                    <p v-if="errors.estimatedTime" class="mt-1 text-sm text-red-600">
                      {{ errors.estimatedTime }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="space-y-6">
                <div>
                  <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
                    Description (for invoice)
                  </label>
                  <textarea
                    id="description"
                    v-model="formData.description"
                    rows="3"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Job description for invoice"
                  />
                </div>

                <div>
                  <label for="order_number" class="block text-sm font-medium text-gray-700 mb-2">
                    Order Number
                  </label>
                  <input
                    id="order_number"
                    v-model="formData.order_number"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="PO/Order number"
                  />
                </div>

                <div class="flex-1">
                  <RichTextEditor
                    v-model="formData.notes"
                    label="Job Notes"
                    placeholder="Internal notes about the job"
                    :required="false"
                  />
                </div>
              </div>
            </div>

            <div class="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                @click="navigateBack"
                class="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                :disabled="isSubmitting"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="isSubmitting || !canSubmit"
                class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span v-if="isSubmitting" class="flex items-center">
                  <svg
                    class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating...
                </span>
                <span v-else>Create Job</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import ClientLookup from '@/components/ClientLookup.vue'
import ContactSelector from '@/components/ContactSelector.vue'
import RichTextEditor from '@/components/RichTextEditor.vue'
import { jobService, type JobCreateData } from '@/services/job.service'
import { costlineService } from '@/services/costline.service'
import { useCompanyDefaultsStore } from '@/stores/companyDefaults'
import { schemas } from '@/api/generated/api'
import { z } from 'zod'

type ClientSearchResult = z.infer<typeof schemas.ClientSearchResult>
import { toast } from 'vue-sonner'

const router = useRouter()
const companyDefaultsStore = useCompanyDefaultsStore()

const formData = ref<
  JobCreateData & { estimatedMaterials: number | null; estimatedTime: number | null }
>({
  name: '',
  client_id: '',
  client_name: '',
  description: '',
  order_number: '',
  notes: '',
  contact_person: '',
  estimatedMaterials: null,
  estimatedTime: null,
})

const selectedClient = ref<ClientSearchResult | null>(null)

const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)

const handleClientSelection = (client: ClientSearchResult | null) => {
  selectedClient.value = client
  if (client) {
    formData.value.client_name = client.name
    formData.value.client_id = client.id
  } else {
    formData.value.client_name = ''
    formData.value.client_id = ''
  }
}

// Requirements validation computed properties
const hasValidXeroClient = computed(() => {
  return (
    formData.value.client_id !== '' &&
    selectedClient.value?.xero_contact_id != null &&
    selectedClient.value.xero_contact_id !== ''
  )
})

const hasValidTimeEstimate = computed(() => {
  return formData.value.estimatedTime !== null && formData.value.estimatedTime >= 0
})

const hasValidMaterialsEstimate = computed(() => {
  return formData.value.estimatedMaterials !== null && formData.value.estimatedMaterials >= 0
})

const canSubmit = computed(() => {
  const nameCheck = formData.value.name.trim() !== ''
  const xeroCheck = hasValidXeroClient.value
  const timeCheck = hasValidTimeEstimate.value
  const materialsCheck = hasValidMaterialsEstimate.value

  console.log('canSubmit validation:', {
    nameCheck,
    xeroCheck,
    timeCheck,
    materialsCheck,
    name: formData.value.name,
    clientId: formData.value.client_id,
    selectedClient: selectedClient.value,
    xeroContactId: selectedClient.value?.xero_contact_id,
    estimatedTime: formData.value.estimatedTime,
    estimatedMaterials: formData.value.estimatedMaterials,
  })

  return nameCheck && xeroCheck && timeCheck && materialsCheck
})

const navigateBack = () => {
  router.push({ name: 'kanban' })
}

const validateForm = (): boolean => {
  errors.value = {}

  if (!formData.value.name.trim()) {
    errors.value.name = 'Job name is required'
    return false
  }

  if (!formData.value.client_id) {
    errors.value.client_id = 'Client selection is required'
    return false
  }

  if (!selectedClient.value?.xero_contact_id) {
    errors.value.client_id = 'Client must have a valid Xero ID - maybe add them'
    return false
  }

  if (formData.value.estimatedMaterials === null || formData.value.estimatedMaterials < 0) {
    errors.value.estimatedMaterials = 'Estimated materials must be provided and be 0 or greater'
    return false
  }

  if (formData.value.estimatedTime === null || formData.value.estimatedTime < 0) {
    errors.value.estimatedTime = 'Estimated time must be provided and be 0 or greater'
    return false
  }

  return true
}

const handleSubmit = async () => {
  if (!validateForm()) {
    console.log('Validation errors:', errors.value)
    return
  }

  isSubmitting.value = true
  toast.info('Creating job…', { id: 'create-job' })

  try {
    const result = await jobService.createJob(formData.value)

    if (result.success && result.job_id) {
      const job_id = result.job_id
      try {
        await costlineService.createCostLine(job_id, 'estimate', {
          kind: 'material',
          desc: 'Estimated materials',
          quantity: '1',
          unit_cost: formData.value.estimatedMaterials.toFixed(2),
          unit_rev: (
            formData.value.estimatedMaterials *
            (1 + (companyDefaultsStore.companyDefaults?.materials_markup ?? 0))
          ).toFixed(2),
        })
      } catch (error: unknown) {
        toast.error((error as Error).message)
        console.error('Failed to create material cost line:', error)
      }
      try {
        await costlineService.createCostLine(job_id, 'estimate', {
          kind: 'time',
          desc: 'Estimated time',
          quantity: formData.value.estimatedTime.toFixed(2),
          unit_cost: Number(companyDefaultsStore.companyDefaults?.wage_rate ?? 0).toFixed(2),
          unit_rev: Number(companyDefaultsStore.companyDefaults?.charge_out_rate ?? 0).toFixed(2),
        })
      } catch (error: unknown) {
        toast.error((error as Error).message)
        console.error('Failed to create time cost line:', error)
      }
      toast.success('Job created!')
      toast.dismiss('create-job')
      router.push({ name: 'job-edit', params: { id: job_id } })
    } else {
      throw new Error(result.error || 'Failed to create job')
    }
  } catch (error: unknown) {
    toast.error('Failed to create job: ' + ((error as Error).message || error))
    console.error('Job creation error:', error)
    toast.dismiss('create-job')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  Object.keys(formData.value).forEach((key) => {
    formData.value[key] = key === 'estimatedMaterials' ? null : key === 'estimatedTime' ? null : ''
  })
})
</script>
