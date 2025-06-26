<template>
  <Dialog :open="true" @update:open="handleClose">
    <DialogContent class="max-w-md space-y-6 animate-in fade-in-0 zoom-in-95">
      <DialogHeader>
        <DialogTitle>{{ staff ? 'Edit Staff' : 'New Staff' }}</DialogTitle>
      </DialogHeader>
      <form @submit.prevent="submitForm" class="space-y-4">
        <div class="flex gap-2">
          <Input v-model="form.first_name" placeholder="First Name" required class="w-1/2" />
          <Input v-model="form.last_name" placeholder="Last Name" required class="w-1/2" />
        </div>
        <Input v-model="form.email" type="email" placeholder="E-mail" required />
        <Input
          v-model.number="form.wage_rate"
          type="number"
          placeholder="Wage Rate"
          min="0"
          step="0.01"
          required
        />
        <div class="space-y-2">
          <label class="text-sm font-medium">Profile Image</label>
          <input
            type="file"
            accept="image/*"
            @change="onFileChange"
            class="file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors"
          />
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
  form.value.image = files && files.length ? files[0] : null
}

function handleClose() {
  emit('close')
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
