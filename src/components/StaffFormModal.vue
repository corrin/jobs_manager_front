<template>
  <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
    <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
      <h3 class="text-lg font-bold mb-4">
        {{ staff ? 'Edit Staff' : 'New Staff' }}
      </h3>
      <form @submit.prevent="submitForm" class="flex flex-col gap-4">
        <div class="flex gap-2">
          <input
            v-model="form.first_name"
            type="text"
            placeholder="First Name"
            class="border rounded px-2 py-1 w-1/2"
            required
          />
          <input
            v-model="form.last_name"
            type="text"
            placeholder="Last Name"
            class="border rounded px-2 py-1 w-1/2"
            required
          />
        </div>
        <input
          v-model="form.email"
          type="email"
          placeholder="Email"
          class="border rounded px-2 py-1"
          required
        />
        <input
          v-model.number="form.wage_rate"
          type="number"
          placeholder="Wage Rate"
          class="border rounded px-2 py-1"
          min="0"
          step="0.01"
          required
        />
        <div>
          <label class="block mb-1">Profile Image</label>
          <input type="file" @change="onFileChange" accept="image/*" />
        </div>
        <div class="flex gap-2 justify-end mt-4">
          <button type="button" @click="$emit('close')" class="px-3 py-1 rounded bg-gray-300">
            Cancel
          </button>
          <button type="submit" class="px-3 py-1 rounded bg-blue-600 text-white">
            {{ staff ? 'Save Changes' : 'Create Staff' }}
          </button>
        </div>
        <div v-if="error" class="text-red-600 text-sm">{{ error }}</div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { z } from 'zod'
import type { Staff } from '@/types/staff'
import { useStaffApi } from '@/composables/useStaffApi'

const props = defineProps<{ staff: Staff | null }>()
const emit = defineEmits(['close', 'saved'])

const { createStaff, updateStaff } = useStaffApi()

const form = ref({
  first_name: '',
  last_name: '',
  email: '',
  wage_rate: 0,
  image: null as File | null,
})
const error = ref('')

const staffSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  wage_rate: z.number().min(0, 'Wage rate must be positive'),
})

watch(
  () => props.staff,
  (staff) => {
    if (staff) {
      form.value = {
        first_name: staff.first_name,
        last_name: staff.last_name,
        email: staff.email,
        wage_rate: staff.wage_rate,
        image: null,
      }
    } else {
      form.value = {
        first_name: '',
        last_name: '',
        email: '',
        wage_rate: 0,
        image: null,
      }
    }
    error.value = ''
  },
  { immediate: true },
)

function onFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (files && files.length > 0) {
    form.value.image = files[0]
  } else {
    form.value.image = null
  }
}

async function submitForm() {
  error.value = ''
  const parsed = staffSchema.safeParse({
    ...form.value,
    wage_rate: Number(form.value.wage_rate),
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
/* No custom styles needed */
</style>
