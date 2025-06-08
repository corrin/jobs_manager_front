import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { NavigationItem, UserInfo } from '@/types/app-layout.types'

export function useAppLayout() {
  const router = useRouter()
  const authStore = useAuthStore()

  const navigationItems: NavigationItem[] = [
    {
      name: 'kanban',
      to: '/kanban',
      label: 'Kanban'
    }
  ]

  const userInfo = computed((): UserInfo => {
    const user = authStore.user
    if (!user) {
      return {
        displayName: 'Guest',
        username: 'guest'
      }
    }

    const fullName = authStore.fullName
    return {
      displayName: fullName || user.username,
      username: user.username
    }
  })

  const handleLogout = async (): Promise<void> => {
    try {
      await authStore.logout()
      await router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
      // Still try to redirect even if logout fails
      await router.push('/login')
    }
  }

  return {
    navigationItems,
    userInfo,
    handleLogout
  }
}
