<template>
  <div class="h-full flex flex-col">
    <div class="flex-shrink-0 mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Job #{{ jobNumber }} Print Sheet</h2>
          <p class="text-sm text-gray-600">Preview and print the job sheet PDF.</p>
        </div>
        <div class="flex space-x-2">
          <Button v-if="blobUrl" variant="outline" size="sm" asChild>
            <a
              :href="blobUrl"
              :download="`workshop_job_${jobNumber}.pdf`"
              class="inline-flex items-center"
            >
              <Download class="w-4 h-4 mr-1" />
              Download
            </a>
          </Button>
          <Button v-if="blobUrl" @click="printPdf" size="sm">
            <Printer class="w-4 h-4 mr-1" />
            Print
          </Button>
          <Button v-if="blobUrl" @click="attachPdf" :disabled="attaching || attached" size="sm">
            {{ attached ? 'Attached ✅' : attaching ? 'Attaching...' : 'Attach to Job' }}
          </Button>
        </div>
      </div>
    </div>
    <div class="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
      <WorkshopPdfViewer :job-id="jobId" @pdf-ready="handlePdfReady" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { debugLog } from '@/utils/debug'
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import WorkshopPdfViewer from './WorkshopPdfViewer.vue'
import { jobService } from '@/services/job.service'
import { Download, Printer } from 'lucide-vue-next'

interface Props {
  jobId: string
  jobNumber: number
}

const props = defineProps<Props>()

const blobUrl = ref<string | null>(null)
const attaching = ref(false)
const attached = ref(false)

const handlePdfReady = (url: string) => {
  blobUrl.value = url
}

const printPdf = () => {
  if (blobUrl.value) {
    const printWindow = window.open(blobUrl.value)
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print()
      })
    }
  }
}

const attachPdf = async () => {
  if (!blobUrl.value || !props.jobNumber) {
    debugLog('Missing blob URL or job number for PDF attachment')
    return
  }

  attaching.value = true
  try {
    const response = await fetch(blobUrl.value)
    const blob = await response.blob()
    const file = new File([blob], `workshop_job_${props.jobNumber}.pdf`, {
      type: 'application/pdf',
    })

    const uploaded = await jobService.uploadJobFiles(String(props.jobNumber), [file])
    if (uploaded.length > 0) {
      attached.value = true
      debugLog('PDF attached to job successfully')
    }
  } catch (err) {
    debugLog('Error attaching PDF to job:', err)
  } finally {
    attaching.value = false
  }
}
</script>
