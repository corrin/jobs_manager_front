<template>
  <div class="p-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Process Documents</h1>
      <Button @click="showCreateModal = true">
        <Plus class="size-4" />
        New Document
      </Button>
    </div>

    <!-- Filters -->
    <div class="mb-6">
      <ProcessDocumentFilters
        :filters="store.filters"
        :available-tags="availableTags"
        @update:filters="onFiltersUpdate"
      />
    </div>

    <!-- Table -->
    <ProcessDocumentTable
      :documents="store.documents"
      :is-loading="store.isLoading"
      @row-click="handleRowClick"
      @fill="handleFill"
      @delete-doc="handleDelete"
      @open-google-doc="openGoogleDoc"
    />

    <!-- Create/Edit Modal -->
    <ProcessDocumentModal
      :open="showCreateModal || !!editingDocument"
      :edit-document="editingDocument"
      @close="closeModal"
      @saved="handleSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ProcessDocumentFilters from '@/components/process-documents/ProcessDocumentFilters.vue'
import ProcessDocumentTable from '@/components/process-documents/ProcessDocumentTable.vue'
import ProcessDocumentModal from '@/components/process-documents/ProcessDocumentModal.vue'
import { useProcessDocumentsStore } from '@/stores/processDocuments'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-vue-next'
import type {
  ProcessDocumentListItem,
  ProcessDocumentFilters as Filters,
} from '@/types/processDocument.types'
import type { ProcessDocument } from '@/types/processDocument.types'

const router = useRouter()
const store = useProcessDocumentsStore()

// Modal state
const showCreateModal = ref(false)
const editingDocument = ref<ProcessDocument | null>(null)

// Extract unique tags from all documents
const availableTags = computed(() => {
  const tagSet = new Set<string>()
  for (const doc of store.documents) {
    const tags = doc.tags
    if (Array.isArray(tags)) {
      for (const tag of tags) {
        if (typeof tag === 'string') {
          tagSet.add(tag)
        }
      }
    }
  }
  return [...tagSet].sort()
})

onMounted(() => {
  store.loadDocuments()
})

function onFiltersUpdate(newFilters: Filters) {
  store.setFilters(newFilters)
}

function handleRowClick(doc: ProcessDocumentListItem) {
  if (doc.document_type === 'form') {
    router.push('/process-documents/forms/' + doc.id)
  } else {
    router.push('/process-documents/' + doc.id)
  }
}

async function handleFill(doc: ProcessDocumentListItem) {
  const confirmed = window.confirm(
    `Fill template "${doc.title}"? This will create a new document from this template.`,
  )
  if (!confirmed) return

  const filled = await store.fillTemplate(doc.id)
  if (filled) {
    if (doc.document_type === 'form') {
      router.push('/process-documents/forms/' + filled.id)
    } else {
      router.push('/process-documents/' + filled.id)
    }
  }
}

function handleDelete(doc: ProcessDocumentListItem) {
  const confirmed = window.confirm('Delete this document?')
  if (!confirmed) return

  store.deleteDocument(doc.id)
}

function openGoogleDoc(doc: ProcessDocumentListItem) {
  if (doc.google_doc_url) {
    window.open(doc.google_doc_url, '_blank')
  }
}

function closeModal() {
  showCreateModal.value = false
  editingDocument.value = null
}

function handleSaved() {
  closeModal()
}
</script>
