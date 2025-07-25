<template>
  <div class="h-full overflow-y-auto">
    <div class="max-w-4xl">
      <div class="mb-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-2">Attachments</h2>
        <p class="text-sm text-gray-600">Manage job files and attachments.</p>
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
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              ></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Job #{{ jobNumber }} Attachments</h3>
          <p class="text-gray-500 mb-4">Attachment management content coming soon...</p>
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

defineEmits<{
  'file-uploaded': []
  'file-deleted': []
}>()
</script>
