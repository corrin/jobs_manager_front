import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginView from '@/views/LoginView.vue'
import KanbanView from '@/views/KanbanView.vue'
import { toast } from 'vue-sonner'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: () => {
        if (useAuthStore().user?.is_office_staff) {
          return '/kanban'
        } else {
          return '/kanban/workshop'
        }
      },
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
        allowScroll: true,
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
        allowScroll: true,
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
          path: 'month-end',
          name: 'admin-month-end',
          component: () => import('@/views/AdminMonthEnd.vue'),
          meta: {
            requiresAuth: true,
            requiresSuperUser: true,
            title: 'Month-End - Jobs Manager',
          },
        },
        {
          path: 'errors',
          name: 'admin-errors',
          component: () => import('@/views/AdminErrorView.vue'),
          meta: {
            requiresAuth: true,
            requiresSuperUser: true,
            title: 'Errors - Jobs Manager',
          },
        },
        {
          path: 'ai-providers',
          name: 'admin-ai-providers',
          component: () => import('@/views/AdminAIProvidersView.vue'),
          meta: {
            requiresAuth: true,
            requiresSuperUser: true,
            title: 'AI Providers - Jobs Manager',
          },
        },
        {
          path: 'uat',
          name: 'admin-uat',
          component: () => import('@/views/UATManagementView.vue'),
          meta: {
            requiresAuth: true,
            requiresSuperUser: true,
            title: 'Manage UAT - Jobs Manager',
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
    {
      path: '/reports/clients',
      name: 'clients',
      component: () => import('@/views/ClientsView.vue'),
      meta: { requiresAuth: true, title: 'Clients - Jobs Manager' },
    },
    {
      path: '/reports/clients/:id',
      name: 'client-detail',
      component: () => import('@/views/ClientDetailView.vue'),
      meta: { requiresAuth: true, title: 'Client Details - Jobs Manager' },
      props: true,
    },
    {
      path: '/purchasing/po',
      name: 'purchase-orders',
      component: () => import('@/views/purchasing/PurchaseOrderView.vue'),
      meta: { requiresAuth: true, title: 'Purchase Orders - Jobs Manager' },
    },
    {
      path: '/purchasing/po/create',
      name: 'purchase-order-create',
      component: () => import('@/views/purchasing/PoCreateView.vue'),
      meta: { requiresAuth: true, title: 'Create Purchase Order - Jobs Manager' },
    },
    {
      path: '/purchasing/po/create-from-quote',
      name: 'purchase-order-create-from-quote',
      component: () => import('@/views/purchasing/CreateFromQuoteView.vue'),
      meta: { requiresAuth: true, title: 'Create PO from Quote - Jobs Manager' },
    },
    {
      path: '/purchasing/po/:id',
      name: 'purchase-order-form',
      component: () => import('@/views/purchasing/PurchaseOrderFormView.vue'),
      meta: { requiresAuth: true, title: 'Purchase Order - Jobs Manager' },
      props: true,
    },
    {
      path: '/purchasing/stock',
      name: 'stock',
      component: () => import('@/views/purchasing/StockView.vue'),
      meta: { requiresAuth: true, title: 'Stock - Jobs Manager' },
    },
    {
      path: '/purchasing/mappings',
      name: 'product-mappings',
      component: () => import('@/views/purchasing/ProductMappingValidationView.vue'),
      meta: { requiresAuth: true, title: 'Product Mappings - Jobs Manager' },
    },
    {
      path: '/purchasing/pricing',
      name: 'supplier-pricing',
      component: () => import('@/views/purchasing/SupplierPricingUploadView.vue'),
      meta: { requiresAuth: true, title: 'Supplier Pricing - Jobs Manager' },
    },
    {
      path: '/reports/kpi',
      name: 'kpi-reports',
      component: () => import('@/views/KPIReportsView.vue'),
      meta: { requiresAuth: true, title: 'KPI Reports - Jobs Manager' },
    },
    {
      path: '/reports/job-aging',
      name: 'job-aging-report',
      component: () => import('@/views/JobAgingReportView.vue'),
      meta: { requiresAuth: true, title: 'Job Aging Report - Jobs Manager' },
    },
    {
      path: '/reports/staff-performance',
      name: 'staff-performance-report',
      component: () => import('@/views/StaffPerformanceReportView.vue'),
      meta: { requiresAuth: true, title: 'Staff Performance Report - Jobs Manager' },
    },
    {
      path: '/reports/sales-forecast',
      name: 'sales-forecast-report',
      component: () => import('@/views/SalesForecastReportView.vue'),
      meta: { requiresAuth: true, title: 'Sales Forecast Report - Jobs Manager' },
    },
    {
      path: '/reports/profit-and-loss',
      name: 'profit-loss-report',
      component: () => import('@/views/ProfitLossReportView.vue'),
      meta: { requiresAuth: true, title: 'Profit & Loss Report - Jobs Manager' },
    },
    {
      path: '/reports/data-quality/archived-jobs',
      name: 'data-quality-archived-jobs',
      component: () => import('@/views/DataQualityArchivedJobsView.vue'),
      meta: { requiresAuth: true, title: 'Archived Jobs Validation - Jobs Manager' },
    },
    {
      path: '/safety/jsa',
      name: 'safety-jsa',
      component: () => import('@/views/SafetyJsaView.vue'),
      meta: { requiresAuth: true, title: 'Job Safety Analyses - Jobs Manager' },
    },
    {
      path: '/safety/swp',
      name: 'safety-swp',
      component: () => import('@/views/SafetySwpView.vue'),
      meta: { requiresAuth: true, title: 'Safe Work Procedures - Jobs Manager' },
    },
    {
      path: '/kanban/workshop',
      name: 'workshop-kanban',
      component: () => import('@/views/WorkshopView.vue'),
      meta: {
        requiresAuth: true,
        title: 'Workshop Kanban - Jobs Manager',
      },
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.title) {
    document.title = to.meta.title as string
  }

  if (to.meta.requiresGuest) {
    if (!authStore.user && !authStore.hasCheckedSession) {
      await authStore.initializeAuth()
    }
    if (authStore.isAuthenticated) {
      next(authStore.user?.is_office_staff ? { name: 'kanban' } : { name: 'workshop-kanban' })
      return
    }
  }

  if (to.meta.requiresAuth) {
    const ok = await authStore.userIsLogged()
    if (!ok) {
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }
  }

  if (to.meta.requiresSuperUser && !authStore.user?.is_superuser) {
    toast.error('You are not allowed to visit this page.', {
      description: 'Please try again or contact Corrin if you think this is a mistake.',
    })
    next({ name: 'kanban' })
  }

  next()
})

export default router
