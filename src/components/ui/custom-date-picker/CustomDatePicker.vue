<script setup lang="ts">
import { reactive, watch } from 'vue'
import Input from '@/components/ui/input/Input.vue'

interface DateRange {
  start: string | null
  end: string | null
}

const props = defineProps<{ modelValue: DateRange }>()
const emit = defineEmits(['update:modelValue'])

const range = reactive<DateRange>({
  start: props.modelValue?.start || null,
  end: props.modelValue?.end || null,
})

watch(
  () => props.modelValue,
  (val) => {
    range.start = val?.start || null
    range.end = val?.end || null
  },
  { deep: true },
)

watch(
  () => ({ ...range }),
  (val) => emit('update:modelValue', val),
  { deep: true },
)
</script>

<template>
  <div class="flex items-center gap-2">
    <Input type="date" v-model="range.start" class="w-36" />
    <span class="mx-1">–</span>
    <Input type="date" v-model="range.end" class="w-36" />
  </div>
</template>
