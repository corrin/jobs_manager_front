<template>
  <AppLayout>
    <div class="w-full h-full flex flex-col overflow-hidden">
      <div class="flex-1 overflow-y-auto p-0">
        <div class="max-w-5xl mx-auto py-8 px-2 md:px-8 h-full flex flex-col gap-8">
          <div class="flex items-center justify-between mb-2">
            <h1 class="text-3xl font-extrabold text-indigo-700 flex items-center gap-3">
              <svg
                class="w-8 h-8 text-indigo-400 animate-pulse"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" stroke-width="2" />
                <path d="M12 6v6l4 2" stroke-width="2" />
              </svg>
              Staff Management
            </h1>
            <Button variant="default" class="text-lg px-6 py-3" @click="openCreate">
              New Staff
            </Button>
          </div>
          <div
            v-if="loading"
            class="flex-1 flex items-center justify-center text-2xl text-slate-400"
          >
            Loading…
          </div>
          <div v-else class="flex flex-col gap-8 overflow-y-auto max-h-[calc(100vh-8rem)] pr-2">
            <div v-if="filteredStaff.length" class="flex flex-col gap-8">
              <section
                v-for="staff in filteredStaff"
                :key="staff.id"
                class="bg-white rounded-2xl shadow-xl p-8 flex flex-col gap-6 border border-slate-200 hover:shadow-2xl transition-all relative"
              >
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div class="flex items-center gap-4">
                    <div
                      class="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-700 border-2 border-indigo-300"
                    >
                      {{ staff.first_name?.[0] || '?' }}{{ staff.last_name?.[0] || '' }}
                    </div>
                    <div>
                      <div class="text-xl font-bold text-indigo-800">
                        {{ staff.first_name }} {{ staff.last_name }}
                      </div>
                      <div class="text-slate-500 text-sm">{{ staff.email }}</div>
                    </div>
                  </div>
                  <div class="flex gap-2 mt-2 md:mt-0">
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
                  </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <!-- Personal Info -->
                  <div class="space-y-2">
                    <div class="font-semibold text-indigo-600 mb-1">Personal Info</div>
                    <div>
                      <span class="font-medium">Preferred Name:</span> {{ staff.preferred_name }}
                    </div>
                    <div><span class="font-medium">Wage Rate:</span> {{ staff.wage_rate }}</div>
                    <div>
                      <span class="font-medium">IMS Payroll ID:</span> {{ staff.ims_payroll_id }}
                    </div>
                  </div>
                  <!-- Permissions -->
                  <div class="space-y-2">
                    <div class="font-semibold text-indigo-600 mb-1">Permissions</div>
                    <div>
                      <span class="font-medium">Staff:</span> <span v-if="staff.is_staff">✔️</span>
                    </div>
                    <div>
                      <span class="font-medium">Active:</span>
                      <span v-if="staff.is_active">✔️</span>
                    </div>
                    <div>
                      <span class="font-medium">Superuser:</span>
                      <span v-if="staff.is_superuser">✔️</span>
                    </div>
                    <div><span class="font-medium">Groups:</span> {{ staff.groups }}</div>
                    <div>
                      <span class="font-medium">Permissions:</span> {{ staff.user_permissions }}
                    </div>
                  </div>
                  <!-- Working Hours -->
                  <div class="space-y-2">
                    <div class="font-semibold text-indigo-600 mb-1">Working Hours</div>
                    <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <div>
                        Mon: <span class="font-mono">{{ staff.hours_mon }}</span>
                      </div>
                      <div>
                        Tue: <span class="font-mono">{{ staff.hours_tue }}</span>
                      </div>
                      <div>
                        Wed: <span class="font-mono">{{ staff.hours_wed }}</span>
                      </div>
                      <div>
                        Thu: <span class="font-mono">{{ staff.hours_thu }}</span>
                      </div>
                      <div>
                        Fri: <span class="font-mono">{{ staff.hours_fri }}</span>
                      </div>
                      <div>
                        Sat: <span class="font-mono">{{ staff.hours_sat }}</span>
                      </div>
                      <div>
                        Sun: <span class="font-mono">{{ staff.hours_sun }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="flex flex-wrap gap-6 mt-4 text-xs text-slate-500">
                  <div><span class="font-medium">Last Login:</span> {{ staff.last_login }}</div>
                  <div><span class="font-medium">Date Joined:</span> {{ staff.date_joined }}</div>
                </div>
              </section>
            </div>
            <div v-else class="text-center py-10 text-slate-400 text-lg">No staff found.</div>
          </div>
        </div>
      </div>
      <StaffFormModal
        v-if="showModal"
        :staff="selectedStaff"
        @close="closeModal"
        @saved="onSaved"
      />
      <ConfirmModal
        v-if="showConfirm"
        :staff="selectedStaff"
        @close="closeConfirm"
        @confirm="deleteStaff"
      />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
import Button from '@/components/ui/button/Button.vue'
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
        [
          s.first_name,
          s.last_name,
          s.preferred_name,
          s.email,
          s.wage_rate,
          s.ims_payroll_id,
          s.hours_mon,
          s.hours_tue,
          s.hours_wed,
          s.hours_thu,
          s.hours_fri,
          s.hours_sat,
          s.hours_sun,
          s.is_staff,
          s.is_active,
          s.is_superuser,
          s.groups,
          s.user_permissions,
          s.last_login,
          s.date_joined,
        ]
          .map((v) => String(v ?? ''))
          .join(' ')
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
/* Custom scroll for the staff list */
.max-h-\[calc\(100vh-8rem\)\]::-webkit-scrollbar {
  width: 8px;
}
.max-h-\[calc\(100vh-8rem\)\]::-webkit-scrollbar-thumb {
  background: #c7d2fe;
  border-radius: 8px;
}
</style>
