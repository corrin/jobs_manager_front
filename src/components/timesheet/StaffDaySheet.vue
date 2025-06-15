<template>
  <div class="staff-day-sheet h-full flex flex-col">
    <!-- Day header -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <Avatar class="h-12 w-12">
            <AvatarImage :src="staff?.avatarUrl || ''" />
            <AvatarFallback>
              {{ staff?.firstName?.[0] }}{{ staff?.lastName?.[0] }}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ staff?.name }}
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ formatDate(date) }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <!-- Day summary -->
          <div class="text-right">
            <div class="text-sm text-gray-500 dark:text-gray-400">Daily Total</div>
            <div class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ formatHours(totalHours) }}h
            </div>
            <div class="text-xs text-gray-500">
              {{ billablePercentage }}% billable
            </div>
          </div>

          <!-- Add entry button -->
          <Button @click="showAddEntry = true" class="bg-blue-600 hover:bg-blue-700">
            <Plus class="h-4 w-4 mr-2" />
            New Entry
          </Button>
        </div>
      </div>
    </div>

    <!-- Day entries list -->
    <div class="flex-1 min-h-0">
      <div class="h-full overflow-y-auto space-y-3">
        <!-- Existing entries -->
        <TransitionGroup name="list" tag="div" class="space-y-3">
          <TimeEntryCard
            v-for="entry in sortedEntries"
            :key="entry.id"
            :entry="entry"
            :available-jobs="availableJobs"
            @update="handleUpdateEntry"
            @delete="handleDeleteEntry"
            @duplicate="handleDuplicateEntry"
          />
        </TransitionGroup>

        <!-- Empty state -->
        <div
          v-if="timeEntries.length === 0"
          class="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400"
        >
          <Clock class="h-12 w-12 mb-4 opacity-50" />
          <h3 class="text-lg font-medium mb-2">No entries today</h3>
          <p class="text-sm text-center mb-6">
            Add your first time entry to get started.
          </p>
          <Button @click="showAddEntry = true" variant="outline">
            <Plus class="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        </div>
      </div>
    </div>

    <!-- Add/edit entry modal -->
    <TimeEntryModal
      v-model:open="showAddEntry"
      :entry="editingEntry"
      :staff="staff"
      :date="date"
      :available-jobs="availableJobs"
      @save="handleSaveEntry"
      @cancel="handleCancelEdit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Plus, Clock } from 'lucide-vue-next'
import TimeEntryCard from './TimeEntryCard.vue'
import TimeEntryModal from './TimeEntryModal.vue'
import type { Staff, TimeEntry, Job } from '@/types/timesheet'

interface Props {
  staff?: Staff | null
  date: Date
  timeEntries?: TimeEntry[]
  availableJobs?: Job[]
}

const props = withDefaults(defineProps<Props>(), {
  staff: null,
  timeEntries: () => [],
  availableJobs: () => []
})

const emit = defineEmits<{
  entryUpdated: [entry: TimeEntry]
  entryCreated: [entry: Omit<TimeEntry, 'id'>]
  entryDeleted: [entryId: string]
}>()

const showAddEntry = ref(false)
const editingEntry = ref<TimeEntry | null>(null)

const sortedEntries = computed(() => {
  return [...props.timeEntries].sort((a, b) => {
    if (a.startTime && b.startTime) {
      return a.startTime.localeCompare(b.startTime)
    }
    return a.createdAt.localeCompare(b.createdAt)
  })
})

const totalHours = computed(() => {
  return props.timeEntries.reduce((total, entry) => total + entry.hours, 0)
})

const billableHours = computed(() => {
  return props.timeEntries
    .filter(entry => entry.billable)
    .reduce((total, entry) => total + entry.hours, 0)
})

const billablePercentage = computed(() => {
  if (totalHours.value === 0) return 0
  return Math.round((billableHours.value / totalHours.value) * 100)
})

const formatDate = (date: Date) => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return 'Invalid Date'
  }
  
  return date.toLocaleDateString('en-NZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatHours = (hours: number) => {
  return hours.toFixed(1)
}

const handleUpdateEntry = (entry: TimeEntry) => {
  emit('entryUpdated', entry)
}

const handleDeleteEntry = (entryId: string) => {
  emit('entryDeleted', entryId)
}

const handleDuplicateEntry = (entry: TimeEntry) => {
  const duplicatedEntry = {
    ...entry,
    id: undefined,
    startTime: undefined,
    endTime: undefined,
    hours: 0,
    description: `${entry.description} (copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  delete duplicatedEntry.id
  emit('entryCreated', duplicatedEntry)
}

const handleSaveEntry = (entry: TimeEntry | Omit<TimeEntry, 'id'>) => {
  if ('id' in entry) {
    emit('entryUpdated', entry)
  } else {
    emit('entryCreated', entry)
  }
  showAddEntry.value = false
  editingEntry.value = null
}

const handleCancelEdit = () => {
  showAddEntry.value = false
  editingEntry.value = null
}
</script>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.list-leave-active {
  position: absolute;
  right: 0;
  left: 0;
}
</style>
