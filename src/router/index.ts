import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginView from '@/views/LoginView.vue'
import KanbanView from '@/views/KanbanView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/kanban'
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        requiresGuest: true,
        title: 'Login - Jobs Manager'
      }
    },
    {
      path: '/kanban',
      name: 'kanban',
      component: KanbanView,
      meta: {
        requiresAuth: true,
        title: 'Kanban Board - Jobs Manager'
      }
    },
    {
      path: '/jobs',
      redirect: '/kanban'
    },
    {
      path: '/accounts/login',
      redirect: '/login'
    }
  ],
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Set page title
  if (to.meta.title) {
    document.title = to.meta.title as string
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      // Try to initialize auth from stored tokens
      await authStore.initializeAuth()

      if (!authStore.isAuthenticated) {
        // Redirect to login with return path
        next({
          name: 'login',
          query: { redirect: to.fullPath }
        })
        return
      }
    }
  }

  // Check if route requires guest (not logged in)
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next({ name: 'kanban' })
    return
  }

  next()
})

export default router
