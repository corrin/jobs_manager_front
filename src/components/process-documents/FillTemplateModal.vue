<template>
  <Dialog :open="open" @update:open="onOpenChange">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Create a record from {{ template?.title ?? 'template' }}</DialogTitle>
        <DialogDescription> A new document will be created from this template. </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="flex flex-col gap-4 mt-2">
        <!-- Job ID (optional) -->
        <label class="flex flex-col gap-1">
          <span class="font-medium text-sm">Link to job (optional)</span>
          <Input v-model="jobId" placeholder="Paste a job ID to link this record" />
        </label>

        <!-- Actions -->
        <DialogFooter>
          <Button type="button" variant="outline" :disabled="isSubmitting" @click="emit('close')">
            Cancel
          </Button>
          <Button type="submit" :disabled="isSubmitting">
            <template v-if="isSubmitting">
              <Loader2 class="size-4 animate-spin" />
              Creating...
            </template>
            <span v-else>Create</span>
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Loader2 } from 'lucide-vue-next'
import { Dialog } from '@/components/ui/dialog'
import DialogContent from '@/components/ui/dialog/DialogContent.vue'
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue'
import DialogTitle from '@/components/ui/dialog/DialogTitle.vue'
import DialogDescription from '@/components/ui/dialog/DialogDescription.vue'
import DialogFooter from '@/components/ui/dialog/DialogFooter.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useProcessDocumentsStore } from '@/stores/processDocuments'
import type {
  ProcessDocumentListItem,
  ProcessDocument,
  FormSchema,
} from '@/types/processDocument.types'

interface Props {
  open: boolean
  template: ProcessDocumentListItem | ProcessDocument | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'filled', doc: ProcessDocument): void
}>()

const router = useRouter()
const store = useProcessDocumentsStore()

const jobId = ref('')
const isSubmitting = ref(false)

// Reset form when modal opens
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      jobId.value = ''
    }
  },
)

function onOpenChange(open: boolean) {
  if (!open) {
    emit('close')
  }
}

async function handleSubmit() {
  if (!props.template) return

  isSubmitting.value = true
  try {
    const result = await store.fillTemplate(props.template.id, jobId.value.trim() || undefined)

    if (!result) return

    // Determine navigation target
    const schema = result.form_schema as FormSchema | undefined
    const hasFields = schema && Array.isArray(schema.fields) && schema.fields.length > 0

    if (result.google_doc_url) {
      window.open(result.google_doc_url, '_blank')
    }

    if (hasFields) {
      router.push(`/process-documents/forms/${result.id}`)
    } else {
      router.push(`/process-documents/${result.id}`)
    }

    emit('filled', result)
    emit('close')
  } finally {
    isSubmitting.value = false
  }
}
</script>
