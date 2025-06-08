<template>
  <div class="staff-dropdown">
    <label :for="id" class="block text-sm font-medium mb-1">{{ label }}</label>
    <div class="relative">
      <select
        :id="id"
        v-model="selectedValue"
        class="w-full p-2 border rounded-md appearance-none bg-white"
        @change="handleChange"
      >
        <option value="">{{ placeholder }}</option>
        <option
          v-for="staff in staffOptions"
          :key="staff.id"
          :value="staff.id"
        >
          {{ staff.display_name }}
        </option>
      </select>
      <div class="dropdown-icon">
        <ChevronDown class="h-4 w-4 text-gray-400" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { staffService, type Staff } from '@/services/staffService'

interface Props {
  id: string
  label: string
  placeholder?: string
  modelValue?: string | number
}

interface Emits {
  (e: 'update:modelValue', value: string | number): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Any Staff Member'
})

const emit = defineEmits<Emits>()

const staffOptions = ref<Staff[]>([])
const selectedValue = ref<string | number>(props.modelValue || '')
const isLoading = ref(false)
const error = ref<string | null>(null)

const loadStaffOptions = async (): Promise<void> => {
  try {
    isLoading.value = true
    error.value = null
    const data = await staffService.getAllStaff()
    staffOptions.value = data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load staff options'
    console.error('Error loading staff options:', err)
  } finally {
    isLoading.value = false
  }
}

const handleChange = (): void => {
  emit('update:modelValue', selectedValue.value)
}

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  selectedValue.value = newValue || ''
})

onMounted(() => {
  loadStaffOptions()
})
</script>

<style scoped>
.staff-dropdown {
  position: relative;
}

.dropdown-icon {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  pointer-events: none;
}

select {
  border: 1px solid #e2e8f0;
  transition: border-color 0.2s ease;
}

select:focus {
  outline: none;
  border-color: #4285f4;
  box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
}

select:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}
</style>
