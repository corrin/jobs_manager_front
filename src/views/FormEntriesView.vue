<template>
  <div class="p-6 max-w-7xl mx-auto">
    <!-- Back link -->
    <router-link
      to="/process-documents"
      class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
    >
      <ArrowLeft class="size-4" />
      Back to Process Documents
    </router-link>

    <!-- Loading -->
    <div
      v-if="store.isLoadingDocument"
      class="flex items-center gap-2 py-12 justify-center text-muted-foreground"
    >
      <Loader2 class="size-5 animate-spin" />
      Loading document...
    </div>

    <!-- Error / not found -->
    <div v-else-if="!doc" class="py-12 text-center text-muted-foreground">Document not found.</div>

    <!-- Document loaded -->
    <template v-else>
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold mb-2">{{ doc.title }}</h1>
        <div class="flex flex-wrap items-center gap-2">
          <Badge v-if="doc.document_number" variant="outline">
            {{ doc.document_number }}
          </Badge>
          <Badge variant="secondary">
            {{ doc.document_type }}
          </Badge>
          <Badge :variant="statusVariant">
            {{ doc.status ?? 'draft' }}
          </Badge>
          <Badge v-if="doc.is_template" variant="default">Template</Badge>
        </div>
      </div>

      <!-- Add Entry form -->
      <Card v-if="store.hasFormSchema" class="mt-6">
        <CardHeader>
          <CardTitle>Add Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <DynamicFormEntry
            :schema="formSchema"
            :is-submitting="store.isSaving"
            @submit="handleAddEntry"
          />
        </CardContent>
      </Card>

      <!-- No schema warning -->
      <div v-else class="mt-6 text-sm text-muted-foreground">
        This document has no form schema defined. Entries cannot be added.
      </div>

      <!-- Entries table -->
      <div v-if="store.hasFormSchema" class="mt-6">
        <h2 class="text-lg font-semibold mb-3">Entries ({{ store.entries.length }})</h2>
        <EntriesTable
          :entries="store.entries"
          :schema="formSchema"
          :is-loading="store.isLoadingEntries"
          @edit="openEditModal"
        />
      </div>
    </template>

    <!-- Edit Entry Dialog -->
    <Dialog :open="editDialogOpen" @update:open="handleEditDialogChange">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Entry</DialogTitle>
          <DialogDescription> Update the entry details below. </DialogDescription>
        </DialogHeader>

        <DynamicFormEntry
          v-if="editingEntry && store.hasFormSchema"
          :schema="formSchema"
          :initial-data="editingEntryData"
          :initial-entry-date="editingEntry.entry_date"
          :is-submitting="store.isSaving"
          @submit="handleUpdateEntry"
        />

        <DialogFooter>
          <Button variant="outline" @click="closeEditModal">Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Loader2 } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useProcessDocumentsStore } from '@/stores/processDocuments'
import DynamicFormEntry from '@/components/process-documents/DynamicFormEntry.vue'
import EntriesTable from '@/components/process-documents/EntriesTable.vue'
import type { ProcessDocumentEntry, FormSchema } from '@/types/processDocument.types'

const route = useRoute()
const store = useProcessDocumentsStore()

// ============================================================
// Computed
// ============================================================

const doc = computed(() => store.currentDocument)

const formSchema = computed<FormSchema>(() => {
  return (doc.value?.form_schema as FormSchema) ?? { fields: [] }
})

const statusVariant = computed<'default' | 'secondary' | 'outline'>(() => {
  switch (doc.value?.status) {
    case 'active':
      return 'default'
    case 'completed':
      return 'secondary'
    default:
      return 'outline'
  }
})

// ============================================================
// Edit modal state
// ============================================================

const editDialogOpen = ref(false)
const editingEntry = ref<ProcessDocumentEntry | null>(null)

const editingEntryData = computed<Record<string, unknown>>(() => {
  if (!editingEntry.value?.data) return {}
  return editingEntry.value.data as Record<string, unknown>
})

function openEditModal(entry: ProcessDocumentEntry) {
  editingEntry.value = entry
  editDialogOpen.value = true
}

function closeEditModal() {
  editDialogOpen.value = false
  editingEntry.value = null
}

function handleEditDialogChange(open: boolean) {
  if (!open) {
    closeEditModal()
  }
}

// ============================================================
// Handlers
// ============================================================

async function handleAddEntry(payload: { entry_date: string; data: Record<string, unknown> }) {
  const id = route.params.id as string
  await store.addEntry(id, payload)
}

async function handleUpdateEntry(payload: { entry_date: string; data: Record<string, unknown> }) {
  if (!editingEntry.value) return
  const documentId = route.params.id as string
  const entryId = editingEntry.value.id
  await store.updateEntry(documentId, entryId, payload)
  closeEditModal()
}

// ============================================================
// Lifecycle
// ============================================================

onMounted(async () => {
  const id = route.params.id as string
  await store.loadDocument(id)
  await store.loadEntries(id)
})

onUnmounted(() => {
  store.clearCurrentDocument()
})
</script>
