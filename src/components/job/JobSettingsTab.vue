<template>
  <div class="h-full overflow-y-auto">
    <div class="max-w-4xl">
      <div class="mb-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-2">Job Settings</h2>
        <p class="text-sm text-gray-600">Configure the job details and settings.</p>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <p class="text-gray-500 text-center">Job settings content coming soon...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { JobDetailResponse } from '@/api/generated/api'

interface Props {
  jobData: JobDetailResponse
}

defineProps<Props>()

defineEmits<{
  'job-updated': [job: JobDetailResponse]
}>()
</script>
