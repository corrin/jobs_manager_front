<template>
  <AppLayout>
    <div class="p-4 md:p-8 flex flex-col gap-4">
      <Card class="rounded-2xl shadow-lg">
        <CardHeader class="border-b">
          <div class="flex items-center gap-2">
            <Box class="w-6 h-6 text-indigo-600" />
            <h1 class="text-xl font-bold">Stock</h1>
            <Button size="sm" class="ml-auto" @click="openAdd">Add</Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable :columns="columns" :data="items" @add="openAdd" />
        </CardContent>
      </Card>
    </div>
    <Dialog :open="showUse" @update:open="showUse = $event">
      <DialogContent>
        <DialogHeader><DialogTitle>Use Stock</DialogTitle></DialogHeader>
        <div class="space-y-2">
          <Input v-model="jobId" placeholder="Job ID" />
          <Input v-model.number="qty" type="number" placeholder="Quantity" />
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showUse = false">Cancel</Button>
          <Button @click="submitUse">Use</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog :open="showAdd" @update:open="showAdd = $event">
      <DialogContent>
        <DialogHeader><DialogTitle>Add Stock</DialogTitle></DialogHeader>
        <div class="space-y-2">
          <Input v-model="desc" placeholder="Description" />
          <Input v-model.number="qty" type="number" placeholder="Quantity" />
          <Input v-model.number="cost" type="number" placeholder="Unit cost" />
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showAdd = false">Cancel</Button>
          <Button @click="submitAdd">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog :open="showDelete" @update:open="showDelete = $event">
      <DialogContent>
        <DialogHeader><DialogTitle>Delete Stock</DialogTitle></DialogHeader>
        <p class="mb-4">Are you sure?</p>
        <DialogFooter>
          <Button variant="outline" @click="showDelete = false">Cancel</Button>
          <Button variant="destructive" @click="submitDelete">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </AppLayout>
</template>
<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Box } from 'lucide-vue-next'
import { useStockStore } from '@/stores/stockStore'
import { onMounted, ref } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { toast } from 'vue-sonner'

const store = useStockStore()
const items = store.items

const columns: ColumnDef<(typeof items.value)[0]>[] = [
  { accessorKey: 'description', header: 'Description' },
  { accessorKey: 'quantity', header: 'Qty' },
  { accessorKey: 'unit_cost', header: 'Cost' },
]

const showUse = ref(false)
const showAdd = ref(false)
const showDelete = ref(false)

const jobId = ref('')
const qty = ref(1)
const desc = ref('')
const cost = ref(0)

function openAdd() {
  showAdd.value = true
}
function submitUse() {
  showUse.value = false
  toast.success('Stock used')
}
function submitAdd() {
  showAdd.value = false
  toast.success('Stock added')
}
function submitDelete() {
  showDelete.value = false
  toast.success('Stock deleted')
}

onMounted(() => store.fetchStock())
</script>
