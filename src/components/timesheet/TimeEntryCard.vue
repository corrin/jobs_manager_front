<template>
  <div class="time-entry-card bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2.5 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
    <div class="flex items-start justify-between">
      <!-- Informações principais -->
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-1.5">
          <!-- Indicador de projeto -->
          <div
            class="w-2 h-2 rounded-full flex-shrink-0"
            :class="jobColor"
          ></div>

          <!-- Job info -->
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                {{ entry.jobNumber }}
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ entry.jobName }}
              </span>
            </div>
          </div>

          <!-- Badge de faturável -->
          <Badge
            :variant="entry.billable ? 'default' : 'destructive'"
            class="text-xs"
          >
            {{ entry.billable ? 'Billable' : 'Non-billable' }}
          </Badge>
        </div>

        <!-- Time, Rate and Amount in a compact row -->
        <div class="flex items-center gap-3 mb-1.5 text-sm">
          <div class="flex items-center gap-1 text-gray-600 dark:text-gray-300">
            <Clock class="h-3 w-3" />
            <span v-if="entry.startTime && entry.endTime">
              {{ formatTime(entry.startTime) }} - {{ formatTime(entry.endTime) }}
            </span>
            <span v-else>
              {{ formatHours(entry.hours || 0) }}h
            </span>
          </div>

          <div v-if="entry.rateType" class="flex items-center gap-1">
            <span class="text-gray-500 dark:text-gray-400">@</span>
            <span class="font-medium text-gray-900 dark:text-white">
              {{ entry.rateType }}
            </span>
          </div>

          <div v-if="entry.billAmount" class="flex items-center gap-1">
            <span class="font-semibold text-green-600 dark:text-green-400">
              ${{ (entry.billAmount || 0).toFixed(2) }}
            </span>
          </div>
        </div>

        <!-- Descrição -->
        <div v-if="entry.description" class="text-sm text-gray-700 dark:text-gray-300">
          {{ entry.description }}
        </div>
      </div>

      <!-- Ações -->
      <div class="flex items-center gap-1 ml-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" class="h-8 w-8 p-0">
              <MoreVertical class="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="handleEdit">
              <Edit class="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem @click="handleDuplicate">
              <Copy class="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="handleDelete" class="text-red-600">
              <Trash class="h-4 w-4 mr-2" />
              Delete
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
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Clock, MoreVertical, Edit, Copy, Trash } from 'lucide-vue-next'
import type { TimeEntry, Job } from '@/types/timesheet'

interface Props {
  entry: TimeEntry
  availableJobs: Job[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [entry: TimeEntry]
  delete: [entryId: string]
  duplicate: [entry: TimeEntry]
}>()

const currentJob = computed(() => {
  return props.availableJobs.find(job => job.id === props.entry.jobId)
})

const jobColor = computed(() => {
  if (!currentJob.value) return 'bg-gray-400'

  // Gerar cor baseada no ID do job para consistência
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ]
  const index = parseInt(currentJob.value.id) % colors.length
  return colors[index]
})

// Project progress removed as it's not used in the template

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':')
  return `${hours}:${minutes}`
}

const formatHours = (hours: number) => {
  if (hours % 1 === 0) {
    return hours.toString()
  }
  return hours.toFixed(1)
}

const handleEdit = () => {
  emit('update', props.entry)
}

const handleDelete = () => {
  if (confirm('Are you sure you want to delete this time entry?')) {
    emit('delete', props.entry.id)
  }
}

const handleDuplicate = () => {
  emit('duplicate', props.entry)
}
</script>

<style scoped>
.time-entry-card {
  transition: all 0.2s ease;
}

.time-entry-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
