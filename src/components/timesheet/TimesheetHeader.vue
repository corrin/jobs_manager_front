<template>
  <div class="timesheet-header bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <!-- Título e navegação principal -->
      <div class="flex items-center gap-4">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Timesheet
        </h1>

        <!-- Staff navigation (staff-day mode) -->
        <div v-if="viewMode === 'staff-day'" class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            @click="$emit('previousStaff')"
            :disabled="!hasPreviousStaff"
          >
            <ChevronLeft class="h-4 w-4" />
          </Button>

          <Select :model-value="currentStaff?.id" @update:model-value="handleStaffChangeById">
            <SelectTrigger class="w-48">
              <SelectValue>
                <div v-if="currentStaff" class="flex items-center gap-2">
                  <Avatar class="h-6 w-6">
                    <AvatarImage :src="currentStaff.avatarUrl || ''" />
                    <AvatarFallback>
                      {{ (currentStaff.firstName?.[0] || '') + (currentStaff.lastName?.[0] || '') }}
                    </AvatarFallback>
                  </Avatar>
                  {{ currentStaff.name }}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="staff in staffList" :key="staff.id" :value="staff.id">
                <div class="flex items-center gap-2">
                  <Avatar class="h-6 w-6">
                    <AvatarImage :src="staff.avatarUrl || ''" />
                    <AvatarFallback>
                      {{ (staff.firstName?.[0] || '') + (staff.lastName?.[0] || '') }}
                    </AvatarFallback>
                  </Avatar>
                  {{ staff.name }}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            @click="$emit('nextStaff')"
            :disabled="!hasNextStaff"
          >
            <ChevronRight class="h-4 w-4" />
          </Button>
        </div>
      </div>

      <!-- Controles centrais -->
      <div class="flex flex-col sm:flex-row items-center gap-4">
        <!-- View mode selector -->
        <div class="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <Button
            v-for="mode in viewModes"
            :key="mode.value"
            :variant="viewMode === mode.value ? 'default' : 'ghost'"
            :size="'sm'"
            @click="handleViewModeChange(mode.value)"
            class="relative"
          >
            <component :is="mode.icon" class="h-4 w-4 mr-2" />
            {{ mode.label }}
          </Button>
        </div>

        <!-- Date navigation -->
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            @click="navigateDate(-1)"
          >
            <ChevronLeft class="h-4 w-4" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                class="min-w-[200px] justify-center"
              >
                <CalendarIcon class="mr-2 h-4 w-4" />
                {{ formatDateRange }}
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0" align="center">
              <Calendar
                :model-value="calendarDate"
                @update:model-value="handleDateChange"
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="sm"
            @click="navigateDate(1)"
          >
            <ChevronRight class="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            @click="goToToday"
          >
            Today
          </Button>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2">
        <!-- Export IMS -->
        <Button
          variant="outline"
          size="sm"
          @click="$emit('exportIms')"
          class="text-blue-600 hover:text-blue-700"
        >
          <Download class="h-4 w-4 mr-2" />
          Export IMS
        </Button>

        <!-- Settings -->
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings class="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="handleSettings">
              <Settings class="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem @click="handleHelp">
              <HelpCircle class="h-4 w-4 mr-2" />
              Help
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Download,
  Settings,
  HelpCircle,
  User,
  LayoutGrid,
  Calendar as CalendarView
} from 'lucide-vue-next'
import { toDateValue, fromDateValue } from '@/utils/dateUtils'
import type { Staff } from '@/types/timesheet'

type ViewMode = 'staff-day' | 'weekly-kanban' | 'calendar-grid'

interface Props {
  currentDate: Date
  currentStaff?: Staff | null
  viewMode: ViewMode
  staffList?: Staff[]
}

const props = withDefaults(defineProps<Props>(), {
  currentStaff: null,
  staffList: () => []
})

const emit = defineEmits<{
  'update:currentDate': [date: Date]
  'update:currentStaff': [staff: Staff | null]
  'update:viewMode': [mode: ViewMode]
  exportIms: []
  previousStaff: []
  nextStaff: []
}>()

const viewModes = [
  { value: 'staff-day' as const, label: 'Staff', icon: User },
  { value: 'weekly-kanban' as const, label: 'Kanban', icon: LayoutGrid },
  { value: 'calendar-grid' as const, label: 'Calendar', icon: CalendarView }
]

const formatDateRange = computed(() => {
  const date = props.currentDate

  if (props.viewMode === 'staff-day') {
    return date.toLocaleDateString('en-NZ', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } else {
    // For weekly views, show week range
    const weekStart = new Date(date)
    const day = weekStart.getDay()
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
    weekStart.setDate(diff)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const startStr = weekStart.toLocaleDateString('en-NZ', { month: 'short', day: 'numeric' })
    const endStr = weekEnd.toLocaleDateString('en-NZ', { month: 'short', day: 'numeric' })

    return `${startStr} - ${endStr}, ${weekStart.getFullYear()}`
  }
})

const hasPreviousStaff = computed(() => {
  if (!props.currentStaff) return false
  const currentIndex = props.staffList.findIndex(s => s.id === props.currentStaff?.id)
  return currentIndex > 0
})

const hasNextStaff = computed(() => {
  if (!props.currentStaff) return false
  const currentIndex = props.staffList.findIndex(s => s.id === props.currentStaff?.id)
  return currentIndex < props.staffList.length - 1
})

const handleStaffChange = (staff: Staff | null) => {
  // Guard clause - early return for null values
  if (!staff) {
    return
  }
  
  emit('update:currentStaff', staff)
}

// Handle staff change by ID (for Select component)
const handleStaffChangeById = (staffId: string) => {
  // Guard clause - early return if no staffId
  if (!staffId) {
    return
  }
  
  const staff = props.staffList.find(s => s.id === staffId)
  if (staff) {
    handleStaffChange(staff)
  }
}

const handleViewModeChange = (mode: ViewMode) => {
  emit('update:viewMode', mode)
}

// Date conversion utilities following SRP
const calendarDate = computed(() => {
  return toDateValue(props.currentDate)
})

const handleDateChange = (dateValue: any) => {
  // Guard clause - early return for invalid input
  if (!dateValue) {
    return
  }

  // Convert DateValue back to JavaScript Date
  const jsDate = fromDateValue(dateValue)
  
  // Guard clause - early return if conversion failed
  if (!jsDate) {
    console.warn('Failed to convert calendar date value to JavaScript Date')
    return
  }

  emit('update:currentDate', jsDate)
}

const navigateDate = (direction: number) => {
  const newDate = new Date(props.currentDate)

  if (props.viewMode === 'staff-day') {
    newDate.setDate(newDate.getDate() + direction)
  } else {
    // For weekly views, navigate by week
    newDate.setDate(newDate.getDate() + (direction * 7))
  }

  emit('update:currentDate', newDate)
}

const goToToday = () => {
  emit('update:currentDate', new Date())
}

const handleSettings = () => {
  // TODO: Implement settings
  console.log('Open settings')
}

const handleHelp = () => {
  // TODO: Implement help
  console.log('Open help')
}
</script>

<style scoped>
.timesheet-header {
  position: sticky;
  top: 0;
  z-index: 20;
}
</style>
