<template>
  <div>
    <h2 class="text-2xl font-bold mb-4">Gerenciamento de Staff</h2>
    <div class="flex flex-col gap-4">
      <div class="flex flex-col md:flex-row md:items-center gap-2 mb-2">
        <input
          v-model="search"
          type="text"
          placeholder="Buscar por nome ou email..."
          class="input input-bordered w-full md:w-64"
        />
        <button @click="openCreate" class="btn btn-primary">Novo Staff</button>
      </div>
      <div v-if="loading" class="text-center py-8">Carregando...</div>
      <div v-else>
        <table class="min-w-full bg-white border rounded shadow">
          <thead>
            <tr>
              <th class="px-4 py-2">Nome</th>
              <th class="px-4 py-2">Email</th>
              <th class="px-4 py-2">Wage Rate</th>
              <th class="px-4 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="staff in filteredStaff" :key="staff.id">
              <td>{{ staff.first_name }} {{ staff.last_name }}</td>
              <td>{{ staff.email }}</td>
              <td>{{ staff.wage_rate }}</td>
              <td>
                <button @click="editStaff(staff)" class="btn btn-xs btn-info mr-2">Editar</button>
                <button @click="confirmDelete(staff)" class="btn btn-xs btn-error">Excluir</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <StaffFormModal v-if="showModal" :staff="selectedStaff" @close="closeModal" @saved="onSaved" />
    <ConfirmModal
      v-if="showConfirm"
      :staff="selectedStaff"
      @close="closeConfirm"
      @confirm="deleteStaff"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useStaffApi } from '@/composables/useStaffApi'
import StaffFormModal from '@/components/StaffFormModal.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import type { Staff } from '@/types/staff'

const { listStaff, deleteStaffApi } = useStaffApi()
const staffList = ref<Staff[]>([])
const loading = ref(true)
const search = ref('')
const showModal = ref(false)
const showConfirm = ref(false)
const selectedStaff = ref<Staff | null>(null)

const filteredStaff = computed(() => {
  if (!search.value) return staffList.value
  return staffList.value.filter((s) =>
    `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(search.value.toLowerCase()),
  )
})

function openCreate() {
  selectedStaff.value = null
  showModal.value = true
}
function editStaff(staff: Staff) {
  selectedStaff.value = staff
  showModal.value = true
}
function closeModal() {
  showModal.value = false
  selectedStaff.value = null
}
function onSaved() {
  fetchStaff()
  closeModal()
}
function confirmDelete(staff: Staff) {
  selectedStaff.value = staff
  showConfirm.value = true
}
function closeConfirm() {
  showConfirm.value = false
  selectedStaff.value = null
}
async function deleteStaff() {
  if (!selectedStaff.value) return
  await deleteStaffApi(selectedStaff.value.id)
  fetchStaff()
  closeConfirm()
}
async function fetchStaff() {
  loading.value = true
  staffList.value = await listStaff()
  loading.value = false
}
onMounted(fetchStaff)
</script>

<style scoped>
.input {
  @apply border rounded px-2 py-1;
}
.btn {
  @apply px-3 py-1 rounded;
}
.btn-primary {
  @apply bg-blue-600 text-white;
}
.btn-info {
  @apply bg-blue-400 text-white;
}
.btn-error {
  @apply bg-red-500 text-white;
}
</style>
