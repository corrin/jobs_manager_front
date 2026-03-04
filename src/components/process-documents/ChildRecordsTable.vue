<template>
  <div>
    <h3 class="text-lg font-semibold mb-3">Records Created from This Template</h3>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center gap-2 py-4 text-muted-foreground">
      <Loader2 class="size-4 animate-spin" />
      Loading records...
    </div>

    <!-- Empty state -->
    <p v-else-if="children.length === 0" class="text-muted-foreground text-sm py-4">
      No records created from this template yet.
    </p>

    <!-- Table -->
    <div v-else class="border rounded-md overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-muted/50">
          <tr>
            <th class="text-left px-4 py-2 font-medium">Created</th>
            <th class="text-left px-4 py-2 font-medium">Status</th>
            <th class="text-left px-4 py-2 font-medium">Job #</th>
            <th class="text-left px-4 py-2 font-medium">Title</th>
            <th class="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="child in children"
            :key="child.id"
            class="border-t hover:bg-muted/30 transition-colors"
          >
            <td class="px-4 py-2">{{ formatDate(child.created_at) }}</td>
            <td class="px-4 py-2">
              <Badge :variant="statusVariant(child.status)">
                {{ child.status ?? 'draft' }}
              </Badge>
            </td>
            <td class="px-4 py-2">{{ child.job_number ?? '-' }}</td>
            <td class="px-4 py-2">{{ child.title }}</td>
            <td class="px-4 py-2 text-right">
              <router-link :to="detailRoute(child)" class="text-primary hover:underline text-sm">
                View
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { processDocumentsService } from '@/services/processDocuments.service'
import type { ProcessDocumentListItem, ProcessDocumentStatus } from '@/types/processDocument.types'
import type { FormSchema } from '@/types/processDocument.types'

interface Props {
  templateId: string
}

const props = defineProps<Props>()

const children = ref<ProcessDocumentListItem[]>([])
const isLoading = ref(false)

onMounted(async () => {
  isLoading.value = true
  try {
    children.value = await processDocumentsService.listProcessDocumentsByParent(props.templateId)
  } catch (e) {
    console.error('Failed to load child records:', e)
  } finally {
    isLoading.value = false
  }
})

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString()
}

function statusVariant(
  status: ProcessDocumentStatus | undefined,
): 'default' | 'secondary' | 'outline' {
  switch (status) {
    case 'active':
      return 'default'
    case 'completed':
      return 'secondary'
    default:
      return 'outline'
  }
}

function detailRoute(child: ProcessDocumentListItem): string {
  const schema = child.form_schema as FormSchema | undefined
  const hasFields = schema && Array.isArray(schema.fields) && schema.fields.length > 0
  if (hasFields) {
    return `/process-documents/forms/${child.id}`
  }
  return `/process-documents/${child.id}`
}
</script>
