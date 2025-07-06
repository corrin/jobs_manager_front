<template>
  <div class="relative">
    <!-- Input field -->
    <input
      ref="inputRef"
      v-model="searchTerm"
      type="text"
      :placeholder="placeholder"
      :disabled="disabled"
      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      :class="{
        'border-red-500': hasError,
        'opacity-50 cursor-not-allowed': disabled,
      }"
      @focus="disabled ? null : onFocus()"
      @blur="disabled ? null : onBlur($event)"
      @input="disabled ? null : onInput()"
      @keydown="disabled ? null : onKeydown($event)"
    />

    <!-- Error message -->
    <div v-if="hasError && errorMessage" class="text-red-500 text-sm mt-1">
      {{ errorMessage }}
    </div>

    <!-- Dropdown portal -->
    <Teleport to="body">
      <div
        v-if="showDropdown && !disabled"
        ref="dropdownRef"
        :style="dropdownStyle"
        class="absolute bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto z-[9999] min-w-[200px]"
      >
        <!-- Job items -->
        <div
          v-for="(job, index) in filteredJobs"
          :key="job.id"
          :class="{
            'bg-blue-50': index === highlightedIndex,
            'hover:bg-gray-50': index !== highlightedIndex,
          }"
          class="px-3 py-2 cursor-pointer border-b border-gray-100 last:border-b-0"
          @click="selectJob(job)"
          @mouseenter="highlightedIndex = index"
        >
          <div class="font-medium text-gray-900">
            {{ job.number || job.job_number }}
          </div>
          <div class="text-sm text-gray-600 truncate">
            {{ job.description || job.name }}
          </div>
          <div v-if="job.client_name" class="text-xs text-gray-500 truncate">
            Client: {{ job.client_name }}
          </div>
        </div>

        <!-- No results message -->
        <div
          v-if="filteredJobs.length === 0 && searchTerm.trim()"
          class="px-3 py-2 text-gray-500 text-sm"
        >
          No jobs found for "{{ searchTerm }}"
        </div>

        <!-- No jobs available -->
        <div
          v-if="filteredJobs.length === 0 && !searchTerm.trim()"
          class="px-3 py-2 text-gray-500 text-sm"
        >
          No jobs available
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

// Props
const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: null,
  },
  jobs: {
    type: Array,
    default: () => [],
  },
  placeholder: {
    type: String,
    default: 'Select a job (optional)...',
  },
  hasError: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

// Emits
const emit = defineEmits(['update:modelValue', 'jobSelected'])

// Refs
const inputRef = ref(null)
const dropdownRef = ref(null)
const searchTerm = ref('')
const showDropdown = ref(false)
const highlightedIndex = ref(-1)
const dropdownStyle = ref({})

// Computed
const filteredJobs = computed(() => {
  // Filter out excluded statuses first
  const excludedStatuses = ['rejected', 'archived', 'completed', 'special']
  const availableJobs = props.jobs.filter(
    (job) => !excludedStatuses.includes(job.status?.toLowerCase()),
  )

  // If no search term, return all available jobs
  if (!searchTerm.value.trim()) {
    return availableJobs
  }

  // Filter by search term (job number, name/description, or client name)
  const term = searchTerm.value.toLowerCase()

  const filtered = availableJobs.filter((job) => {
    const numberMatch = job.number?.toString().toLowerCase().includes(term)
    const jobNumberMatch = job.job_number?.toString().toLowerCase().includes(term)
    const descriptionMatch = job.description?.toLowerCase().includes(term)
    const nameMatch = job.name?.toLowerCase().includes(term)
    const clientMatch = job.client_name?.toLowerCase().includes(term)

    return numberMatch || jobNumberMatch || descriptionMatch || nameMatch || clientMatch
  })

  return filtered
})

// Helper function to update search term from modelValue
const updateSearchTermFromModelValue = (modelValue) => {
  if (modelValue) {
    const selectedJob = props.jobs.find((job) => job.id === modelValue)
    if (selectedJob) {
      const jobNumber = selectedJob.number || selectedJob.job_number
      const jobDescription = selectedJob.description || selectedJob.name
      searchTerm.value = `${jobNumber} - ${jobDescription}`
    }
  } else {
    searchTerm.value = ''
  }
}

// Watch for modelValue changes to update search term
watch(
  () => props.modelValue,
  (newValue) => {
    updateSearchTermFromModelValue(newValue)
  },
  { immediate: true },
)

// Watch for jobs changes
watch(
  () => props.jobs,
  (newJobs) => {
    // When jobs are updated, try to update search term if we have a modelValue
    if (props.modelValue && newJobs.length > 0) {
      updateSearchTermFromModelValue(props.modelValue)
    }
  },
  { immediate: true },
)

// Watch for searchTerm changes
watch(
  searchTerm,
  () => {
    // Search term updated - will trigger filteredJobs recomputation
  },
  { immediate: true },
)

// Methods
const onFocus = () => {
  if (props.disabled) return
  showDropdown.value = true
  highlightedIndex.value = -1
  calculateDropdownPosition()
}

const onBlur = (event) => {
  if (props.disabled) return
  // Small delay to allow click events on dropdown items
  setTimeout(() => {
    if (!dropdownRef.value?.contains(event.relatedTarget)) {
      showDropdown.value = false
      highlightedIndex.value = -1
    }
  }, 150)
}

const onInput = () => {
  if (props.disabled) return
  showDropdown.value = true
  highlightedIndex.value = -1
  calculateDropdownPosition()

  // Clear selection if user is typing
  if (props.modelValue) {
    emit('update:modelValue', null)
    emit('jobSelected', null)
  }
}

const onKeydown = (event) => {
  if (props.disabled || !showDropdown.value || filteredJobs.value.length === 0) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      highlightedIndex.value = Math.min(highlightedIndex.value + 1, filteredJobs.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1)
      break
    case 'Enter':
      event.preventDefault()
      if (highlightedIndex.value >= 0) {
        selectJob(filteredJobs.value[highlightedIndex.value])
      }
      break
    case 'Escape':
      event.preventDefault()
      showDropdown.value = false
      highlightedIndex.value = -1
      inputRef.value?.blur()
      break
  }
}

const selectJob = (job) => {
  if (props.disabled) return

  const jobNumber = job.number || job.job_number
  const jobDescription = job.description || job.name
  searchTerm.value = `${jobNumber} - ${jobDescription}`
  showDropdown.value = false
  highlightedIndex.value = -1

  emit('update:modelValue', job.id)
  emit('jobSelected', job)

  inputRef.value?.blur()
}

const calculateDropdownPosition = async () => {
  await nextTick()

  if (!inputRef.value) return

  const inputRect = inputRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const dropdownHeight = 240 // max-height: 60 * 4 = 240px (approximate)

  // Calculate position
  let top = inputRect.bottom + window.scrollY
  let left = inputRect.left + window.scrollX
  const width = inputRect.width

  // Check if dropdown would be cut off at bottom of viewport
  if (inputRect.bottom + dropdownHeight > viewportHeight) {
    // Position above input if there's more space
    if (inputRect.top > dropdownHeight) {
      top = inputRect.top + window.scrollY - dropdownHeight
    }
  }

  // Ensure dropdown doesn't go off-screen horizontally
  const maxLeft = window.innerWidth - width - 20
  left = Math.min(left, maxLeft)
  left = Math.max(left, 10)

  dropdownStyle.value = {
    position: 'absolute',
    top: `${top}px`,
    left: `${left}px`,
    width: `${width}px`,
    zIndex: 9999,
  }
}

// Handle click outside
const handleClickOutside = (event) => {
  if (
    inputRef.value &&
    !inputRef.value.contains(event.target) &&
    dropdownRef.value &&
    !dropdownRef.value.contains(event.target)
  ) {
    showDropdown.value = false
    highlightedIndex.value = -1
  }
}

// Handle window resize
const handleResize = () => {
  if (showDropdown.value) {
    calculateDropdownPosition()
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', handleResize)
  window.addEventListener('scroll', handleResize)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('scroll', handleResize)
})

// Expose methods for parent component
defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  clear: () => {
    searchTerm.value = ''
    emit('update:modelValue', null)
    emit('jobSelected', null)
  },
})
</script>
