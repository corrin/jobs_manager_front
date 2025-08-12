<template>
  <AppLayout>
    <div class="p-4 md:p-8 flex flex-col gap-4">
      <!-- Current Status Table -->
      <Card class="rounded-2xl shadow-lg">
        <CardHeader class="border-b">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <CircleDollarSign class="w-6 h-6 text-indigo-600" />
              <h2 class="text-lg font-semibold">Current Supplier Price Status</h2>
            </div>
            <button
              class="text-indigo-600 hover:underline text-sm"
              @click="refresh"
              :disabled="loading"
            >
              {{ loading ? 'Refreshing…' : 'Refresh' }}
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="error" class="text-red-600 text-sm mb-2">{{ error }}</div>
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead>
                <tr class="text-left text-gray-600 border-b">
                  <th class="py-2 pr-4">Supplier</th>
                  <th class="py-2 pr-4">Last Updated</th>
                  <th class="py-2 pr-4">File</th>
                  <th class="py-2 pr-4 text-right">Total Products</th>
                  <th class="py-2 pr-4 text-right">Changes (last update)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in rows" :key="row.supplier_id" class="border-b last:border-0">
                  <td class="py-2 pr-4">{{ row.supplier_name }}</td>
                  <td class="py-2 pr-4">
                    <span v-if="row.last_uploaded_at">{{ formatDate(row.last_uploaded_at) }}</span>
                    <span v-else class="text-gray-400">Never</span>
                  </td>
                  <td class="py-2 pr-4">
                    <span v-if="row.file_name">{{ row.file_name }}</span>
                    <span v-else class="text-gray-400">—</span>
                  </td>
                  <td class="py-2 pr-4 text-right">
                    <span v-if="row.total_products !== null && row.total_products !== undefined">{{
                      row.total_products
                    }}</span>
                    <span v-else class="text-gray-400">—</span>
                  </td>
                  <td class="py-2 pr-4 text-right">
                    <span
                      v-if="
                        row.changes_last_update !== null && row.changes_last_update !== undefined
                      "
                      >{{ row.changes_last_update }}</span
                    >
                    <span v-else class="text-gray-400">—</span>
                  </td>
                </tr>
                <tr v-if="!rows.length && !loading">
                  <td colspan="3" class="py-4 text-gray-500">No suppliers found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <!-- Upload Panel -->
      <Card class="rounded-2xl shadow-lg">
        <CardHeader class="border-b">
          <div class="flex items-center gap-2">
            <UploadCloud class="w-6 h-6 text-indigo-600" />
            <h1 class="text-xl font-bold">Upload Supplier Pricing</h1>
          </div>
        </CardHeader>
        <CardContent>
          <DragAndDropUploader @files="upload">
            <p class="text-sm text-gray-600">Drop price file here</p>
          </DragAndDropUploader>
        </CardContent>
      </Card>
    </div>
  </AppLayout>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import axios from '@/plugins/axios'
import { debugLog } from '@/utils/debug'

import AppLayout from '@/components/AppLayout.vue'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CircleDollarSign, UploadCloud } from 'lucide-vue-next'
import DragAndDropUploader from '@/components/purchasing/DragAndDropUploader.vue'

interface StatusRow {
  supplier_id: string
  supplier_name: string
  last_uploaded_at: string | null
  file_name: string | null
  total_products?: number | null
  changes_last_update?: number | null
}

const rows = ref<StatusRow[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

import { formatInNZT } from '@/utils/formatDate'

function formatDate(iso: string) {
  return formatInNZT(iso)
}

async function refresh() {
  loading.value = true
  error.value = null
  try {
    const res = await axios.get('/purchasing/rest/supplier-price-status/')
    rows.value = (res.data?.items || []) as StatusRow[]
  } catch (e) {
    error.value = 'Failed to load supplier price status.'
    debugLog('supplier price status error', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  refresh()
})

function upload(files: FileList) {
  debugLog('upload', files)
}
</script>
