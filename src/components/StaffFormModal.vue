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
        <div v-show="activeTab === 'personal'" class="space-y-2">
          <div class="flex gap-2">
            <div class="w-1/2">
              <label class="block text-sm font-medium mb-1" for="first_name">First Name</label>
              <Input id="first_name" v-model="form.first_name" placeholder="First Name" required />
            </div>
            <div class="w-1/2">
              <label class="block text-sm font-medium mb-1" for="last_name">Last Name</label>
              <Input id="last_name" v-model="form.last_name" placeholder="Last Name" required />
            </div>
          </div>
          <div class="flex gap-2">
            <div class="w-1/2">
              <label class="block text-sm font-medium mb-1" for="preferred_name"
                >Preferred Name</label
              >
              <Input
                id="preferred_name"
                v-model="form.preferred_name"
                placeholder="Preferred Name"
              />
            </div>
            <div class="w-1/2">
              <label class="block text-sm font-medium mb-1" for="email">E-mail</label>
              <Input id="email" v-model="form.email" type="email" placeholder="E-mail" required />
            </div>
          </div>
          <div class="flex gap-2">
            <div class="w-1/2">
              <label class="block text-sm font-medium mb-1" for="wage_rate"
                >Wage Rate (NZD/hour)</label
              >
              <Input
                id="wage_rate"
                v-model="form.wage_rate"
                type="number"
                placeholder="Wage Rate"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div class="w-1/2">
              <label class="block text-sm font-medium mb-1" for="ims_payroll_id"
                >IMS Payroll ID</label
              >
              <Input
                id="ims_payroll_id"
                v-model="form.ims_payroll_id"
                placeholder="IMS Payroll ID"
              />
            </div>
          </div>
          <div class="flex justify-center mt-2">
            <div>
              <label class="block text-sm font-medium mb-1 text-center">Profile Icon/Image</label>
              <label
                class="relative group cursor-pointer"
                tabindex="0"
                @keydown.enter.prevent="$refs.avatarInput.click()"
                :aria-label="
                  form.first_name || form.last_name
                    ? `${form.first_name} ${form.last_name}`
                    : 'User avatar'
                "
              >
                <div
                  class="avatar-upload flex items-center justify-center rounded-full bg-indigo-100 border-2 border-indigo-300 w-16 h-16 text-xl font-bold text-indigo-700 overflow-hidden transition-all duration-150 group-hover:ring-4 group-hover:ring-indigo-300 group-hover:opacity-90 mx-auto"
                >
                  <template v-if="avatarUrl">
                    <img :src="avatarUrl" alt="Profile image" class="object-cover w-full h-full" />
                  </template>
                  <template v-else>
                    {{ initials }}
                  </template>
                  <div
                    class="absolute inset-0 flex flex-col items-center justify-center bg-indigo-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10"
                  >
                    <svg
                      class="w-6 h-6 text-white mb-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M12 16v-4m0 0V8m0 4h4m-4 0H8"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    <span class="text-xs text-white">Change</span>
                  </div>
                </div>
                <input
                  ref="avatarInput"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="onFileChange"
                />
              </label>
            </div>
          </div>
        </div>
        <div v-show="activeTab === 'working'" class="space-y-2">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-sm font-medium mb-1" for="hours_mon">Monday Hours</label>
              <Input
                id="hours_mon"
                v-model.number="form.hours_mon"
                type="number"
                min="0"
                max="24"
                step="0.25"
                placeholder="Monday Hours"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1" for="hours_tue">Tuesday Hours</label>
              <Input
                id="hours_tue"
                v-model.number="form.hours_tue"
                type="number"
                min="0"
                max="24"
                step="0.25"
                placeholder="Tuesday Hours"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1" for="hours_wed">Wednesday Hours</label>
              <Input
                id="hours_wed"
                v-model.number="form.hours_wed"
                type="number"
                min="0"
                max="24"
                step="0.25"
                placeholder="Wednesday Hours"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1" for="hours_thu">Thursday Hours</label>
              <Input
                id="hours_thu"
                v-model.number="form.hours_thu"
                type="number"
                min="0"
                max="24"
                step="0.25"
                placeholder="Thursday Hours"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1" for="hours_fri">Friday Hours</label>
              <Input
                id="hours_fri"
                v-model.number="form.hours_fri"
                type="number"
                min="0"
                max="24"
                step="0.25"
                placeholder="Friday Hours"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1" for="hours_sat">Saturday Hours</label>
              <Input
                id="hours_sat"
                v-model.number="form.hours_sat"
                type="number"
                min="0"
                max="24"
                step="0.25"
                placeholder="Saturday Hours"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1" for="hours_sun">Sunday Hours</label>
              <Input
                id="hours_sun"
                v-model.number="form.hours_sun"
                type="number"
                min="0"
                max="24"
                step="0.25"
                placeholder="Sunday Hours"
              />
            </div>
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
            <label class="block text-sm font-medium mb-1" for="groups"
              >Groups (IDs, comma separated)</label
            >
            <Input id="groups" v-model="form.groups" placeholder="Group IDs (comma separated)" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1" for="user_permissions"
              >Permissions (IDs, comma separated)</label
            >
            <Input
              id="user_permissions"
              v-model="form.user_permissions"
              placeholder="Permission IDs (comma separated)"
            />
          </div>
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
import { computed, ref, watch } from 'vue'
import { z } from 'zod'
import type { Staff } from '@/types/staff'
import { useStaffApi } from '@/composables/useStaffApi'
import { UserIcon, LockIcon, ClockIcon } from 'lucide-vue-next'

const tabs = [
  { key: 'personal', label: 'Personal Info', icon: UserIcon },
  { key: 'working', label: 'Working Hours', icon: ClockIcon },
  { key: 'permissions', label: 'Permissions', icon: LockIcon },
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

const avatarUrl = computed(() => {
  if (form.value.icon) {
    return URL.createObjectURL(form.value.icon)
  }
  if (props.staff && props.staff.icon_url) {
    return props.staff.icon_url
  }
  return null
})

const initials = computed(() => {
  const first = form.value.first_name?.trim()[0] || ''
  const last = form.value.last_name?.trim()[0] || ''
  return (first + last).toUpperCase() || 'U'
})

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
.avatar-upload {
  position: relative;
  width: 6rem;
  height: 6rem;
  border-radius: 9999px;
  background: #e0e7ff;
  border: 2px solid #a5b4fc;
  color: #3730a3;
  font-size: 2rem;
  font-weight: 700;
  overflow: hidden;
  transition:
    box-shadow 0.2s,
    border 0.2s;
  cursor: pointer;
}
.avatar-upload img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-upload:focus {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}
</style>
