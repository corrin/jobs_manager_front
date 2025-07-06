<template>
  <AppLayout>
    <div class="p-4 md:p-8 flex flex-col gap-4">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center py-8">
        <div class="text-gray-600">Loading purchase order...</div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-red-800">{{ error }}</p>
        <Button @click="load" class="mt-2" variant="outline" size="sm"> Try Again </Button>
      </div>

      <!-- Main Content -->
      <div v-else class="flex flex-col lg:flex-row gap-6">
        <PoSummaryCard
          :po="po"
          :is-create-mode="false"
          :show-actions="true"
          :sync-enabled="canSync"
          @update:supplier="po.supplier = $event"
          @update:supplier_id="po.supplier_id = $event"
          @update:reference="po.reference = $event"
          @update:order_date="po.order_date = $event"
          @update:expected_delivery="po.expected_delivery = $event"
          @update:status="po.status = $event"
          @save="saveSummary"
          @sync-xero="syncWithXero"
          @view-xero="viewInXero"
          @print="printPo"
          @email="emailPo"
        />
        <Card class="flex-1 flex flex-col">
          <CardHeader>
            <h2 class="font-semibold">Line Items</h2>
          </CardHeader>
          <CardContent class="flex-1 flex flex-col">
            <PoLinesTable
              :lines="po.lines"
              :items="xeroItemStore.items"
              @update:lines="po.lines = $event"
              @add-line="addLine"
              @delete-line="deleteLine"
            />
          </CardContent>
        </Card>
      </div>
      <div class="flex flex-wrap gap-2 justify-end">
        <Button aria-label="Close" @click="close">Close</Button>
      </div>
    </div>

    <!-- PDF Dialog -->
    <PoPdfDialog
      :open="showPdfDialog"
      :purchase-order-id="orderId"
      :po-number="po.po_number"
      @update:open="showPdfDialog = $event"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PoSummaryCard from '@/components/purchasing/PoSummaryCard.vue'
import PoLinesTable from '@/components/purchasing/PoLinesTable.vue'
import PoPdfDialog from '@/components/purchasing/PoPdfDialog.vue'
import { useRoute, useRouter } from 'vue-router'
import { usePurchaseOrderStore } from '@/stores/purchaseOrderStore'
import { useXeroItemStore } from '@/stores/xeroItemStore'
import { extractErrorMessage, createErrorToast } from '@/utils/errorHandler'
import { toast } from 'vue-sonner'
import axios from 'axios'

type Status = 'draft' | 'submitted' | 'partially_received' | 'fully_received' | 'deleted'

interface PurchaseOrderLine {
  id?: string
  item_code: string
  description: string
  quantity: number
  unit_cost: number | null
  price_tbc: boolean
}

interface PurchaseOrder {
  po_number: string
  supplier: string
  supplier_id?: string
  supplier_has_xero_id: boolean
  reference: string
  order_date: string
  expected_delivery: string
  status: Status
  lines: PurchaseOrderLine[]
  online_url?: string
  xero_id?: string
}

interface XeroSyncResponse {
  success: boolean
  error?: string
  is_incomplete_po?: boolean
  online_url?: string
  xero_id?: string
}

const route = useRoute()
const router = useRouter()
const orderId = route.params.id as string
const store = usePurchaseOrderStore()
const xeroItemStore = useXeroItemStore()
const originalLines = ref<PurchaseOrderLine[]>([])
const isSyncing = ref(false)
const showPdfDialog = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)

const po = ref<PurchaseOrder>({
  po_number: '',
  supplier: '',
  supplier_id: undefined,
  supplier_has_xero_id: false,
  reference: '',
  order_date: '',
  expected_delivery: '',
  status: 'draft',
  lines: [],
})

const linesToDelete = ref<string[]>([])
let debounceTimer: ReturnType<typeof setTimeout> | null = null

async function load() {
  if (!orderId) {
    error.value = 'Purchase order ID is required'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const data = await store.fetchOne(orderId)
    po.value = {
      ...data,
      lines: Array.isArray(data.lines) ? data.lines : [],
    }
    originalLines.value = JSON.parse(JSON.stringify(po.value.lines))
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load purchase order'
    error.value = errorMessage
    console.error('Error loading purchase order:', err)

    // Navigate back to list if PO not found
    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      toast.error('Purchase order not found')
      setTimeout(() => {
        router.push('/purchasing')
      }, 2000)
    } else {
      toast.error(`Failed to load purchase order: ${errorMessage}`)
    }
  } finally {
    isLoading.value = false
  }
}

async function saveSummary() {
  const updateData = {
    reference: po.value.reference,
    order_date: po.value.order_date,
    expected_delivery: po.value.expected_delivery,
    status: po.value.status,
  } as Record<string, unknown>

  // Include supplier data if it has changed
  if (po.value.supplier) {
    updateData.supplier = po.value.supplier
  }
  if (po.value.supplier_id) {
    updateData.supplier_id = po.value.supplier_id
  }

  await store.patch(orderId, updateData)
  toast.success('Summary saved')
  await load()
}

function addLine() {
  po.value.lines = [
    ...po.value.lines,
    { item_code: '', description: '', quantity: 1, unit_cost: 0, price_tbc: false },
  ]
}

function deleteLine(idOrIdx: string | number) {
  if (typeof idOrIdx === 'string') {
    linesToDelete.value.push(idOrIdx)
    po.value.lines = po.value.lines.filter((l: PurchaseOrderLine) => l.id !== idOrIdx)
  } else {
    po.value.lines = po.value.lines.filter((_: PurchaseOrderLine, idx: number) => idx !== idOrIdx)
  }
}

function lineChanged(line: PurchaseOrderLine) {
  if (!line.id) return true
  const orig = originalLines.value.find((o) => o.id === line.id)
  if (!orig) return true

  return (
    orig.item_code !== line.item_code ||
    orig.description !== line.description ||
    +orig.quantity !== +line.quantity ||
    +(orig.unit_cost ?? 0) !== +(line.unit_cost ?? 0) ||
    orig.price_tbc !== line.price_tbc
  )
}

function isValidLine(line: PurchaseOrderLine) {
  const hasContent =
    (line.item_code && line.item_code.trim() !== '') ||
    (line.description && line.description.trim() !== '')

  const hasPrice = (line.unit_cost != null && Number(line.unit_cost) > 0) || line.price_tbc === true

  return hasContent && hasPrice
}

async function saveLines() {
  linesToDelete.value = linesToDelete.value.filter((id) => {
    const l = po.value.lines.find((x: PurchaseOrderLine) => x.id === id)
    return l ? isValidLine(l) : true
  })

  const validLines = po.value.lines.filter(isValidLine)

  if (!validLines.length && !linesToDelete.value.length) return

  const changedLines = validLines.filter(lineChanged)
  if (!changedLines.length && !linesToDelete.value.length) return

  await store.patch(orderId, {
    lines: changedLines,
    lines_to_delete: linesToDelete.value.length ? linesToDelete.value : undefined,
  })

  originalLines.value = JSON.parse(JSON.stringify(validLines))
  linesToDelete.value = []
  toast.success('Lines saved')
}

async function syncWithXero() {
  if (isSyncing.value) return

  isSyncing.value = true
  toast.loading('Syncing with Xero…', { id: 'po-sync-loading' })

  try {
    const { data: res } = await axios.post<XeroSyncResponse>(
      `/api/xero/create_purchase_order/${orderId}`,
    )

    switch (true) {
      case res.success:
        if (res.online_url) po.value.online_url = res.online_url
        if (res.xero_id) po.value.xero_id = res.xero_id
        toast.dismiss('po-sync-loading')
        toast.success('Synced with Xero successfully!')
        break
      case res.is_incomplete_po:
        toast.dismiss('po-sync-loading')
        toast.warning(res.error || 'Purchase order incomplete - missing required fields')
        break
      default:
        toast.dismiss('po-sync-loading')
        throw new Error(res.error || 'Unknown sync error')
    }
  } catch (err: unknown) {
    toast.dismiss('po-sync-loading')
    const errorMessage = extractErrorMessage(err, 'Sync failed')
    toast.error(`Xero sync failed: ${errorMessage}`, createErrorToast())
  } finally {
    isSyncing.value = false
  }
}

function viewInXero() {
  if (!po.value.online_url) {
    toast.error('No Xero URL available. Please sync with Xero first.')
    return
  }

  try {
    window.open(po.value.online_url, '_blank', 'noopener,noreferrer')
    toast.success('Opened Purchase Order in Xero')
  } catch (error) {
    console.error('Failed to open Xero URL:', error)
    toast.error('Failed to open Xero. Please check if pop-ups are blocked.')
  }
}

function printPo() {
  showPdfDialog.value = true
}

function emailPo() {
  emailPurchaseOrder()
}

async function emailPurchaseOrder() {
  try {
    toast.loading('Preparing email...', { id: 'po-email-loading' })

    const emailData = await store.emailPurchaseOrder(orderId)

    if (emailData.success && emailData.mailto_url) {
      // Open Gmail compose in new tab
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailData.email)}&su=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`
      window.open(gmailUrl, '_blank', 'noopener,noreferrer')

      toast.dismiss('po-email-loading')
      toast.success(`Gmail opened for ${emailData.email}`)
    } else {
      toast.dismiss('po-email-loading')
      throw new Error(emailData.error || 'Failed to prepare email')
    }
  } catch (error) {
    toast.dismiss('po-email-loading')
    const errorMessage = extractErrorMessage(error, 'Failed to prepare email')
    toast.error(`Email failed: ${errorMessage}`, createErrorToast())
    console.error('Error preparing email:', error)
  }
}

function close() {
  router.back()
}

const canSync = computed(() => {
  if (!po.value.supplier_has_xero_id) return false

  return po.value.lines.some(
    (l: PurchaseOrderLine) => l.description && l.unit_cost !== null && l.unit_cost !== undefined,
  )
})

onMounted(async () => {
  try {
    await Promise.all([xeroItemStore.fetchItems(), load()])
  } catch (err) {
    console.error('Error during component initialization:', err)
    // Error handling is already done in individual functions
  }

  watch(
    () => po.value.lines,
    () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(saveLines, 500)
    },
    { deep: true, flush: 'post' },
  )

  // Watch for supplier changes and auto-save
  watch(
    () => [po.value.supplier, po.value.supplier_id],
    (newVals, oldVals) => {
      // Only auto-save if values actually changed and we have a supplier name
      if (newVals[0] && (newVals[0] !== oldVals?.[0] || newVals[1] !== oldVals?.[1])) {
        // Debounce supplier changes
        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(async () => {
          try {
            await store.patch(orderId, {
              supplier: po.value.supplier,
              supplier_id: po.value.supplier_id,
            })
            toast.success('Supplier updated')
            // Reload to get updated supplier_has_xero_id status
            await load()
          } catch (error) {
            const errorMessage = extractErrorMessage(error, 'Failed to update supplier')
            toast.error(`Update failed: ${errorMessage}`)
          }
        }, 1000) // Longer debounce for supplier changes
      }
    },
    { deep: true },
  )
})
</script>
