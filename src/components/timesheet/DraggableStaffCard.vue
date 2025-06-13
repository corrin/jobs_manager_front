<template>
  <div
    ref="staffCardRef"
    class="draggable-staff-card bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 cursor-move transition-all duration-200 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 min-w-[80px] max-w-[100px]"
    :class="{
      'border-blue-500 bg-blue-50 dark:bg-blue-900/20': isDragging,
      'opacity-50': isDragging
    }"
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
  >
    <div class="flex flex-col items-center gap-1">
      <!-- Avatar -->
      <Avatar class="h-8 w-8 flex-shrink-0">
        <AvatarImage :src="staff.avatarUrl || ''" />
        <AvatarFallback class="text-xs">
          {{ (staff.firstName?.[0] || '') + (staff.lastName?.[0] || '') }}
        </AvatarFallback>
      </Avatar>

      <!-- Name -->
      <div class="text-center">
        <div class="text-xs font-medium text-gray-900 dark:text-white truncate">
          {{ staff.firstName }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Staff } from '@/types/timesheet'

interface Props {
  staff: Staff
  isDragging?: boolean
}

interface Emits {
  (e: 'drag-start', staff: Staff): void
  (e: 'drag-end'): void
}

const props = withDefaults(defineProps<Props>(), {
  isDragging: false
})
const emit = defineEmits<Emits>()

const staffCardRef = ref<HTMLElement>()
const isDragging = ref(false)

const handleDragStart = (event: DragEvent) => {
  console.log('DraggableStaffCard - handleDragStart called for staff:', props.staff.name)

  event.stopPropagation()
  isDragging.value = true

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', JSON.stringify({
      type: 'staff',
      staff: props.staff
    }))

    if (staffCardRef.value) {
      event.dataTransfer.setDragImage(staffCardRef.value, 10, 10)
    }
  }

  emit('drag-start', props.staff)
}

const handleDragEnd = (event: DragEvent) => {
  console.log('DraggableStaffCard - handleDragEnd called for staff:', props.staff.name)

  event.stopPropagation()
  isDragging.value = false
  emit('drag-end')
}
</script>

<style scoped>
.draggable-staff-card {
  transition: all 0.2s ease-in-out;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  position: relative;
  z-index: 1;
}

.draggable-staff-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 2;
}

.draggable-staff-card.border-blue-500 {
  transform: rotate(-1deg) scale(1.02);
  z-index: 10;
}

.draggable-staff-card[draggable="true"] {
  cursor: grab;
}

.draggable-staff-card[draggable="true"]:active {
  cursor: grabbing;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
