<template>  <div 
    :class="[
      'rounded-full overflow-hidden flex items-center justify-center cursor-pointer shadow-sm transition-all duration-200 relative',
      'hover:scale-110 hover:shadow-md',
      size === 'sm' ? 'w-5 h-5 text-xs' : 'w-10 h-10',
      isActive ? 'border-2 border-blue-500 scale-110 shadow-blue-200 shadow-md ring-2 ring-blue-300 ring-offset-1' : '',
      isDragging ? 'opacity-80 rotate-1 scale-105 shadow-lg' : '',
      'staff-avatar-draggable'
    ]"
    :title="staff.display_name"
    :data-staff-id="staff.id"
  >
    <img
      v-if="staff.avatar_url && staff.avatar_url !== null"
      :src="staff.avatar_url"
      :alt="staff.display_name"
      class="w-full h-full object-cover"
    />    <div 
      v-else 
      class="w-full h-full flex items-center justify-center text-white font-bold"
      :class="size === 'sm' ? 'text-xs' : 'text-sm'"
      :style="{ backgroundColor: backgroundColor }"
    >
      {{ getInitials(staff) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Staff } from '@/types'
import type { StaffAvatarSize } from '@/types/staff'

interface Props {
  staff: Staff
  size?: StaffAvatarSize
  isActive?: boolean
  isDragging?: boolean
}

interface Emits {
  (e: 'click'): void
}

const props = withDefaults(defineProps<Props>(), {
  size: 'normal',
  isActive: false,
  isDragging: false
})

defineEmits<Emits>()

const getInitials = (staff: Staff): string => {
  if (staff.initials) {
    return staff.initials
  }
  
  const firstInitial = staff.first_name?.charAt(0)?.toUpperCase() || ''
  const lastInitial = staff.last_name?.charAt(0)?.toUpperCase() || ''
  
  if (firstInitial || lastInitial) {
    return firstInitial + lastInitial
  }
  
  // Fallback to display_name when first_name/last_name aren't available
  if (staff.display_name) {
    const words = staff.display_name.trim().split(/\s+/)
    if (words.length >= 2) {
      // Two or more words: first letter of the first and last words
      return words[0].charAt(0).toUpperCase() + words[words.length - 1].charAt(0).toUpperCase()
    } else if (words.length === 1 && words[0].length >= 2) {
      // One word with at least 2 characters: first two letters
      return words[0].substring(0, 2).toUpperCase()
    } else if (words[0].length === 1) {
      // One word with 1 character: repeat that character
      return words[0].charAt(0).toUpperCase() + words[0].charAt(0).toUpperCase()
    }
  }
  
  return '??'
}

// Generate consistent color based on staff ID
const backgroundColor = computed(() => {
  const predefinedColors = [
    "#3498db", // blue
    "#2ecc71", // green
    "#e74c3c", // red
    "#9b59b6", // purple
    "#f39c12", // orange
    "#1abc9c", // teal
    "#d35400", // dark orange
    "#c0392b", // dark red
    "#8e44ad", // dark purple
    "#16a085", // dark teal
    "#27ae60", // dark green
    "#2980b9", // dark blue
    "#f1c40f", // yellow
    "#e67e22", // orange
    "#34495e"  // navy blue
  ]
  
  const colorIndex = Math.abs(props.staff.display_name.split('').reduce((acc, char) =>
    acc + char.charCodeAt(0), 0)) % predefinedColors.length
    return predefinedColors[colorIndex]
})
</script>

<style scoped>
/* Visual improvements for drag and drop on all devices */
.staff-avatar-draggable {
  user-select: none;
  -webkit-user-select: none;
}

/* Specific drag states for better visual feedback */
:global(.staff-sortable-chosen) .staff-avatar-draggable {
  border: 2px solid #3b82f6 !important;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
  transform: scale(1.1) !important;
}

:global(.staff-sortable-drag) .staff-avatar-draggable {
  border: 3px solid #2563eb !important;
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.4) !important;
  transform: scale(1.15) rotate(3deg) !important;
  z-index: 1002 !important;
  position: relative !important;
}

/* Tablet specific: better visual feedback */
@media (min-width: 768px) and (max-width: 1023px) {
  :global(.staff-sortable-chosen) .staff-avatar-draggable {
    transform: scale(1.15) !important;
    box-shadow: 0 6px 15px rgba(59, 130, 246, 0.35) !important;
  }
  
  :global(.staff-sortable-drag) .staff-avatar-draggable {
    transform: scale(1.2) rotate(2deg) !important;
    box-shadow: 0 10px 25px rgba(37, 99, 235, 0.45) !important;
    border-width: 3px !important;
  }
}

/* Mobile: more subtle feedback */
@media (max-width: 767px) {
  :global(.staff-sortable-chosen) .staff-avatar-draggable {
    transform: scale(1.08) !important;
  }
  
  :global(.staff-sortable-drag) .staff-avatar-draggable {
    transform: scale(1.12) rotate(1deg) !important;
  }
}
</style>


