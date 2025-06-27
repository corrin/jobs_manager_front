import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginView from '@/views/LoginView.vue'
import KanbanView from '@/views/KanbanView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/kanban',
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        requiresGuest: true,
        title: 'Login - Jobs Manager',
      },
    },
    {
      path: '/kanban',
      name: 'kanban',
      component: KanbanView,
      meta: {
        requiresAuth: true,
        title: 'Kanban Board - Jobs Manager',
      },
    },
    {
      path: '/jobs/create',
      name: 'job-create',
      component: () => import('@/views/JobCreateView.vue'),
      meta: {
        requiresAuth: true,
        title: 'Create Job - Jobs Manager',
      },
    },
    {
      path: '/jobs/:id',
      name: 'job-edit',
      component: () => import('@/views/JobView.vue'),
      meta: {
        requiresAuth: true,
        title: 'Job - Jobs Manager',
      },
    },
    {
      path: '/jobs',
      redirect: '/kanban',
    },
    {
      path: '/quoting/chat',
      name: 'QuotingChatView',
      component: () => import('@/views/QuotingChatView.vue'),
      meta: {
        requiresAuth: true,
        title: 'Interactive Quote Chat - Jobs Manager',
      },
    },
    {
      path: '/timesheets/entry',
      name: 'timesheet-entry',
      component: () => import('@/views/TimesheetEntryView.vue'),
      meta: {
        requiresAuth: true,
        title: 'Timesheet Entry - Jobs Manager',
      },
    },
    {
      path: '/timesheets/daily',
      name: 'timesheet-daily',
      component: () => import('@/views/DailyTimesheetView.vue'),
      meta: {
        requiresAuth: true,
        title: 'Daily Timesheet Overview - Jobs Manager',
      },
    },
    {
      path: '/timesheets',
      redirect: '/timesheets/daily',
    },
    {
      path: '/accounts/login',
      redirect: '/login',
    },
    {
      path: '/timesheets/weekly',
      name: 'WeeklyTimesheet',
      component: () => import('@/views/WeeklyTimesheetView.vue'),
      meta: {
        requiresAuth: true,
        title: 'Weekly Timesheet',
      },
    },
    {
      path: '/admin',
      component: () => import('@/views/AdminView.vue'),
      meta: { requiresAuth: true, requiresSuperUser: true, title: 'Admin - Jobs Manager' },
      children: [
        {
          path: 'staff',
          name: 'admin-staff',
          component: () => import('@/views/AdminStaffView.vue'),
          meta: {
            requiresAuth: true,
            requiresSuperUser: true,
            title: 'Staff Admin - Jobs Manager',
          },
        },
        {
          path: 'company',
          name: 'admin-company',
          component: () => import('@/views/AdminCompanyView.vue'),
          meta: {
            requiresAuth: true,
            requiresSuperUser: true,
            title: 'Company Defaults - Jobs Manager',
          },
        },
        {
          path: 'django-jobs',
          name: 'admin-django-jobs',
          component: () => import('@/views/AdminDjangoJobsView.vue'),
          meta: {
            requiresAuth: true,
            requiresSuperUser: true,
            title: 'Django Jobs - Jobs Manager',
          },
        },
        {
          path: 'archive-jobs',
          name: 'admin-archive-jobs',
          component: () => import('@/views/AdminArchiveJobsView.vue'),
          meta: {
            requiresAuth: true,
            requiresSuperUser: true,
            title: 'Archive Jobs - Jobs Manager',
          },
        },
        {
          path: '',
          redirect: { name: 'admin-staff' },
        },
      ],
    },
    {
      path: '/xero',
      name: 'xero-sync',
      component: () => import('@/views/XeroView.vue'),
      meta: {
        requiresAuth: true,
        requiresSuperUser: true,
        title: 'Xero Sync - Jobs Manager',
      },
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.title) {
    document.title = to.meta.title as string
  }

  if (to.name === 'login') {
    next()
    return
  }

  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      const wasAuthenticated = await authStore.initializeAuth()

      if (!authStore.isAuthenticated && !wasAuthenticated) {
        next({
          name: 'login',
          query: { redirect: to.fullPath },
        })
        return
      }
    }
  }

  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next({ name: 'kanban' })
    return
  }

  next()
})

export default router
