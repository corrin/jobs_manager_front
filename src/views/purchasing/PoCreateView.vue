<template>
  <AppLayout>
    <div class="p-6 max-w-3xl mx-auto space-y-8">
      <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h1 class="text-xl font-bold" data-automation-id="PoCreateView-title">
          Create Purchase Order
        </h1>
        <div class="text-sm text-gray-600">
          <span v-if="isLoadingLastPoNumber">Loading last PO number...</span>
          <template v-else-if="lastPoNumber">
            <span class="font-semibold text-gray-900">Last PO:</span> {{ lastPoNumber }}
            <span v-if="nextPoNumber" class="text-gray-500">- Next: {{ nextPoNumber }}</span>
          </template>
          <span v-else-if="lastPoNumberError" class="text-red-600"> PO number unavailable </span>
          <span v-else class="text-gray-500">No previous PO number found</span>
        </div>
      </div>

      <PoSummaryCard
        :po="po"
        :is-create-mode="true"
        @update:reference="po.reference = $event"
        @update:expected_delivery="po.expected_delivery = $event"
        @update:status="po.status = $event"
        @update:supplier_id="po.supplier_id = $event"
        @update:supplier="po.supplier = $event"
        @save="save"
      />

      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-xs text-gray-500">{{ draftSavedLabel }}</p>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="cancel"
            :disabled="saving"
            data-automation-id="PoCreateView-cancel"
            >Cancel</Button
          >
          <Button :disabled="saving" @click="save" data-automation-id="PoCreateView-save">
            <div v-if="saving" class="flex items-center gap-2">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Creating PO...
            </div>
            <span v-else>Save</span>
          </Button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import PoSummaryCard from '@/components/purchasing/PoSummaryCard.vue'
import { Button } from '@/components/ui/button'
import { useRouter } from 'vue-router'
import { usePurchaseOrderStore } from '@/stores/purchaseOrderStore'
import { toast } from 'vue-sonner'
import { debugLog } from '@/utils/debug'
import { schemas } from '@/api/generated/api'
import type { z } from 'zod'

type PurchaseOrderDetail = z.infer<typeof schemas.PurchaseOrderDetail>
type PurchaseOrderCreatePayload = z.infer<typeof schemas.PurchaseOrderCreate>

const router = useRouter()
const store = usePurchaseOrderStore()
const saving = ref(false)
const lastPoNumber = ref<string | null>(null)
const isLoadingLastPoNumber = ref(false)
const lastPoNumberError = ref<string | null>(null)
const lastDraftSavedAt = ref<Date | null>(null)
const DRAFT_STORAGE_KEY = 'po-create-draft'
let draftSaveTimer: ReturnType<typeof setTimeout> | null = null

const po = ref<PurchaseOrderDetail>({
  po_number: '',
  supplier: '',
  supplier_has_xero_id: false,
  supplier_id: null,
  pickup_address_id: null,
  pickup_address: {} as PurchaseOrderDetail['pickup_address'],
  reference: '',
  expected_delivery: '',
  status: 'draft',
  id: '',
  order_date: '',
  lines: [],
  online_url: undefined,
  xero_id: undefined,
  created_by_id: null,
  created_by_name: '',
})

const nextPoNumber = computed(() => {
  if (!lastPoNumber.value) return null
  const match = lastPoNumber.value.match(/^(.*?)(\d+)\s*$/)
  if (!match) return null

  const prefix = match[1]
  const numberPart = match[2]
  const incremented = (Number(numberPart) || 0) + 1

  return `${prefix}${incremented.toString().padStart(numberPart.length, '0')}`
})

const draftSavedLabel = computed(() => {
  if (!lastDraftSavedAt.value) return 'Local draft ready'
  return `Draft saved locally at ${lastDraftSavedAt.value.toLocaleTimeString()}`
})

const persistDraft = () => {
  if (typeof localStorage === 'undefined') return
  try {
    const payload = {
      supplier: po.value.supplier,
      supplier_id: po.value.supplier_id,
      pickup_address_id: po.value.pickup_address_id,
      reference: po.value.reference,
      expected_delivery: po.value.expected_delivery,
      order_date: po.value.order_date,
      savedAt: Date.now(),
    }
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload))
    lastDraftSavedAt.value = new Date(payload.savedAt)
  } catch (err) {
    debugLog('Failed to persist PO draft locally', err)
  }
}

const scheduleDraftPersist = () => {
  if (draftSaveTimer) {
    clearTimeout(draftSaveTimer)
  }
  draftSaveTimer = setTimeout(persistDraft, 400)
}

const restoreDraft = () => {
  if (typeof localStorage === 'undefined') return
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as Partial<PurchaseOrderDetail> & { savedAt?: number }

    po.value = {
      ...po.value,
      supplier: parsed.supplier ?? po.value.supplier,
      supplier_id: parsed.supplier_id ?? po.value.supplier_id,
      pickup_address_id: parsed.pickup_address_id ?? po.value.pickup_address_id,
      reference: parsed.reference ?? po.value.reference,
      expected_delivery: parsed.expected_delivery ?? po.value.expected_delivery,
      order_date: parsed.order_date ?? po.value.order_date,
    }

    if (parsed.savedAt) {
      lastDraftSavedAt.value = new Date(parsed.savedAt)
    }
  } catch (err) {
    debugLog('Failed to restore PO draft locally', err)
  }
}

const clearDraft = () => {
  if (typeof localStorage === 'undefined') return
  if (draftSaveTimer) {
    clearTimeout(draftSaveTimer)
    draftSaveTimer = null
  }
  localStorage.removeItem(DRAFT_STORAGE_KEY)
  lastDraftSavedAt.value = null
}

const refreshLastPoNumber = async () => {
  isLoadingLastPoNumber.value = true
  lastPoNumberError.value = null

  try {
    const latest = await store.fetchLastPoNumber()
    lastPoNumber.value = latest
  } catch (err) {
    lastPoNumberError.value = err instanceof Error ? err.message : 'Failed to load last PO number'
    debugLog('Error fetching last PO number', err)
  } finally {
    isLoadingLastPoNumber.value = false
  }
}

watch(
  po,
  () => {
    scheduleDraftPersist()
  },
  { deep: true },
)

onMounted(() => {
  restoreDraft()
  refreshLastPoNumber()
})

onBeforeUnmount(() => {
  if (draftSaveTimer) {
    clearTimeout(draftSaveTimer)
    draftSaveTimer = null
  }
})

const save = async () => {
  saving.value = true
  try {
    await refreshLastPoNumber()

    const payload: PurchaseOrderCreatePayload = {
      supplier_id: po.value.supplier_id || null,
      reference: po.value.reference ?? '',
      order_date: po.value.order_date || null,
      expected_delivery: po.value.expected_delivery || null,
      lines: [],
    }
    const res = await store.createOrder(payload)
    toast.success('PO created')
    clearDraft()
    router.push(`/purchasing/po/${res.id}`)
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Error creating PO'
    toast.error(errorMessage)
  } finally {
    saving.value = false
  }
}

const cancel = () => {
  clearDraft()
  router.back()
}
</script>
