<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps<{ page: number; total: number }>()
const emit = defineEmits(['update:page'])

const pages = computed(() => Array.from({ length: props.total }, (_, i) => i + 1))
function select(p: number) {
  if (p !== props.page) emit('update:page', p)
}
function prev() {
  if (props.page > 1) emit('update:page', props.page - 1)
}
function next() {
  if (props.page < props.total) emit('update:page', props.page + 1)
}
</script>

<template>
  <div class="flex items-center justify-center gap-1 py-2">
    <Button variant="ghost" size="sm" @click="prev" :disabled="props.page <= 1">
      <ChevronLeft class="w-4 h-4" />
    </Button>
    <Button
      v-for="p in pages"
      :key="p"
      variant="ghost"
      size="sm"
      @click="select(p)"
      :class="p === props.page ? 'bg-primary text-white' : ''"
    >
      {{ p }}
    </Button>
    <Button variant="ghost" size="sm" @click="next" :disabled="props.page >= props.total">
      <ChevronRight class="w-4 h-4" />
    </Button>
  </div>
</template>
