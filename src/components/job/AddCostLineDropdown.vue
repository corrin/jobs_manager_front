<template>
  <div>
    <button @click="toggleDropdown" :disabled="disabled" class="add-entry-btn">
      + Add entry
    </button>
    <div v-if="dropdownOpen" class="dropdown-menu">
      <button @click="openMaterialModal">Material</button>
      <button @click="openTimeModal">Time</button>
    </div>
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
  </div>
</template>

<script lang="ts" setup>
import { ref, defineEmits } from 'vue'
import MaterialModal from './AddCostLineMaterialModal.vue'
import TimeModal from './AddCostLineTimeModal.vue'

const emit = defineEmits(['add-material', 'add-time'])

const dropdownOpen = ref(false)
const showMaterialModal = ref(false)
const showTimeModal = ref(false)

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value
}
function openMaterialModal() {
  dropdownOpen.value = false
  showMaterialModal.value = true
}
function openTimeModal() {
  dropdownOpen.value = false
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
.dropdown-menu {
  position: absolute;
  background: #fff;
  border: 1px solid #ccc;
  z-index: 10;
  margin-top: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.dropdown-menu button {
  display: block;
  width: 100%;
  padding: 8px 16px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
}
</style>
