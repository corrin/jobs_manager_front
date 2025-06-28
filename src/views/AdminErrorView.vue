<template>
  <AppLayout>
    <div class="p-4 relative space-y-4">
      <ErrorTabs v-model="activeTab" />
      <ErrorFilter
        :search="searchTerm"
        :range="dateRange"
        @update:search="searchTerm = $event"
        @update:range="dateRange = $event"
      />
      <div v-if="activeTab === 'xero'">
        <ErrorTable
          :errors="errors"
          :loading="loading"
          :page="page"
          :total-pages="totalPages"
          @rowClick="openErrorDialog"
          @update:page="page = $event"
        />
      </div>
      <div v-else>To be implemented.</div>
      <ErrorDialog :error="selectedError" @close="closeErrorDialog" />
      <Progress v-if="loading" class="absolute top-0 left-0 right-0" />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
import Progress from '@/components/ui/progress/Progress.vue'
import ErrorTabs from '@/components/admin/errors/ErrorTabs.vue'
import ErrorFilter from '@/components/admin/errors/ErrorFilter.vue'
import ErrorTable from '@/components/admin/errors/ErrorTable.vue'
import ErrorDialog from '@/components/admin/errors/ErrorDialog.vue'
import { ref, watch } from 'vue'
import { useErrorApi, type ErrorRecord } from '@/composables/useErrorApi'

interface DateRange {
  start: string | null
  end: string | null
}

const { fetchErrors } = useErrorApi()

const errors = ref<ErrorRecord[]>([])
const loading = ref(false)
const page = ref(1)
const totalPages = ref(1)
const searchTerm = ref('')
const dateRange = ref<DateRange>({ start: null, end: null })
const activeTab = ref<'xero' | 'system'>('xero')
const selectedError = ref<ErrorRecord | null>(null)

async function loadErrors() {
  loading.value = true
  const res = await fetchErrors(activeTab.value, page.value, searchTerm.value, dateRange.value)
  errors.value = res.results
  totalPages.value = Math.ceil(res.totalCount / 50)
  loading.value = false
}

function openErrorDialog(err: ErrorRecord) {
  selectedError.value = err
}
function closeErrorDialog() {
  selectedError.value = null
}

watch([page, searchTerm, dateRange, activeTab], loadErrors, { deep: true })

loadErrors()
</script>

<style scoped></style>
