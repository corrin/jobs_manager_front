<template>
  <div
    :class="[
      'border-2 border-dashed rounded-xl p-8 text-center transition-colors',
      props.disabled
        ? 'border-gray-200 cursor-not-allowed opacity-50'
        : 'border-gray-300 cursor-pointer hover:border-gray-400',
    ]"
    @click="!props.disabled && trigger()"
    @drop.prevent="!props.disabled && onDrop"
    @dragover.prevent
  >
    <slot>
      <p class="text-sm text-gray-600">
        <span class="font-medium text-indigo-600">Click to upload</span> or drag and drop
      </p>
    </slot>
    <input
      ref="input"
      type="file"
      class="hidden"
      multiple
      accept="application/pdf,image/*"
      :disabled="props.disabled"
      @change="handleFiles"
    />
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const emit = defineEmits<{ files: [FileList] }>()
const input = ref<HTMLInputElement>()

function trigger() {
  if (!props.disabled) {
    input.value?.click()
  }
}

function handleFiles(e: Event) {
  if (props.disabled) return
  const target = e.target as HTMLInputElement
  if (target.files) emit('files', target.files)
  target.value = ''
}

function onDrop(e: DragEvent) {
  if (props.disabled) return
  if (e.dataTransfer?.files) emit('files', e.dataTransfer.files)
}
</script>
