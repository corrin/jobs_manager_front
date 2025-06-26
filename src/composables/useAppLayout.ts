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
      label: 'Kanban',
    },
    {
      name: 'timesheet',
      to: '/timesheet',
      label: 'Timesheet',
    },
  ]

  const userInfo = computed((): UserInfo => {
    const user = authStore.user
    if (!user) {
      return {
        displayName: 'Guest',
        username: 'guest',
        is_staff: false,
        is_active: false,
      }
    }

    const fullName = authStore.fullName
    return {
      displayName: fullName || user.username,
      username: user.username,
      is_staff: typeof user.is_staff === 'boolean' ? user.is_staff : false,
      is_active: typeof user.is_active === 'boolean' ? user.is_active : false,
      // Add other fields as needed
    }
  })

  const handleLogout = async (): Promise<void> => {
    try {
      await authStore.logout()
      await router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)

      await router.push('/login')
    }
  }

  return {
    navigationItems,
    userInfo,
    handleLogout,
  }
}
