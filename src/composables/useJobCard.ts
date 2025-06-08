import { computed } from 'vue'
import type { Job } from '@/types'

interface StatusConfig {
  variant: 'default' | 'secondary' | 'outline'
  borderClass: string
}

export function useJobCard(job: Job, emit: (e: 'click', job: Job) => void) {
  const statusConfig = computed((): StatusConfig => {
    const configs: Record<string, StatusConfig> = {
      pending: {
        variant: 'secondary',
        borderClass: 'border-l-yellow-400'
      },
      in_progress: {
        variant: 'default',
        borderClass: 'border-l-blue-400'
      },
      review: {
        variant: 'outline',
        borderClass: 'border-l-purple-400'
      },
      completed: {
        variant: 'default',
        borderClass: 'border-l-green-400'
      },
      archived: {
        variant: 'secondary',
        borderClass: 'border-l-gray-400'
      }
    }

    return configs[job.status || 'pending'] || configs.pending
  })

  const formattedDate = computed(() => {
    if (!job.created_at) return ''

    try {
      return new Date(job.created_at).toLocaleDateString('en-NZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return job.created_at
    }
  })

  const formatStatus = (status: string): string => {
    const statusLabels: Record<string, string> = {
      pending: 'Pending',
      in_progress: 'In Progress',
      review: 'Review',
      completed: 'Completed',
      archived: 'Archived'
    }

    return statusLabels[status] || status
  }

  const handleClick = (): void => {
    emit('click', job)
  }

  return {
    statusConfig,
    formattedDate,
    formatStatus,
    handleClick
  }
}
