<template>
  <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
    <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
      <h3 class="text-lg font-bold mb-4">Confirm Deletion</h3>
      <p class="mb-6">
        Are you sure you want to delete
        <span class="font-semibold">{{ staff?.first_name }} {{ staff?.last_name }}</span
        >? This action cannot be undone.
      </p>
      <div class="flex gap-2 justify-end">
        <button @click="$emit('close')" class="px-3 py-1 rounded bg-gray-300">Cancel</button>
        <button @click="$emit('confirm')" class="px-3 py-1 rounded bg-red-600 text-white">
          Delete
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Staff } from '@/types/staff'

defineProps<{ staff: Staff | null }>()
</script>

<style scoped>
/* No custom styles needed */
</style>
