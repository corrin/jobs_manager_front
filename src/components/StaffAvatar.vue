<template>  <div 
    :class="[
      'rounded-full overflow-hidden flex items-center justify-center cursor-pointer shadow-sm transition-transform hover:scale-110 relative',
      size === 'sm' ? 'w-5 h-5 text-xs' : 'w-10 h-10',
      isActive ? 'border-2 border-blue-500 scale-110 shadow-blue-200 shadow-md' : '',
      isDragging ? 'opacity-80 rotate-1' : ''
    ]"
    :title="staff.display_name"
    :data-staff-id="staff.id"
  >
    <img
      v-if="staff.avatar_url"
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
  
  // Fallback para display_name quando first_name/last_name não estão disponíveis
  if (staff.display_name) {
    const words = staff.display_name.trim().split(/\s+/)
    if (words.length >= 2) {
      // Duas ou mais palavras: primeira letra da primeira e última palavra
      return words[0].charAt(0).toUpperCase() + words[words.length - 1].charAt(0).toUpperCase()
    } else if (words.length === 1 && words[0].length >= 2) {
      // Uma palavra com pelo menos 2 caracteres: primeiras duas letras
      return words[0].substring(0, 2).toUpperCase()
    } else if (words[0].length === 1) {
      // Uma palavra com 1 caractere: repete o caractere
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


