<template>
  <div>
    <!-- Loading spinner -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>

    <!-- Empty state -->
    <div v-else-if="sortedDocuments.length === 0" class="text-center py-12 text-muted-foreground">
      No process documents found.
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto rounded-md border">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b bg-muted/50">
            <th
              class="px-4 py-3 text-left font-medium cursor-pointer select-none hover:bg-muted"
              @click="toggleSort"
            >
              <span class="flex items-center gap-1">
                Doc #
                <ArrowUpDown class="size-3.5 text-muted-foreground" />
              </span>
            </th>
            <th class="px-4 py-3 text-left font-medium">Title</th>
            <th class="px-4 py-3 text-left font-medium">Type</th>
            <th class="px-4 py-3 text-left font-medium">Tags</th>
            <th class="px-4 py-3 text-left font-medium">Status</th>
            <th class="px-4 py-3 text-center font-medium">Template</th>
            <th class="px-4 py-3 text-left font-medium">Updated</th>
            <th class="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="doc in sortedDocuments"
            :key="doc.id"
            class="border-b hover:bg-muted/30 cursor-pointer transition-colors"
            @click="onRowClick($event, doc)"
          >
            <td class="px-4 py-3 font-mono text-xs">
              {{ doc.document_number || '--' }}
            </td>
            <td class="px-4 py-3 font-medium">
              {{ doc.title }}
            </td>
            <td class="px-4 py-3">
              <Badge variant="secondary">{{ doc.document_type }}</Badge>
            </td>
            <td class="px-4 py-3">
              <div class="flex flex-wrap gap-1">
                <Badge v-for="tag in displayTags(doc)" :key="tag" variant="outline" class="text-xs">
                  {{ tag }}
                </Badge>
                <Badge v-if="overflowTagCount(doc) > 0" variant="outline" class="text-xs">
                  +{{ overflowTagCount(doc) }}
                </Badge>
              </div>
            </td>
            <td class="px-4 py-3">
              <Badge :class="statusClass(doc.status)">
                {{ doc.status || 'draft' }}
              </Badge>
            </td>
            <td class="px-4 py-3 text-center">
              <FileCheck v-if="doc.is_template" class="size-4 text-primary inline-block" />
            </td>
            <td class="px-4 py-3 text-muted-foreground text-xs">
              {{ formatRelativeDate(doc.updated_at) }}
            </td>
            <td class="px-4 py-3 text-right" @click.stop>
              <div class="flex items-center justify-end gap-1">
                <Button
                  v-if="doc.google_doc_url"
                  variant="ghost"
                  size="icon"
                  class="size-8"
                  title="Open Google Doc"
                  @click="emit('open-google-doc', doc)"
                >
                  <ExternalLink class="size-4" />
                </Button>
                <Button
                  v-if="doc.is_template"
                  variant="ghost"
                  size="sm"
                  title="Fill template"
                  @click="emit('fill', doc)"
                >
                  Fill
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-8 text-destructive hover:text-destructive"
                  title="Delete document"
                  @click="emit('delete-doc', doc)"
                >
                  <Trash2 class="size-4" />
                </Button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ProcessDocumentListItem } from '@/types/processDocument.types'
import Badge from '@/components/ui/badge/Badge.vue'
import Button from '@/components/ui/button/Button.vue'
import { ArrowUpDown, ExternalLink, FileCheck, Trash2 } from 'lucide-vue-next'

interface Props {
  documents: ProcessDocumentListItem[]
  isLoading: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'row-click', doc: ProcessDocumentListItem): void
  (e: 'fill', doc: ProcessDocumentListItem): void
  (e: 'complete', doc: ProcessDocumentListItem): void
  (e: 'delete-doc', doc: ProcessDocumentListItem): void
  (e: 'open-google-doc', doc: ProcessDocumentListItem): void
}>()

const MAX_DISPLAY_TAGS = 3

// Sorting
const sortAsc = ref(true)

function toggleSort() {
  sortAsc.value = !sortAsc.value
}

const sortedDocuments = computed(() => {
  const docs = [...props.documents]
  docs.sort((a, b) => {
    const numA = parseDocNumber(a.document_number)
    const numB = parseDocNumber(b.document_number)
    return sortAsc.value ? numA - numB : numB - numA
  })
  return docs
})

function parseDocNumber(docNum: string | null | undefined): number {
  if (!docNum) return Infinity
  const parsed = Number(docNum)
  return Number.isNaN(parsed) ? Infinity : parsed
}

// Tags helpers
function parseTags(doc: ProcessDocumentListItem): string[] {
  const raw = doc.tags
  if (Array.isArray(raw)) return raw.filter((t): t is string => typeof t === 'string')
  return []
}

function displayTags(doc: ProcessDocumentListItem): string[] {
  return parseTags(doc).slice(0, MAX_DISPLAY_TAGS)
}

function overflowTagCount(doc: ProcessDocumentListItem): number {
  const all = parseTags(doc)
  return Math.max(0, all.length - MAX_DISPLAY_TAGS)
}

// Status badge styling
function statusClass(status: string | undefined): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'draft':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'completed':
      return 'bg-gray-100 text-gray-600 border-gray-200'
    case 'archived':
      return 'bg-gray-100 text-gray-500 border-gray-200'
    default:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  }
}

// Relative date formatting
function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 30) return `${diffDay}d ago`

  return date.toLocaleDateString()
}

// Row click — avoid triggering when clicking action buttons
function onRowClick(event: MouseEvent, doc: ProcessDocumentListItem) {
  const target = event.target as HTMLElement
  // Action column has @click.stop so this shouldn't fire, but guard just in case
  if (target.closest('[data-slot="button"]')) return
  emit('row-click', doc)
}
</script>
