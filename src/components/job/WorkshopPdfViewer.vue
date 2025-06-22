<template>
  <div class="h-full">
    <PDF v-if="pdfData" :src="pdfData" class="w-full h-full" />
    <div v-else class="flex items-center justify-center h-full">Loading PDF...</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PDF from 'pdf-vue3'
import { jobRestService } from '@/services/job-rest.service'

const props = defineProps<{ jobId: string }>()
const pdfData = ref<Uint8Array | null>(null)

onMounted(async () => {
  try {
    const blob = await jobRestService.fetchWorkshopPdf(props.jobId)
    const buffer = await blob.arrayBuffer()
    pdfData.value = new Uint8Array(buffer)
  } catch (err) {
    console.error('Error loading PDF:', err)
  }
})
</script>
