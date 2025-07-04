<template>
  <div class="h-full">
    <PDF v-if="pdfData" :src="pdfData" class="w-full h-full" />
    <div v-else class="flex items-center justify-center h-full">Loading PDF...</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PDF from 'pdf-vue3'
import { usePurchaseOrderStore } from '@/stores/purchaseOrderStore'
import { toast } from 'vue-sonner'

const props = defineProps<{
  purchaseOrderId: string
}>()

const pdfData = ref<Uint8Array | null>(null)
const purchaseOrderStore = usePurchaseOrderStore()

onMounted(async () => {
  try {
    const blob = await purchaseOrderStore.fetchPurchaseOrderPdf(props.purchaseOrderId)
    const buffer = await blob.arrayBuffer()
    pdfData.value = new Uint8Array(buffer)
  } catch (err) {
    console.error('Error loading Purchase Order PDF:', err)
    const errorMessage = err instanceof Error ? err.message : 'Failed to load PDF'
    toast.error(`PDF loading failed: ${errorMessage}`)
  }
})
</script>
