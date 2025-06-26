<template>
  <div>
    <h2 class="text-2xl font-bold mb-4">Staff Management</h2>
    <div class="flex flex-col gap-4">
      <div class="flex flex-col md:flex-row md:items-center gap-2 mb-2">
        <input
          v-model="search"
          type="text"
          placeholder="Search by name or email..."
          class="border rounded px-2 py-1 w-full md:w-64"
        />
        <button @click="openCreate" class="px-3 py-1 rounded bg-blue-600 text-white">
          New Staff
        </button>
      </div>
      <div v-if="loading" class="text-center py-8">Loading...</div>
      <div v-else>
        <table class="min-w-full bg-white border rounded shadow">
          <thead>
            <tr>
              <th class="px-4 py-2">Name</th>
              <th class="px-4 py-2">Email</th>
              <th class="px-4 py-2">Wage Rate</th>
              <th class="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="staff in filteredStaff" :key="staff.id">
              <td>{{ staff.first_name }} {{ staff.last_name }}</td>
              <td>{{ staff.email }}</td>
              <td>{{ staff.wage_rate }}</td>
              <td>
                <button
                  @click="editStaff(staff)"
                  class="px-2 py-1 rounded bg-blue-400 text-white text-xs mr-2"
                >
                  Edit
                </button>
                <button
                  @click="confirmDelete(staff)"
                  class="px-2 py-1 rounded bg-red-500 text-white text-xs"
                >
                  Delete
                </button>
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
import { useAppLayout } from '@/composables/useAppLayout'

const { listStaff, removeStaff } = useStaffApi()
const staffList = ref<Staff[]>([])
const loading = ref(true)
const search = ref('')
const showModal = ref(false)
const showConfirm = ref(false)
const selectedStaff = ref<Staff | null>(null)

const { userInfo } = useAppLayout()
console.log('[AdminStaffView] userInfo:', userInfo.value)
if (userInfo.value) {
  console.log('[AdminStaffView] userInfo keys:', Object.keys(userInfo.value))
  console.log('[AdminStaffView] is_staff:', userInfo.value.is_staff)
}

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
  await removeStaff(selectedStaff.value.id)
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
/* No custom styles needed */
</style>
