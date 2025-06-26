<template>
  <div class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
      <h3 class="text-lg font-bold mb-4">{{ staff ? 'Editar Staff' : 'Novo Staff' }}</h3>
      <form @submit.prevent="handleSubmit">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label>Nome</label>
            <input v-model="form.first_name" required class="border rounded px-2 py-1 w-full" />
          </div>
          <div>
            <label>Sobrenome</label>
            <input v-model="form.last_name" required class="border rounded px-2 py-1 w-full" />
          </div>
          <div>
            <label>Email</label>
            <input
              v-model="form.email"
              type="email"
              required
              class="border rounded px-2 py-1 w-full"
            />
          </div>
          <div>
            <label>Wage Rate</label>
            <input
              v-model="form.wage_rate"
              type="number"
              step="0.01"
              class="border rounded px-2 py-1 w-full"
            />
          </div>
          <div>
            <label>Ícone</label>
            <input type="file" @change="onFileChange" class="border rounded px-2 py-1 w-full" />
            <div v-if="form.icon_url" class="mt-2">
              <img :src="form.icon_url" alt="Ícone" class="h-12 w-12 rounded-full" />
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-6">
          <button type="button" class="px-3 py-1 rounded border" @click="$emit('close')">
            Cancelar
          </button>
          <button type="submit" class="px-3 py-1 rounded bg-blue-600 text-white">Salvar</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, reactive } from 'vue'
import { useStaffApi } from '@/composables/useStaffApi'
import { z } from 'zod'
import type { Staff } from '@/types/staff'

const props = defineProps<{ staff?: Staff }>()
const emit = defineEmits(['close', 'saved'])
const { createStaff, updateStaff } = useStaffApi()

const form = reactive<Partial<Staff> & { icon?: File | null; icon_url?: string }>({
  first_name: '',
  last_name: '',
  email: '',
  wage_rate: '',
  icon: null,
  icon_url: '',
})

watch(
  () => props.staff,
  (val) => {
    if (val) {
      Object.assign(form, val)
      form.icon_url = val.icon || ''
      form.icon = null
    } else {
      form.first_name = ''
      form.last_name = ''
      form.email = ''
      form.wage_rate = ''
      form.icon = null
      form.icon_url = ''
    }
  },
  { immediate: true },
)

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    form.icon = file
    form.icon_url = URL.createObjectURL(file)
  }
}

const staffSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  wage_rate: z.string().or(z.number()),
})

async function handleSubmit() {
  const parsed = staffSchema.safeParse(form)
  if (!parsed.success) {
    alert('Preencha todos os campos obrigatórios corretamente.')
    return
  }
  const payload = new FormData()
  payload.append('first_name', form.first_name || '')
  payload.append('last_name', form.last_name || '')
  payload.append('email', form.email || '')
  payload.append('wage_rate', String(form.wage_rate ?? ''))
  if (form.icon) payload.append('icon', form.icon)
  let result
  if (props.staff && props.staff.id) {
    result = await updateStaff(props.staff.id, payload)
  } else {
    result = await createStaff(payload)
  }
  emit('saved', result)
}
</script>

<style scoped>
/* Removido uso de @apply e classes customizadas, tudo está no template */
</style>
