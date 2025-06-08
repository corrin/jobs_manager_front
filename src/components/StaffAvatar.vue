<template>
  <div 
    :class="[
      'staff-avatar',
      size === 'sm' ? 'staff-avatar-sm' : '',
      isActive ? 'staff-filter-active' : '',
      isDragging ? 'staff-drag' : ''
    ]"
    :title="staff.display_name"
    :data-staff-id="staff.id"
    @click="$emit('click')"
  >
    <img
      v-if="staff.avatar_url"
      :src="staff.avatar_url"
      :alt="staff.display_name"
      class="staff-img"
    />    <div v-else class="staff-initials" :style="{ backgroundColor: backgroundColor }">
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

<style scoped>
.staff-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  transition: transform 0.2s;
  position: relative;
}

.staff-avatar:hover {
  transform: scale(1.1);
}

.staff-avatar-sm {
  width: 30px;
  height: 30px;
  font-size: 0.7em;
}

.staff-initials {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white !important;
  font-weight: bold;
  font-size: 14px;
}

.staff-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.staff-filter-active {
  border: 2px solid #4285f4;
  transform: scale(1.1);
  box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.2);
}

.staff-drag {
  opacity: 0.8;
  transform: rotate(2deg);
}

/* Placeholder styling for empty staff slots */
.staff-placeholder {
  border: 2px dashed #ccc;
  background-color: rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.staff-placeholder:hover {
  border-color: #4285f4;
  background-color: rgba(66, 133, 244, 0.05);
  transform: scale(1.05);
}

.staff-placeholder::before {
  content: "+";
  color: #999;
  font-size: 20px;
  font-weight: bold;
}
</style>
