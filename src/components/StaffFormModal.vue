<template>
  <Dialog :open="true" @update:open="handleClose">
    <DialogContent class="max-w-2xl space-y-6 animate-in fade-in-0 zoom-in-95">
      <DialogHeader>
        <DialogTitle>{{ staff ? 'Edit Staff' : 'New Staff' }}</DialogTitle>
      </DialogHeader>
      <form @submit.prevent="submitForm" class="space-y-4">
        <!-- Tab Navigation -->
        <div class="flex border-b mb-2 gap-2">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            :class="[
              'px-4 py-2 font-medium',
              activeTab === tab.key
                ? 'border-b-2 border-indigo-600 text-indigo-700'
                : 'text-gray-500',
            ]"
            @click="activeTab = tab.key"
          >
            <span v-if="tab.icon" :class="'mr-2'">
              <component :is="tab.icon" class="inline w-4 h-4 align-text-bottom" />
            </span>
            {{ tab.label }}
          </button>
        </div>
        <!-- Tab Content -->
        <div v-show="activeTab === 'personal'" class="space-y-4">
          <div class="flex gap-2">
            <Input v-model="form.first_name" placeholder="First Name" required class="w-1/2" />
            <Input v-model="form.last_name" placeholder="Last Name" required class="w-1/2" />
          </div>
          <Input v-model="form.preferred_name" placeholder="Preferred Name" />
          <Input v-model="form.email" type="email" placeholder="E-mail" required />
          <Input
            v-model="form.wage_rate"
            type="number"
            placeholder="Wage Rate"
            min="0"
            step="0.01"
            required
          />
          <Input v-model="form.ims_payroll_id" placeholder="IMS Payroll ID" />
          <div class="space-y-2">
            <label class="text-sm font-medium">Profile Icon/Image</label>
            <input
              type="file"
              accept="image/*"
              @change="onFileChange"
              class="file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors"
            />
          </div>
        </div>
        <div v-show="activeTab === 'working'" class="space-y-2">
          <div class="grid grid-cols-2 gap-2">
            <Input
              v-model.number="form.hours_mon"
              type="number"
              min="0"
              max="24"
              step="0.25"
              placeholder="Monday Hours"
            />
            <Input
              v-model.number="form.hours_tue"
              type="number"
              min="0"
              max="24"
              step="0.25"
              placeholder="Tuesday Hours"
            />
            <Input
              v-model.number="form.hours_wed"
              type="number"
              min="0"
              max="24"
              step="0.25"
              placeholder="Wednesday Hours"
            />
            <Input
              v-model.number="form.hours_thu"
              type="number"
              min="0"
              max="24"
              step="0.25"
              placeholder="Thursday Hours"
            />
            <Input
              v-model.number="form.hours_fri"
              type="number"
              min="0"
              max="24"
              step="0.25"
              placeholder="Friday Hours"
            />
            <Input
              v-model.number="form.hours_sat"
              type="number"
              min="0"
              max="24"
              step="0.25"
              placeholder="Saturday Hours"
            />
            <Input
              v-model.number="form.hours_sun"
              type="number"
              min="0"
              max="24"
              step="0.25"
              placeholder="Sunday Hours"
            />
          </div>
        </div>
        <div v-show="activeTab === 'permissions'" class="space-y-2">
          <div class="flex gap-2 items-center">
            <label class="flex items-center gap-2"
              ><input type="checkbox" v-model="form.is_staff" /> Staff</label
            >
            <label class="flex items-center gap-2"
              ><input type="checkbox" v-model="form.is_active" /> Active</label
            >
            <label class="flex items-center gap-2"
              ><input type="checkbox" v-model="form.is_superuser" /> Superuser</label
            >
          </div>
          <div>
            <label class="text-sm font-medium">Groups</label>
            <Input v-model="form.groups" placeholder="Group IDs (comma separated)" />
          </div>
          <div>
            <label class="text-sm font-medium">Permissions</label>
            <Input v-model="form.user_permissions" placeholder="Permission IDs (comma separated)" />
          </div>
        </div>
        <div v-show="activeTab === 'dates'" class="space-y-2">
          <Input v-model="form.last_login" type="datetime-local" placeholder="Last Login" />
          <Input v-model="form.date_joined" type="datetime-local" placeholder="Date Joined" />
        </div>
        <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>
        <DialogFooter class="flex gap-2 justify-end">
          <Button variant="ghost" type="button" @click="handleClose">Cancel</Button>
          <Button type="submit">{{ staff ? 'Save Changes' : 'Create Staff' }}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import Dialog from '@/components/ui/dialog/Dialog.vue'
import DialogContent from '@/components/ui/dialog/DialogContent.vue'
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue'
import DialogTitle from '@/components/ui/dialog/DialogTitle.vue'
import DialogFooter from '@/components/ui/dialog/DialogFooter.vue'
import Button from '@/components/ui/button/Button.vue'
import Input from '@/components/ui/input/Input.vue'
import { ref, watch } from 'vue'
import { z } from 'zod'
import type { Staff } from '@/types/staff'
import { useStaffApi } from '@/composables/useStaffApi'
import { UserIcon, LockIcon, ClockIcon, CalendarIcon } from 'lucide-vue-next'

const tabs = [
  { key: 'personal', label: 'Personal Info', icon: UserIcon },
  { key: 'working', label: 'Working Hours', icon: ClockIcon },
  { key: 'permissions', label: 'Permissions', icon: LockIcon },
  { key: 'dates', label: 'Important Dates', icon: CalendarIcon },
]
const activeTab = ref('personal')

const props = defineProps<{ staff: Staff | null }>()
const emit = defineEmits(['close', 'saved'])

const { createStaff, updateStaff } = useStaffApi()
const form = ref({
  first_name: '',
  last_name: '',
  preferred_name: '',
  email: '',
  wage_rate: 0,
  ims_payroll_id: '',
  icon: null as File | null,
  hours_mon: 0,
  hours_tue: 0,
  hours_wed: 0,
  hours_thu: 0,
  hours_fri: 0,
  hours_sat: 0,
  hours_sun: 0,
  is_staff: false,
  is_active: true,
  is_superuser: false,
  groups: '',
  user_permissions: '',
  last_login: '',
  date_joined: '',
})
const error = ref('')

const staffSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  wage_rate: z.number().min(0, 'Wage rate must be positive'),
  preferred_name: z.string().optional(),
  ims_payroll_id: z.string().optional(),
  hours_mon: z.number().min(0).max(24),
  hours_tue: z.number().min(0).max(24),
  hours_wed: z.number().min(0).max(24),
  hours_thu: z.number().min(0).max(24),
  hours_fri: z.number().min(0).max(24),
  hours_sat: z.number().min(0).max(24),
  hours_sun: z.number().min(0).max(24),
  is_staff: z.boolean(),
  is_active: z.boolean(),
  is_superuser: z.boolean(),
  groups: z.string().optional(),
  user_permissions: z.string().optional(),
  last_login: z.string().optional(),
  date_joined: z.string().optional(),
})

watch(
  () => props.staff,
  (staff) => {
    if (staff) {
      form.value = {
        first_name: staff.first_name,
        last_name: staff.last_name,
        preferred_name: staff.preferred_name || '',
        email: staff.email,
        wage_rate: staff.wage_rate,
        ims_payroll_id: staff.ims_payroll_id || '',
        icon: null,
        hours_mon: staff.hours_mon || 0,
        hours_tue: staff.hours_tue || 0,
        hours_wed: staff.hours_wed || 0,
        hours_thu: staff.hours_thu || 0,
        hours_fri: staff.hours_fri || 0,
        hours_sat: staff.hours_sat || 0,
        hours_sun: staff.hours_sun || 0,
        is_staff: staff.is_staff || false,
        is_active: staff.is_active ?? true,
        is_superuser: staff.is_superuser || false,
        groups: staff.groups ? String(staff.groups) : '',
        user_permissions: staff.user_permissions ? String(staff.user_permissions) : '',
        last_login: staff.last_login || '',
        date_joined: staff.date_joined || '',
      }
    } else {
      form.value = {
        first_name: '',
        last_name: '',
        preferred_name: '',
        email: '',
        wage_rate: 0,
        ims_payroll_id: '',
        icon: null,
        hours_mon: 0,
        hours_tue: 0,
        hours_wed: 0,
        hours_thu: 0,
        hours_fri: 0,
        hours_sat: 0,
        hours_sun: 0,
        is_staff: false,
        is_active: true,
        is_superuser: false,
        groups: '',
        user_permissions: '',
        last_login: '',
        date_joined: '',
      }
    }
    error.value = ''
  },
  { immediate: true },
)

function onFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files
  form.value.icon = files && files.length ? files[0] : null
}

function handleClose() {
  emit('close')
}

async function submitForm() {
  error.value = ''
  const parsed = staffSchema.safeParse({
    ...form.value,
    wage_rate: Number(form.value.wage_rate),
    hours_mon: Number(form.value.hours_mon),
    hours_tue: Number(form.value.hours_tue),
    hours_wed: Number(form.value.hours_wed),
    hours_thu: Number(form.value.hours_thu),
    hours_fri: Number(form.value.hours_fri),
    hours_sat: Number(form.value.hours_sat),
    hours_sun: Number(form.value.hours_sun),
  })
  if (!parsed.success) {
    error.value = parsed.error.errors[0].message
    return
  }
  try {
    if (props.staff) {
      await updateStaff(props.staff.id, form.value)
    } else {
      await createStaff(form.value)
    }
    emit('saved')
  } catch (e) {
    if (e instanceof Error) {
      error.value = e.message
    } else {
      error.value = 'Failed to save staff.'
    }
  }
}
</script>

<style scoped>
.animate-in {
  animation: fadeInZoom 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes fadeInZoom {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
