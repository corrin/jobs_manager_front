<template>
  <div>
    <label v-if="label" :for="id" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <div
      class="border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent"
    >
      <div :id="id" ref="editorContainer" class="min-h-[120px]"></div>
    </div>

    <p v-if="helpText" class="mt-1 text-sm text-gray-500">{{ helpText }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import type Quill from 'quill'
import type { RangeStatic } from 'quill'

// Props seguindo clean code principles
interface Props {
  id?: string
  label?: string
  modelValue?: string
  placeholder?: string
  required?: boolean
  helpText?: string
  readonly?: boolean
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  id: 'rich-text-editor',
  modelValue: '',
  placeholder: 'Enter text...',
  required: false,
  readonly: false,
  height: '120px',
})

// Events
const emit = defineEmits<{
  'update:modelValue': [value: string]
  focus: []
  blur: []
}>()

// Local state
const editorContainer = ref<HTMLElement>()
let quill: Quill | null = null
let isUpdatingFromProp = false

// Initialize Quill editor seguindo early return
const initializeEditor = async () => {
  // Guard clause - verificar se container existe
  if (!editorContainer.value) {
    console.error('Editor container not found')
    return
  }
  try {
    // Dynamically import Quill para otimizar bundle
    const { default: Quill } = await import('quill')
    await import('quill/dist/quill.snow.css')

    // Quill configuration seguindo princípios de clean code
    const toolbarOptions = [
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean'],
    ]

    const options = {
      theme: 'snow',
      placeholder: props.placeholder,
      readOnly: props.readonly,
      modules: {
        toolbar: toolbarOptions,
      },
    }

    // Initialize Quill instance
    quill = new Quill(editorContainer.value, options)

    // Set initial content
    if (props.modelValue) {
      quill.root.innerHTML = props.modelValue
    }

    // Set up event handlers seguindo SRP
    setupEventHandlers()
  } catch (error) {
    console.error('Failed to initialize Quill editor:', error)
  }
}

// Setup event handlers seguindo clean code
const setupEventHandlers = () => {
  if (!quill) return

  // Handle text changes
  quill.on('text-change', () => {
    // Guard clause para evitar loops infinitos
    if (isUpdatingFromProp) return
    // Guard clause para verificar se quill existe
    if (!quill) return

    const content = quill.root.innerHTML
    emit('update:modelValue', content)
  })

  // Handle focus events
  quill.on('selection-change', (range: RangeStatic | null) => {
    if (range) {
      emit('focus')
    } else {
      emit('blur')
    }
  })
}

// Update content from prop changes
const updateContent = (newContent: string | undefined) => {
  // Guard clause if Quill isn't initialised
  if (!quill) return

  const safeContent = newContent || ''
  const currentContent = quill.root.innerHTML

  // Guard clause se conteúdo é o mesmo
  if (currentContent === safeContent) return

  isUpdatingFromProp = true
  // Preserve cursor position se possível
  const selection = quill.getSelection()

  quill.root.innerHTML = safeContent
  // Restore selection se existia
  if (selection) {
    nextTick(() => {
      // Guard clause adicional para verificar se quill ainda existe
      if (!quill) return
      quill.setSelection(selection)
    })
  }

  isUpdatingFromProp = false
}

// Set readonly mode
const setReadonly = (readonly: boolean) => {
  if (quill) {
    quill.enable(!readonly)
  }
}

// Focus editor
const focus = () => {
  if (quill) {
    quill.focus()
  }
}

// Get text content (without HTML)
const getTextContent = (): string => {
  return quill ? quill.getText() : ''
}

// Clear content
const clear = () => {
  if (quill) {
    quill.setText('')
  }
}

// Lifecycle hooks
onMounted(async () => {
  await nextTick()
  await initializeEditor()
})

onUnmounted(() => {
  if (quill) {
    quill = null
  }
})

// Watch for prop changes
watch(
  () => props.modelValue,
  (newValue) => {
    updateContent(newValue)
  },
)

watch(
  () => props.readonly,
  (newReadonly) => {
    setReadonly(newReadonly)
  },
)

// Expose methods para parent component
defineExpose({
  focus,
  getTextContent,
  clear,
  quill: () => quill,
})
</script>

<style>
/* Quill editor customizations */
.ql-toolbar {
  border-top: none !important;
  border-left: none !important;
  border-right: none !important;
  border-bottom: 1px solid #e5e7eb !important;
}

.ql-container {
  border: none !important;
  font-family: inherit;
}

.ql-editor {
  min-height: 80px;
  padding: 12px;
}

.ql-editor.ql-blank::before {
  font-style: normal;
  color: #9ca3af;
}

/* Focus styles */
.ql-toolbar.ql-snow + .ql-container.ql-snow {
  border: none;
}
</style>
