<template>
  <AppLayout>
    <div class="p-4 relative space-y-4">
      <ErrorTabs v-model="activeTab" />
      <Alert v-if="fetchError" variant="destructive">{{ fetchError }}</Alert>
      <ErrorFilter
        v-if="activeTab === 'xero'"
        :search="searchTerm"
        :range="dateRange"
        @update:search="searchTerm = $event"
        @update:range="dateRange = $event"
      />
      <ErrorTable
        :headers="tableHeaders"
        :rows="errors"
        :loading="loading"
        :page="page"
        :page-count="pageCount"
        @rowClick="openErrorDialog"
        @update:page="page = $event"
      />
      <ErrorDialog :error="selectedError" @close="closeErrorDialog" />
      <Progress v-if="loading" class="absolute top-0 left-0 right-0" />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
import Progress from '@/components/ui/progress/Progress.vue'
import { Alert } from '@/components/ui/alert'
import ErrorTabs from '@/components/admin/errors/ErrorTabs.vue'
import ErrorFilter from '@/components/admin/errors/ErrorFilter.vue'
import ErrorTable from '@/components/admin/errors/ErrorTable.vue'
import ErrorDialog from '@/components/admin/errors/ErrorDialog.vue'
import { computed, ref, watch, onMounted } from 'vue'
import { useErrorApi } from '@/composables/useErrorApi'
import { z } from 'zod'
import { schemas } from '@/api/generated/api'

// Use generated types from Zodios API
type XeroError = z.infer<typeof schemas.XeroError>
type AppError = z.infer<typeof schemas.AppError>
type JobDeltaRejection = z.infer<typeof schemas.JobDeltaRejection>
type ErrorTab = 'xero' | 'system' | 'job'

interface DateRange {
  start: string | null
  end: string | null
}

type RawErrorRecord =
  | { type: 'xero'; record: XeroError }
  | { type: 'system'; record: AppError }
  | { type: 'job'; record: JobDeltaRejection }

interface DisplayErrorRow {
  id: string
  occurredAt: string
  message: string
  entity: string
  severity: string
  raw: RawErrorRecord
}

const { fetchErrors, error: fetchError } = useErrorApi()

const errors = ref<DisplayErrorRow[]>([])
const loading = ref(false)
const page = ref(1)
const pageCount = ref(1)
const searchTerm = ref('')
const dateRange = ref<DateRange>({ start: null, end: null })
const activeTab = ref<ErrorTab>('xero')
const selectedError = ref<DisplayErrorRow | null>(null)

const tableHeaders = computed(() => {
  if (activeTab.value === 'system') {
    return ['Timestamp', 'Message', 'App / Job', 'Severity']
  }
  if (activeTab.value === 'job') {
    return ['Captured', 'Reason', 'Source', 'Change']
  }
  return ['Date', 'Message', 'Entity', 'Severity']
})

async function loadErrors() {
  loading.value = true
  try {
    const res = await fetchErrors(activeTab.value, page.value, searchTerm.value, dateRange.value)
    errors.value = mapResultsToRows(activeTab.value, res.results)
    pageCount.value = Math.max(res.pageCount, 1)
  } finally {
    loading.value = false
  }
}

function mapResultsToRows(type: ErrorTab, rows: XeroError[] | AppError[] | JobDeltaRejection[]) {
  if (type === 'xero') {
    return (rows as XeroError[]).map((row) => ({
      id: row.id,
      occurredAt: row.timestamp,
      message: row.message,
      entity: row.entity ?? '-',
      severity: row.severity ? String(row.severity) : 'error',
      raw: { type: 'xero', record: row },
    }))
  }

  if (type === 'system') {
    return (rows as AppError[]).map((row) => ({
      id: row.id,
      occurredAt: row.timestamp,
      message: row.message,
      entity: row.app ?? row.job_id ?? row.user_id ?? '-',
      severity:
        row.severity !== undefined ? String(row.severity) : row.resolved ? 'resolved' : 'error',
      raw: { type: 'system', record: row },
    }))
  }

  return (rows as JobDeltaRejection[]).map((row) => ({
    id: row.id,
    occurredAt: row.created_at,
    message: row.reason,
    entity: row.staff_email ?? row.staff_id ?? row.request_ip ?? '-',
    severity: row.change_id ?? row.request_etag ?? row.checksum,
    raw: { type: 'job', record: row },
  }))
}

function openErrorDialog(err: DisplayErrorRow) {
  selectedError.value = err
}
function closeErrorDialog() {
  selectedError.value = null
}

watch([searchTerm, dateRange, activeTab], () => {
  page.value = 1
  errors.value = []
  selectedError.value = null
})
watch([page, searchTerm, dateRange, activeTab], loadErrors, { deep: true })

onMounted(() => loadErrors())
</script>

<style scoped></style>
