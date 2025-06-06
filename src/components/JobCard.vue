<template>
  <Card
    class="job-card cursor-pointer hover:shadow-md transition-shadow duration-200 border-l-4"
    :class="statusConfig.borderClass"
    @click="handleClick"
  >
    <CardHeader class="pb-2">
      <div class="flex justify-between items-start">
        <div class="text-sm font-medium truncate">
          {{ job.name }}
        </div>
        <Badge
          :variant="statusConfig.variant"
          class="text-xs"
        >
          {{ formatStatus(job.status) }}
        </Badge>
      </div>
    </CardHeader>

    <CardContent class="pt-0 space-y-2">
      <div class="flex items-center justify-between text-xs text-muted-foreground">
        <div class="flex items-center gap-1">
          <Hash class="h-3 w-3" />
          <span>{{ job.job_number }}</span>
        </div>
        <Badge v-if="job.paid" variant="outline" class="text-xs bg-green-50 text-green-700">
          <DollarSign class="h-3 w-3 mr-1" />
          PAID
        </Badge>
      </div>

      <p class="text-sm text-muted-foreground line-clamp-2">
        {{ job.description }}
      </p>

      <div class="flex justify-between items-center text-xs text-muted-foreground">
        <span class="truncate">{{ job.client }}</span>
        <div class="flex items-center gap-1">
          <Calendar class="h-3 w-3" />
          <span>{{ formattedDate }}</span>
        </div>
      </div>

      <div class="flex items-center gap-1 text-xs text-muted-foreground">
        <User class="h-3 w-3" />
        <span class="truncate">{{ job.created_by }}</span>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Calendar, User, Hash, DollarSign } from 'lucide-vue-next'
import { useJobCard } from '@/composables/useJobCard'
import type { Job } from '@/types/kanban.types'

interface JobCardProps {
  job: Job
}

interface JobCardEmits {
  (e: 'click', job: Job): void
}

const props = defineProps<JobCardProps>()
const emit = defineEmits<JobCardEmits>()

const { statusConfig, formattedDate, formatStatus, handleClick } = useJobCard(props.job, emit)
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-clamp: 2;
}

.job-card:hover {
  transform: translateY(-1px);
}
</style>
