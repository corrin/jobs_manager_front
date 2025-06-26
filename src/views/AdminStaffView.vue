<template>
  <Card
    class="p-6 space-y-6 rounded-2xl shadow-lg transition-transform duration-200 ease-out"
    v-motion="{ initial: { y: 0 }, hover: { y: -4 } }"
  >
    <CardHeader class="p-0 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
      <div>
        <CardTitle class="text-indigo-600">Staff Management</CardTitle>
        <CardDescription>Manage your team members with ease.</CardDescription>
      </div>
      <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <Input
          v-model="search"
          placeholder="Search by name or e-mail…"
          class="w-full sm:w-64"
          aria-label="Search staff"
        />
        <Button variant="default" aria-label="Create new staff member" @click="openCreate">
          New Staff
        </Button>
      </div>
    </CardHeader>

    <CardContent class="p-0">
      <div v-if="loading" class="py-12 text-center text-slate-500">Loading…</div>
      <Table v-else role="table" aria-label="Staff list" class="min-w-full">
        <TableHeader>
          <TableRow class="bg-slate-50">
            <TableHead>Name</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Wage Rate</TableHead>
            <TableHead class="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="filteredStaff.length">
            <TableRow
              v-for="staff in filteredStaff"
              :key="staff.id"
              class="hover:bg-emerald-50 focus-within:bg-emerald-100 transition-colours"
            >
              <TableCell>{{ staff.first_name }} {{ staff.last_name }}</TableCell>
              <TableCell>{{ staff.email }}</TableCell>
              <TableCell>{{ staff.wage_rate }}</TableCell>
              <TableCell class="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  aria-label="Edit staff"
                  @click="editStaff(staff)"
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  aria-label="Delete staff"
                  @click="confirmDelete(staff)"
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          </template>
          <TableRow v-else>
            <TableCell colspan="4" class="text-center py-10 text-slate-500">
              No staff found.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </CardContent>

    <StaffFormModal v-if="showModal" :staff="selectedStaff" @close="closeModal" @saved="onSaved" />
    <ConfirmModal
      v-if="showConfirm"
      :staff="selectedStaff"
      @close="closeConfirm"
      @confirm="deleteStaff"
    />
  </Card>
</template>

<script setup lang="ts">
import Card from '@/components/ui/card/Card.vue'
import CardHeader from '@/components/ui/card/CardHeader.vue'
import CardTitle from '@/components/ui/card/CardTitle.vue'
import CardDescription from '@/components/ui/card/CardDescription.vue'
import CardContent from '@/components/ui/card/CardContent.vue'
import Button from '@/components/ui/button/Button.vue'
import Input from '@/components/ui/input/Input.vue'
import Table from '@/components/ui/table/Table.vue'
import TableHeader from '@/components/ui/table/TableHeader.vue'
import TableRow from '@/components/ui/table/TableRow.vue'
import TableHead from '@/components/ui/table/TableHead.vue'
import TableBody from '@/components/ui/table/TableBody.vue'
import TableCell from '@/components/ui/table/TableCell.vue'
import { ref, computed, onMounted } from 'vue'
import { useStaffApi } from '@/composables/useStaffApi'
import StaffFormModal from '@/components/StaffFormModal.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import type { Staff } from '@/types/staff'

const { listStaff, removeStaff } = useStaffApi()
const staffList = ref<Staff[]>([])
const loading = ref(true)
const search = ref('')
const showModal = ref(false)
const showConfirm = ref(false)
const selectedStaff = ref<Staff | null>(null)

const filteredStaff = computed(() =>
  !search.value
    ? staffList.value
    : staffList.value.filter((s) =>
        `${s.first_name} ${s.last_name} ${s.email}`
          .toLowerCase()
          .includes(search.value.toLowerCase()),
      ),
)

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
