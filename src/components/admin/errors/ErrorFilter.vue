<script setup lang="ts">
import Input from '@/components/ui/input/Input.vue'
import { DatePicker } from '@/components/ui/date-picker'
import { ref, watch } from 'vue'

interface DateRange {
  start: string | null
  end: string | null
}

const props = defineProps<{ search: string; range: DateRange }>()
const emit = defineEmits(['update:search', 'update:range'])

const localSearch = ref(props.search)
const localRange = ref<DateRange>({ ...props.range })

watch(
  () => props.search,
  (v) => {
    localSearch.value = v
  },
)
watch(
  () => props.range,
  (v) => {
    localRange.value = { ...v }
  },
  { deep: true },
)

watch(localSearch, (v) => emit('update:search', v))
watch(localRange, (v) => emit('update:range', v), { deep: true })
</script>

<template>
  <div class="flex flex-col md:flex-row items-end gap-4">
    <Input v-model="localSearch" placeholder="Search…" class="md:w-64" />
    <DatePicker v-model="localRange" />
  </div>
</template>
