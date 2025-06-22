<template>
  <div class="bg-gray-50 rounded p-3">
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium text-gray-700">
        {{ title }}
      </label>
      <div class="flex items-center space-x-2">
        <span class="text-sm text-gray-500">$</span>
        <input
          :value="value"
          @input="handleInput"
          @blur="handleBlur"
          type="number"
          step="0.01"
          min="0"
          class="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Props
interface Props {
  title: string
  value: number
}

const props = defineProps<Props>()

// Events
const emit = defineEmits<{
  update: [value: number]
}>()

// Local state para input handling
const inputValue = ref(props.value.toString())

// Input handlers seguindo clean code principles
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  inputValue.value = target.value
}

const handleBlur = () => {
  // Early return - validação de entrada
  const numericValue = parseFloat(inputValue.value)

  if (isNaN(numericValue) || numericValue < 0) {
    // Reset to original value se inválido
    inputValue.value = props.value.toString()
    return
  }

  // Emit valor atualizado
  emit('update', numericValue)
}

// Watch for prop changes
import { watch } from 'vue'

watch(
  () => props.value,
  (newValue) => {
    inputValue.value = newValue.toString()
  },
)
</script>
