<template>
  <div class="staff-panel">
    <div class="flex flex-wrap gap-2 min-h-[60px] max-h-[120px] overflow-y-auto justify-center">
      <DraggableStaffCard
        v-for="staff in staffList"
        :key="staff.id"
        :staff="staff"
        :is-dragging="isStaffDragging"
        @drag-start="handleStaffDragStart"
        @drag-end="handleStaffDragEnd"
      />

      <!-- Empty state -->
      <div v-if="staffList.length === 0" class="text-center py-4 text-xs text-gray-500 w-full">
        No staff members available
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import DraggableStaffCard from './DraggableStaffCard.vue'
import type { Staff } from '@/types/timesheet'

interface Props {
  staffList: Staff[]
  isStaffDragging?: boolean
}

interface Emits {
  (e: 'staff-drag-start', staff: Staff): void
  (e: 'staff-drag-end'): void
}

const props = withDefaults(defineProps<Props>(), {
  isStaffDragging: false
})

const emit = defineEmits<Emits>()

const handleStaffDragStart = (staff: Staff) => {
  emit('staff-drag-start', staff)
}

const handleStaffDragEnd = () => {
  emit('staff-drag-end')
}
</script>

<style scoped>
.staff-panel {
  min-height: 60px;
  max-height: 120px;
  overflow: visible;
}
</style>
