<template>
  <Card
    class="job-card cursor-pointer hover:shadow-md transition-shadow duration-200 border-l-4"
    :class="statusBorderClass"
    @click="$emit('click')"
  >
    <CardHeader class="pb-2">
      <div class="flex justify-between items-start">
        <CardTitle class="text-sm font-medium truncate">
          {{ job.name }}
        </CardTitle>
        <Badge
          :variant="statusVariant"
          class="text-xs"
        >
          {{ job.status.replace('_', ' ').toUpperCase() }}
        </Badge>
      </div>
    </CardHeader>

    <CardContent class="pt-0 space-y-2">
      <div class="text-xs text-muted-foreground">
        <div class="flex justify-between">
          <span>Job #{{ job.job_number }}</span>
          <Badge v-if="job.paid" variant="outline" class="text-xs bg-green-50 text-green-700">
            PAID
          </Badge>
        </div>
      </div>

      <p class="text-sm text-muted-foreground line-clamp-2">
        {{ job.description }}
      </p>

      <div class="flex justify-between items-center text-xs text-muted-foreground">
        <span class="truncate">{{ job.client }}</span>
        <span>{{ formatDate(job.created_date) }}</span>
      </div>

      <div class="text-xs text-muted-foreground">
        Created by: {{ job.created_by }}
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Job {
  id: number
  name: string
  description: string
  status: string
  client: string
  created_by: string
  created_date: string
  paid: boolean
  job_number: string
}

const props = defineProps<{
  job: Job
}>()

defineEmits<{
  click: []
}>()

const statusVariant = computed(() => {
  const status = props.job.status
  switch (status) {
    case 'pending':
      return 'secondary'
    case 'in_progress':
      return 'default'
    case 'review':
      return 'outline'
    case 'completed':
      return 'outline'
    case 'archived':
      return 'secondary'
    default:
      return 'secondary'
  }
})

const statusBorderClass = computed(() => {
  const status = props.job.status
  switch (status) {
    case 'pending':
      return 'border-l-yellow-500'
    case 'in_progress':
      return 'border-l-blue-500'
    case 'review':
      return 'border-l-purple-500'
    case 'completed':
      return 'border-l-green-500'
    case 'archived':
      return 'border-l-gray-400'
    default:
      return 'border-l-gray-300'
  }
})

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-NZ', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  })
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.job-card:hover {
  transform: translateY(-1px);
}
</style>
