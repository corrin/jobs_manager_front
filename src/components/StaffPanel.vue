<template>
  <div class="mb-2">
    <div class="flex justify-center px-2">
      <div ref="staffListRef" class="flex flex-wrap justify-center gap-2 max-w-full">
        <div
          v-for="staff in staffMembers"
          :key="staff.id"
          class="flex flex-col items-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
          :class="{
            'scale-105 ring-2 ring-blue-400 ring-offset-1 rounded-lg': activeFilters.includes(
              staff.id.toString(),
            ),
          }"
          @click="toggleStaffFilter(staff.id)"
          :data-staff-id="staff.id"
        >
          <StaffAvatar
            :staff="staff"
            :is-active="activeFilters.includes(staff.id.toString())"
            class="mb-1"
          />
          <span class="text-xs text-gray-600 text-center max-w-[60px] truncate">{{
            staff.display_name.split(' ')[0]
          }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import StaffAvatar from './StaffAvatar.vue'
import { staffService } from '@/services/staff.service'
import type { Staff } from '@/types'
import { PersonSchema } from '@/schemas/kanban.schemas'

interface Props {
  activeFilters?: string[]
}

interface Emits {
  (e: 'staff-filter-changed', staffIds: string[]): void
  (e: 'staff-panel-ready', element: HTMLElement): void
}

const props = withDefaults(defineProps<Props>(), {
  activeFilters: () => [],
})

const emit = defineEmits<Emits>()

const staffMembers = ref<Staff[]>([])
const activeFilters = ref<string[]>([...props.activeFilters])
const isLoading = ref(false)
const error = ref<string | null>(null)
const staffListRef = ref<HTMLElement>()

const loadStaffMembers = async (): Promise<void> => {
  try {
    isLoading.value = true
    error.value = null
    const data = await staffService.getAllStaff()

    const validatedStaff = data.map((staffData) => {
      return PersonSchema.parse({
        ...staffData,
        display_name:
          staffData.display_name || `${staffData.first_name} ${staffData.last_name}`.trim(),
      })
    })

    staffMembers.value = validatedStaff
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load staff members'
    console.error('Error loading staff members:', err)
  } finally {
    isLoading.value = false
  }
}

const toggleStaffFilter = (staffId: string): void => {
  const index = activeFilters.value.indexOf(staffId)

  if (index !== -1) {
    activeFilters.value.splice(index, 1)
  } else {
    activeFilters.value.push(staffId)
  }

  emit('staff-filter-changed', [...activeFilters.value])
}

watch(
  () => props.activeFilters,
  (newFilters) => {
    activeFilters.value = [...newFilters]
  },
  { deep: true },
)

onMounted(() => {
  loadStaffMembers()

  nextTick(() => {
    if (staffListRef.value) {
      emit('staff-panel-ready', staffListRef.value)
    }
  })
})
</script>
