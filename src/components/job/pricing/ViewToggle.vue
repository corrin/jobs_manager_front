<template>
  <div class="view-toggle">
    <select
      :value="modelValue"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      class="text-sm border rounded px-2 py-1"
    >
      <option value="grid">Grid</option>
      <option value="table">Table</option>
      <option value="list">List</option>
    </select>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string
}

defineProps<Props>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
