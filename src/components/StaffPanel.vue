<template>
  <div class="staff-panel">
    <h6 class="staff-panel-title">Team Members</h6>
    <div ref="staffListRef" class="staff-list">
      <StaffAvatar
        v-for="staff in staffMembers"
        :key="staff.id"
        :staff="staff"
        :is-active="activeFilters.includes(staff.id.toString())"
        @click="toggleStaffFilter(staff.id)"
        class="draggable-staff"
        :data-staff-id="staff.id"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import StaffAvatar from './StaffAvatar.vue'
import { staffService } from '@/services/staffService'

interface Staff {
  id: number
  first_name: string
  last_name: string
  display_name: string
  initials?: string
  avatar_url?: string
}

interface Props {
  activeFilters?: string[]
}

interface Emits {
  (e: 'staff-filter-changed', staffIds: string[]): void
  (e: 'staff-panel-ready', element: HTMLElement): void
}

const props = withDefaults(defineProps<Props>(), {
  activeFilters: () => []
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
    staffMembers.value = data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load staff members'
    console.error('Error loading staff members:', err)
  } finally {
    isLoading.value = false
  }
}

const toggleStaffFilter = (staffId: number): void => {
  const staffIdStr = staffId.toString()
  const index = activeFilters.value.indexOf(staffIdStr)
  
  if (index !== -1) {
    activeFilters.value.splice(index, 1)
  } else {
    activeFilters.value.push(staffIdStr)
  }
  
  emit('staff-filter-changed', [...activeFilters.value])
}

// Watch for prop changes
watch(() => props.activeFilters, (newFilters) => {
  activeFilters.value = [...newFilters]
}, { deep: true })

onMounted(() => {
  loadStaffMembers()
  
  // Emit staff panel ready after next tick to ensure DOM is rendered
  nextTick(() => {
    if (staffListRef.value) {
      emit('staff-panel-ready', staffListRef.value)
    }
  })
})
</script>

<style scoped>
.staff-panel {
  flex: 2;
  margin-bottom: 0;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: white;
}

.staff-panel-title {
  text-align: center;
  margin-bottom: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #6c757d;
}

.staff-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.draggable-staff {
  cursor: pointer;
  transition: all 0.2s ease;
}

.draggable-staff:hover {
  transform: scale(1.1);
}

@media (max-width: 768px) {
  .staff-panel {
    width: 100%;
    flex: none;
  }
}
</style>
