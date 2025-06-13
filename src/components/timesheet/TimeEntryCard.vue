<template>
  <div class="time-entry-card bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
    <div class="flex items-start justify-between">
      <!-- Informações principais -->
      <div class="flex-1">
        <div class="flex items-center gap-3 mb-2">
          <!-- Indicador de projeto -->
          <div
            class="w-3 h-3 rounded-full flex-shrink-0"
            :class="jobColor"
          ></div>

          <!-- Job info -->
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="font-medium text-gray-900 dark:text-white">
                {{ entry.jobNumber }}
              </span>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ entry.jobName }}
              </span>
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {{ entry.clientName }}
            </div>
          </div>

          <!-- Badge de tipo de trabalho -->
          <Badge
            :variant="entry.isShopJob ? 'secondary' : 'outline'"
            class="text-xs"
          >
            {{ entry.isShopJob ? 'Oficina' : 'Campo' }}
          </Badge>

          <!-- Badge de faturável -->
          <Badge
            :variant="entry.billable ? 'default' : 'destructive'"
            class="text-xs"
          >
            {{ entry.billable ? 'Faturável' : 'Não Faturável' }}
          </Badge>
        </div>

        <!-- Horários e duração -->
        <div class="flex items-center gap-4 mb-2">
          <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Clock class="h-4 w-4" />
            <span v-if="entry.startTime && entry.endTime">
              {{ formatTime(entry.startTime) }} - {{ formatTime(entry.endTime) }}
            </span>
            <span v-else>
              {{ formatHours(entry.hours) }}h
            </span>
          </div>

          <div class="flex items-center gap-2 text-sm">
            <span class="text-gray-500 dark:text-gray-400">Taxa:</span>
            <span class="font-medium text-gray-900 dark:text-white">
              {{ entry.rateType }}
            </span>
          </div>

          <div class="flex items-center gap-2 text-sm">
            <span class="text-gray-500 dark:text-gray-400">Valor:</span>
            <span class="font-medium text-green-600 dark:text-green-400">
              ${{ entry.billAmount.toFixed(2) }}
            </span>
          </div>
        </div>

        <!-- Descrição -->
        <div v-if="entry.description" class="text-sm text-gray-700 dark:text-gray-300 mb-2">
          {{ entry.description }}
        </div>

        <!-- Notas -->
        <div v-if="entry.notes" class="text-xs text-gray-500 dark:text-gray-400 italic">
          {{ entry.notes }}
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
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem @click="handleDuplicate">
              <Copy class="h-4 w-4 mr-2" />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="handleDelete" class="text-red-600">
              <Trash class="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <!-- Indicador de progresso de horas (se aplicável) -->
    <div v-if="showProgress" class="mt-3">
      <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
        <span>Progresso do Projeto</span>
        <span>{{ projectProgress }}%</span>
      </div>
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
        <div
          class="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
          :style="{ width: `${Math.min(projectProgress, 100)}%` }"
        ></div>
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
  showProgress?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showProgress: true
})

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

const projectProgress = computed(() => {
  if (!currentJob.value || !currentJob.value.estimatedHours) return 0
  return Math.round((currentJob.value.hoursSpent / currentJob.value.estimatedHours) * 100)
})

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
  if (confirm('Tem certeza que deseja excluir esta entrada?')) {
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
