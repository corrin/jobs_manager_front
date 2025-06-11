import { ref, computed } from 'vue'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  duration?: number
}

/**
 * Composable para gerenciar notificações reativas no JobView
 * Centraliza todas as notificações de updates do job
 */
export function useJobNotifications() {
  const notifications = ref<Notification[]>([])

  // Auto remove notifications after duration
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
      duration: notification.duration || 5000
    }

    notifications.value.unshift(newNotification)

    // Auto remove after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }

    return id
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const clearAllNotifications = () => {
    notifications.value = []
  }

  // Computed properties for different notification types
  const errorNotifications = computed(() => 
    notifications.value.filter(n => n.type === 'error')
  )

  const successNotifications = computed(() =>
    notifications.value.filter(n => n.type === 'success')
  )

  // Convenience methods for common job notifications
  const notifyJobUpdated = (jobName: string) => {
    return addNotification({
      type: 'success',
      title: 'Job Atualizado',
      message: `${jobName} foi atualizado com sucesso`,
      duration: 3000
    })
  }

  const notifyJobError = (jobName: string, error: string) => {
    return addNotification({
      type: 'error',
      title: 'Erro no Job',
      message: `Falha ao atualizar ${jobName}: ${error}`,
      duration: 0 // Don't auto-remove errors
    })
  }

  const notifyEventAdded = (eventType: string) => {
    return addNotification({
      type: 'info',
      title: 'Evento Adicionado',
      message: `Novo evento "${eventType}" foi adicionado`,
      duration: 2000
    })
  }

  const notifyPricingUpdated = () => {
    return addNotification({
      type: 'success',
      title: 'Pricing Atualizado',
      message: 'Os dados de pricing foram salvos automaticamente',
      duration: 2000
    })
  }

  const notifyFileUploaded = (fileName: string) => {
    return addNotification({
      type: 'success',
      title: 'Arquivo Enviado',
      message: `${fileName} foi enviado com sucesso`,
      duration: 3000
    })
  }

  const notifyFileDeleted = (fileName: string) => {
    return addNotification({
      type: 'warning',
      title: 'Arquivo Removido',
      message: `${fileName} foi removido`,
      duration: 3000
    })
  }

  return {
    notifications: computed(() => notifications.value),
    errorNotifications,
    successNotifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    // Convenience methods
    notifyJobUpdated,
    notifyJobError,
    notifyEventAdded,
    notifyPricingUpdated,
    notifyFileUploaded,
    notifyFileDeleted,
  }
}
