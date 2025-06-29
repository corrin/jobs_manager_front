<script setup lang="ts">
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { useXeroItemStore } from '@/stores/xeroItemStore'
import { onMounted } from 'vue'

const props = defineProps<{
  modelValue: string
}>()
const emit = defineEmits<{
  'update:modelValue': [string]
  'update:description': [string]
}>()

const store = useXeroItemStore()

onMounted(async () => {
  if (store.items.length === 0 && !store.loading) {
    await store.fetchItems()
  }
  console.log('[ItemSelect] Items loaded:', store.items)
})
</script>

<template>
  <Select
    :model-value="props.modelValue"
    class="w-32"
    @update:model-value="
      (val) => {
        emit('update:modelValue', val)
        const found = store.items.find((i) => i.code === val)
        emit('update:description', found ? found.name : '')
      }
    "
  >
    <SelectTrigger>
      <SelectValue placeholder="Select" />
    </SelectTrigger>

    <SelectContent>
      <SelectItem v-for="i in store.items" :key="i.id" :value="i.code">{{ i.code }}</SelectItem>
    </SelectContent>
  </Select>
</template>
