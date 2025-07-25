<template>
  <div class="h-full overflow-y-auto">
    <div class="max-w-4xl">
      <div class="mb-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-2">Print Job</h2>
        <p class="text-sm text-gray-600">Generate and print job sheets.</p>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="text-center">
          <div class="mb-4">
            <svg
              class="w-12 h-12 text-gray-400 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              ></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Job #{{ jobNumber }} Print Options</h3>
          <p class="text-gray-500 mb-4">Print job sheet functionality coming soon...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  jobId: string
  jobNumber: number
}

defineProps<Props>()
</script>
