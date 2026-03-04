<template>
  <Dialog :open="open" @update:open="onOpenChange">
    <DialogContent class="max-w-md animate-in fade-in-0 zoom-in-95">
      <DialogHeader>
        <DialogTitle>{{ isEditing ? 'Edit Document' : 'New Document' }}</DialogTitle>
      </DialogHeader>
      <form @submit.prevent="submitForm" class="flex flex-col gap-4 mt-2">
        <!-- Title -->
        <label class="flex flex-col gap-1">
          <span class="font-medium text-sm">Title</span>
          <Input v-model="form.title" placeholder="Document title" required />
        </label>

        <!-- Document # -->
        <label class="flex flex-col gap-1">
          <span class="font-medium text-sm">Document #</span>
          <Input v-model="form.document_number" placeholder="Optional document number" />
        </label>

        <!-- Type -->
        <label class="flex flex-col gap-1">
          <span class="font-medium text-sm">Type</span>
          <select
            v-model="form.document_type"
            required
            class="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
          >
            <option value="" disabled>Select type...</option>
            <option value="procedure">Procedure</option>
            <option value="form">Form</option>
            <option value="register">Register</option>
            <option value="reference">Reference</option>
          </select>
        </label>

        <!-- Tags -->
        <label class="flex flex-col gap-1">
          <span class="font-medium text-sm">Tags</span>
          <Input v-model="form.tags" placeholder="Comma-separated tags" />
        </label>

        <!-- Is template -->
        <label class="flex items-center gap-2 text-sm cursor-pointer select-none">
          <Checkbox :checked="form.is_template" @update:checked="onTemplateChecked" />
          Is template
        </label>

        <!-- Form Schema (JSON) — only for form templates -->
        <label v-if="form.document_type === 'form' && form.is_template" class="flex flex-col gap-1">
          <span class="font-medium text-sm">Form Schema (JSON)</span>
          <textarea
            v-model="form.form_schema"
            class="border border-input rounded-md p-2 text-xs font-mono bg-background shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
            rows="6"
            placeholder='{"fields": [{"key": "name", "label": "Name", "type": "text"}]}'
          />
          <span v-if="schemaError" class="text-destructive text-xs">{{ schemaError }}</span>
        </label>

        <!-- Actions -->
        <div class="flex justify-end gap-2 mt-2">
          <Button type="button" variant="outline" @click="emit('close')" :disabled="isSubmitting">
            Cancel
          </Button>
          <Button type="submit" :disabled="isSubmitting">
            <div v-if="isSubmitting" class="flex items-center gap-2">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {{ isEditing ? 'Saving...' : 'Creating...' }}
            </div>
            <span v-else>{{ isEditing ? 'Save Changes' : 'Create Document' }}</span>
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import type { ProcessDocument, ProcessDocumentType } from '@/types/processDocument.types'
import { useProcessDocumentsStore } from '@/stores/processDocuments'
import Dialog from '@/components/ui/dialog/Dialog.vue'
import DialogContent from '@/components/ui/dialog/DialogContent.vue'
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue'
import DialogTitle from '@/components/ui/dialog/DialogTitle.vue'
import Button from '@/components/ui/button/Button.vue'
import Input from '@/components/ui/input/Input.vue'
import Checkbox from '@/components/ui/checkbox/Checkbox.vue'

interface Props {
  open: boolean
  editDocument?: ProcessDocument | null
}

interface FormState {
  title: string
  document_number: string
  document_type: ProcessDocumentType | ''
  tags: string
  is_template: boolean
  form_schema: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const store = useProcessDocumentsStore()

const isEditing = computed(() => !!props.editDocument)
const isSubmitting = ref(false)
const schemaError = ref<string | null>(null)

const emptyForm: FormState = {
  title: '',
  document_number: '',
  document_type: '',
  tags: '',
  is_template: false,
  form_schema: '',
}

const form = ref<FormState>({ ...emptyForm })

// Reset form when modal opens or editDocument changes
watch(
  [() => props.open, () => props.editDocument],
  ([isOpen, doc]) => {
    if (!isOpen) return

    schemaError.value = null

    if (doc) {
      // Parse tags from the document (could be array or unknown)
      const rawTags = doc.tags
      const tagsStr = Array.isArray(rawTags)
        ? rawTags.filter((t): t is string => typeof t === 'string').join(', ')
        : ''

      // Parse form_schema to a string
      const schemaStr = doc.form_schema ? JSON.stringify(doc.form_schema, null, 2) : ''

      form.value = {
        title: doc.title,
        document_number: doc.document_number || '',
        document_type: doc.document_type,
        tags: tagsStr,
        is_template: doc.is_template ?? false,
        form_schema: schemaStr,
      }
    } else {
      form.value = { ...emptyForm }
    }
  },
  { immediate: true },
)

function onOpenChange(open: boolean) {
  if (!open) {
    emit('close')
  }
}

function onTemplateChecked(checked: boolean) {
  form.value = { ...form.value, is_template: checked }
}

function parseTags(input: string): string[] {
  return input
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
}

function validateFormSchema(json: string): unknown | null {
  try {
    const parsed = JSON.parse(json)
    schemaError.value = null
    return parsed
  } catch {
    schemaError.value = 'Invalid JSON'
    return null
  }
}

async function submitForm() {
  if (!form.value.document_type) {
    toast.error('Please select a document type')
    return
  }

  // Validate form schema JSON if visible
  let formSchema: unknown = undefined
  if (
    form.value.document_type === 'form' &&
    form.value.is_template &&
    form.value.form_schema.trim()
  ) {
    formSchema = validateFormSchema(form.value.form_schema)
    if (formSchema === null) return
  }

  isSubmitting.value = true

  try {
    if (isEditing.value && props.editDocument) {
      await store.updateDocument(props.editDocument.id, {
        title: form.value.title,
        document_number: form.value.document_number || null,
        document_type: form.value.document_type as ProcessDocumentType,
        tags: parseTags(form.value.tags),
        is_template: form.value.is_template,
        form_schema: formSchema,
      })
    } else {
      await store.createDocument({
        title: form.value.title,
        document_number: form.value.document_number || '',
        document_type: form.value.document_type as ProcessDocumentType,
        tags: parseTags(form.value.tags),
        is_template: form.value.is_template,
        site_location: '',
      })
    }

    emit('saved')
    emit('close')
  } catch (error) {
    console.error('Error saving document:', error)
    toast.error('Failed to save document')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
textarea {
  resize: vertical;
}
</style>
