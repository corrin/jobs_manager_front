<template>
  <div class="p-6 max-w-4xl mx-auto">
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

    <!-- Document detail -->
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
          <Badge v-if="doc.is_template" variant="default"> Template </Badge>
        </div>
      </div>

      <!-- Metadata -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm mb-6">
        <div>
          <span class="text-muted-foreground">Created:</span>
          {{ formatDateTime(doc.created_at) }}
        </div>
        <div>
          <span class="text-muted-foreground">Updated:</span>
          {{ formatDateTime(doc.updated_at) }}
        </div>
        <div v-if="doc.company_name">
          <span class="text-muted-foreground">Company:</span>
          {{ doc.company_name }}
        </div>
        <div v-if="doc.site_location">
          <span class="text-muted-foreground">Site:</span>
          {{ doc.site_location }}
        </div>
        <div v-if="doc.job_number">
          <span class="text-muted-foreground">Job:</span>
          {{ doc.job_number }}
        </div>
        <div v-if="doc.parent_template_id">
          <span class="text-muted-foreground">Template:</span>
          <router-link
            :to="'/process-documents/' + doc.parent_template_id"
            class="text-primary hover:underline"
          >
            View parent template
          </router-link>
        </div>
      </div>

      <!-- Tags -->
      <div v-if="tagsArray.length > 0" class="mb-6">
        <span class="text-sm text-muted-foreground mr-2">Tags:</span>
        <Badge v-for="tag in tagsArray" :key="tag" variant="outline" class="mr-1">
          {{ tag }}
        </Badge>
      </div>

      <!-- Google Docs content card -->
      <div
        v-if="doc.google_doc_url"
        class="border rounded-lg p-4 mb-6 flex items-center justify-between bg-muted/30"
      >
        <span class="text-sm">This document lives in Google Docs</span>
        <Button as="a" :href="doc.google_doc_url" target="_blank" rel="noopener noreferrer">
          <ExternalLink class="size-4" />
          Open in Google Docs
        </Button>
      </div>

      <!-- Fill template action -->
      <div v-if="doc.is_template" class="mb-6">
        <Button size="lg" @click="showFillModal = true">
          <FilePlus class="size-4" />
          Fill in this form
        </Button>
      </div>

      <!-- Child records table (for templates) -->
      <div v-if="doc.is_template" class="mt-6">
        <ChildRecordsTable :template-id="doc.id" />
      </div>
    </template>

    <!-- Fill Template Modal -->
    <FillTemplateModal
      :open="showFillModal"
      :template="doc"
      @close="showFillModal = false"
      @filled="onTemplateFilled"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Loader2, ExternalLink, FilePlus } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useProcessDocumentsStore } from '@/stores/processDocuments'
import ChildRecordsTable from '@/components/process-documents/ChildRecordsTable.vue'
import FillTemplateModal from '@/components/process-documents/FillTemplateModal.vue'

const route = useRoute()
const store = useProcessDocumentsStore()

const showFillModal = ref(false)

const doc = computed(() => store.currentDocument)

const tagsArray = computed<string[]>(() => {
  const raw = doc.value?.tags
  if (!Array.isArray(raw)) return []
  return raw.filter((t): t is string => typeof t === 'string')
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

onMounted(() => {
  const id = route.params.id as string
  store.loadDocument(id)
})

onUnmounted(() => {
  store.clearCurrentDocument()
})

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString()
}

function onTemplateFilled() {
  showFillModal.value = false
}
</script>
