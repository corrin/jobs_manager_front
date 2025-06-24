<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button :disabled="disabled" variant="outline" class="gap-2">
        <Plus class="w-4 h-4" />
        Add entry
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem @click="openMaterialModal">
        <Package class="w-4 h-4 mr-2 text-blue-600" /> Material
      </DropdownMenuItem>
      <DropdownMenuItem @click="openTimeModal">
        <Clock class="w-4 h-4 mr-2 text-green-600" /> Time
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
  <MaterialModal
    v-if="showMaterialModal"
    :wageRate="wageRate"
    :chargeOutRate="chargeOutRate"
    :materialsMarkup="materialsMarkup"
    @close="closeMaterialModal"
    @submit="onMaterialSubmit"
  />
  <TimeModal
    v-if="showTimeModal"
    :wageRate="wageRate"
    :chargeOutRate="chargeOutRate"
    @close="closeTimeModal"
    @submit="onTimeSubmit"
  />
</template>

<script lang="ts" setup>
import { ref, defineEmits } from 'vue'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Plus, Package, Clock } from 'lucide-vue-next'
import MaterialModal from './AddCostLineMaterialModal.vue'
import TimeModal from './AddCostLineTimeModal.vue'

const emit = defineEmits(['add-material', 'add-time'])

const showMaterialModal = ref(false)
const showTimeModal = ref(false)

function openMaterialModal() {
  showMaterialModal.value = true
}
function openTimeModal() {
  showTimeModal.value = true
}
function closeMaterialModal() {
  showMaterialModal.value = false
}
function closeTimeModal() {
  showTimeModal.value = false
}
function onMaterialSubmit(payload: Record<string, unknown>) {
  emit('add-material', payload)
  closeMaterialModal()
}
function onTimeSubmit(payload: Record<string, unknown>) {
  emit('add-time', payload)
  closeTimeModal()
}
</script>

<style scoped>
.add-entry-btn {
  min-width: 120px;
}
</style>
