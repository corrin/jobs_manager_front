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
          <div v-if="successMessage" class="text-green-600 text-sm mb-2">{{ successMessage }}</div>
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
          <!-- Processing Progress -->
          <div v-if="isProcessing" class="mb-6">
            <ProcessingProgress
              :stage="processingStage"
              :error="processingError"
              :warnings="processingWarnings"
              :statistics="processingStatistics"
            />
          </div>

          <!-- Success Message -->
          <div
            v-if="successMessage && !isProcessing"
            class="text-green-600 text-sm mb-4 p-3 bg-green-50 rounded-lg border border-green-200"
          >
            {{ successMessage }}
          </div>

          <!-- Error Message (when not processing) -->
          <div
            v-if="error && !isProcessing"
            class="text-red-600 text-sm mb-4 p-3 bg-red-50 rounded-lg border border-red-200"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <p class="font-medium mb-1">Upload Failed</p>
                <p>{{ error }}</p>
              </div>
              <button
                v-if="canRetry && lastUploadFile"
                @click="retryUpload"
                class="ml-3 text-red-600 hover:text-red-800 underline text-sm font-medium"
              >
                Retry
              </button>
            </div>
          </div>

          <!-- Upload Area -->
          <DragAndDropUploader @files="upload" :disabled="isProcessing">
            <p class="text-sm text-gray-600">
              {{ isProcessing ? 'Processing...' : 'Drop price file here or click to upload' }}
            </p>
            <p class="text-xs text-gray-500 mt-1">PDF files only, max 10MB</p>
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
import { getCsrfToken } from '@/utils/csrf'

import AppLayout from '@/components/AppLayout.vue'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CircleDollarSign, UploadCloud } from 'lucide-vue-next'
import DragAndDropUploader from '@/components/purchasing/DragAndDropUploader.vue'
import ProcessingProgress from '@/components/purchasing/ProcessingProgress.vue'

interface StatusRow {
  supplier_id: string
  supplier_name: string
  last_uploaded_at: string | null
  file_name: string | null
  total_products?: number | null
  changes_last_update?: number | null
}

interface ProcessingResult {
  success: boolean
  message?: string
  supplier?: {
    name: string
    id: string
    created: boolean
  }
  price_list?: {
    id: string
    filename: string
    uploaded_at: string
  }
  statistics?: {
    total_extracted: number
    total_valid: number
    imported: number
    updated: number
    skipped: number
    failed: number
  }
  validation?: {
    warnings: string[]
    warning_count: number
  }
  error?: string
  stage?: string
  validation_errors?: string[]
  validation_warnings?: string[]
}

const rows = ref<StatusRow[]>([])
const loading = ref(false)
const processingStage = ref<string>('uploading')
const processingError = ref<string | null>(null)
const processingWarnings = ref<string[]>([])
const processingStatistics = ref<ProcessingResult['statistics'] | null>(null)
const isProcessing = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const canRetry = ref(false)
const lastUploadFile = ref<File | null>(null)

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

async function upload(files: FileList) {
  debugLog('upload', files)

  if (!files || files.length === 0) {
    error.value = 'No files selected for upload.'
    return
  }

  const file = files[0]

  // Validate file type
  if (file.type !== 'application/pdf') {
    error.value = 'Please select a PDF file.'
    return
  }

  // Validate file size (e.g., max 10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    error.value = 'File size must be less than 10MB.'
    return
  }

  // Reset state
  resetProcessingState()
  isProcessing.value = true
  error.value = null
  successMessage.value = null
  canRetry.value = false
  lastUploadFile.value = file

  try {
    // Stage 1: Uploading
    processingStage.value = 'uploading'

    const formData = new FormData()
    formData.append('price_list_file', file)

    const csrfToken = getCsrfToken()

    // Stage 2: Extracting (simulate stage change before request)
    setTimeout(() => {
      if (isProcessing.value && processingStage.value === 'uploading') {
        processingStage.value = 'extracting'
      }
    }, 1000)

    const response = await axios.post('/quoting/api/extract-supplier-price-list/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(csrfToken && { 'X-CSRFToken': csrfToken }),
      },
      timeout: 180000, // 60 seconds for PDF processing with AI
    })

    const result = response.data as ProcessingResult

    if (result.success) {
      // Progress through final stages quickly
      processingStage.value = 'validating'
      await new Promise((resolve) => setTimeout(resolve, 500))

      processingStage.value = 'importing'
      await new Promise((resolve) => setTimeout(resolve, 500))

      processingStage.value = 'complete'

      // Set final results
      processingStatistics.value = result.statistics || null
      processingWarnings.value = result.validation?.warnings || []

      // Create detailed success message
      const stats = result.statistics
      let message = `Successfully processed "${file.name}"`
      if (stats) {
        message += ` - Imported ${stats.imported} products`
        if (stats.updated > 0) message += `, updated ${stats.updated}`
        if (stats.skipped > 0) message += `, skipped ${stats.skipped}`
      }

      successMessage.value = message

      // Refresh the status table
      await refresh()
      debugLog('Processing successful', result)
    } else {
      handleProcessingError(result)
    }
  } catch (e: unknown) {
    debugLog('Upload error', e)

    const error = e as any // eslint-disable-line @typescript-eslint/no-explicit-any
    const errorData = error.response?.data as ProcessingResult
    if (errorData?.error) {
      handleProcessingError(errorData)
    } else if (error.response?.status === 413) {
      processingError.value = 'File is too large. Please select a smaller file.'
      canRetry.value = false // File size issue can't be retried
    } else if (error.response?.status >= 500) {
      processingError.value = 'Server error occurred. Please try again later.'
      canRetry.value = true
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      processingError.value = 'Network error. Please check your connection and try again.'
      canRetry.value = true
    } else {
      processingError.value = 'Upload failed. Please try again.'
      canRetry.value = true
    }
  } finally {
    // Keep processing state for a bit to show results
    setTimeout(() => {
      if (processingStage.value === 'complete' || processingError.value) {
        isProcessing.value = false
      }
    }, 3000)
  }
}

function resetProcessingState() {
  processingStage.value = 'uploading'
  processingError.value = null
  processingWarnings.value = []
  processingStatistics.value = null
}

function handleProcessingError(result: ProcessingResult) {
  processingError.value = result.error || 'Processing failed'

  // Set warnings if available
  if (result.validation_warnings) {
    processingWarnings.value = result.validation_warnings
  }

  // Add validation errors to warnings for display
  if (result.validation_errors) {
    processingWarnings.value = [...processingWarnings.value, ...result.validation_errors]
  }

  // Determine if this error is retryable
  const stage = result.stage || 'unknown'
  if (stage === 'extraction' || stage === 'processing') {
    canRetry.value = true // AI extraction errors might be temporary
  } else if (stage === 'validation' && result.validation_errors) {
    canRetry.value = false // Validation errors indicate bad data
  } else {
    canRetry.value = true // Default to retryable
  }
}

async function retryUpload() {
  if (!lastUploadFile.value) return

  debugLog('Retrying upload', lastUploadFile.value.name)

  // Create a new FileList-like object for retry
  const fileList = {
    0: lastUploadFile.value,
    length: 1,
    item: (index: number) => (index === 0 ? lastUploadFile.value : null),
    [Symbol.iterator]: function* () {
      if (lastUploadFile.value) yield lastUploadFile.value
    },
  } as FileList

  await upload(fileList)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function clearMessages() {
  error.value = null
  successMessage.value = null
  processingError.value = null
  processingWarnings.value = []
  canRetry.value = false
}
</script>
