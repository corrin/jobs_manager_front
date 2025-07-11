<template>
  <AppLayout>
    <div class="p-6 max-w-3xl mx-auto space-y-8">
      <h1 class="text-xl font-bold">Create Purchase Order</h1>

      <PoSummaryCard
        :po="po"
        :is-create-mode="true"
        @update:reference="po.reference = $event"
        @update:order_date="po.order_date = $event"
        @update:expected_delivery="po.expected_delivery = $event"
        @update:status="po.status = $event"
        @update:supplier_id="po.supplier_id = $event"
        @update:supplier="po.supplier = $event"
        @save="save"
      />

      <div class="flex justify-end gap-2">
        <Button variant="secondary" @click="cancel">Cancel</Button>
        <Button :disabled="saving" @click="save">Save</Button>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import PoSummaryCard from '@/components/purchasing/PoSummaryCard.vue'
import { Button } from '@/components/ui/button'
import { useRouter } from 'vue-router'
import { usePurchaseOrderStore } from '@/stores/purchaseOrderStore'
import { toast } from 'vue-sonner'

/**

 * @deprecated Use generated types from src/api/generated instead

 * This interface will be removed after migration to openapi-zod-client generated types

 */

type Status = 'draft' | 'submitted' | 'partially_received' | 'fully_received' | 'deleted'

/**

 * @deprecated Use generated types from src/api/generated instead

 * This interface will be removed after migration to openapi-zod-client generated types

 */

interface PurchaseOrderForm {
  po_number: string
  supplier: string
  supplier_name: string
  supplier_has_xero_id: boolean
  supplier_id: string | null
  reference: string
  order_date: string
  expected_delivery: string
  status: Status
}

const router = useRouter()
const store = usePurchaseOrderStore()
const saving = ref(false)

const po = ref<PurchaseOrderForm>({
  po_number: '',
  supplier: '',
  supplier_name: '',
  supplier_has_xero_id: false,
  supplier_id: null,
  reference: '',
  order_date: '',
  expected_delivery: '',
  status: 'draft',
})

const save = async () => {
  saving.value = true
  try {
    const payload = {
      ...po.value,
      order_date: po.value.order_date || null,
      expected_delivery: po.value.expected_delivery || null,
      supplier_id: po.value.supplier_id || null,
    }
    const res = await store.createOrder(payload)
    toast.success('PO created')
    router.push(`/purchasing/po/${res.id}`)
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Error creating PO'
    toast.error(errorMessage)
  } finally {
    saving.value = false
  }
}

const cancel = () => router.back()
</script>
