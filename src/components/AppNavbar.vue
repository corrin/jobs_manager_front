<template>
  <nav class="bg-white border-b border-gray-200 px-3 sm:px-6 py-1 md:py-0.5 lg:py-3 xl:py-4 fixed top-0 left-0 right-0 z-50 transition-all duration-200">
    <div class="flex items-center justify-between h-10 md:h-8 lg:h-auto">
      <!-- Mobile & Tablet Menu Button & Logo -->
      <div class="flex items-center">
        <button
          @click="toggleMobileMenu"
          class="lg:hidden mr-2 p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Menu v-if="!showMobileMenu" class="h-4 w-4" />
          <X v-else class="h-4 w-4" />
        </button>
        <router-link to="/kanban" class="text-sm md:text-sm lg:text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">Jobs Manager</router-link>
      </div>

      <!-- Desktop Navigation (Large screens only) -->
      <div class="hidden lg:flex items-center space-x-6">
        <router-link to="/jobs/create" class="text-gray-700 hover:text-blue-600 transition-colors text-sm">Create Job</router-link>
        <!-- Timesheet Dropdown (apenas otimizado) -->
        <router-link to="/timesheets/entry" class="text-gray-700 hover:text-blue-600 transition-colors text-sm">Timesheets</router-link>
        <!-- Purchases Dropdown -->
        <div class="relative" @click.stop>
          <button @click="toggleDropdown('purchases')" class="text-gray-700 hover:text-blue-600 transition-colors flex items-center text-sm">
            Purchases
            <ChevronDown class="ml-1 h-4 w-4" />
          </button>
          <div v-if="activeDropdown === 'purchases'" class="absolute top-full left-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
            <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Purchase Orders</a>
            <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Delivery Receipts</a>
            <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Use Stock</a>
            <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Upload Supplier Pricing</a>
          </div>
        </div>
        <a href="#" class="text-gray-700 hover:text-blue-600 transition-colors text-sm">Xero</a>
        <!-- Reports Dropdown -->
        <div class="relative" @click.stop>
          <button @click="toggleDropdown('reports')" class="text-gray-700 hover:text-blue-600 transition-colors flex items-center text-sm">
            Reports
            <ChevronDown class="ml-1 h-4 w-4" />
          </button>
          <div v-if="activeDropdown === 'reports'" class="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
            <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">KPI Reports</a>
          </div>
        </div>

        <!-- Admin Dropdown -->
        <div class="relative" @click.stop>
          <button @click="toggleDropdown('admin')" class="text-gray-700 hover:text-blue-600 transition-colors flex items-center text-sm">
            Admin
            <ChevronDown class="ml-1 h-4 w-4" />
          </button>
          <div v-if="activeDropdown === 'admin'" class="absolute top-full left-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
            <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Run Month End</a>
            <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Edit Staff</a>
            <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Edit Company Defaults</a>
            <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Archive Complete Jobs</a>
          </div>
        </div>
      </div>

      <!-- User Info - Compact for tablets/mobile -->
      <div class="flex items-center">
        <!-- Tablet: Compact user info -->
        <div class="hidden md:flex lg:hidden items-center space-x-2">
          <span class="text-gray-700 text-xs">{{ userInfo.displayName?.split(' ')[0] }}</span>
          <button @click="handleLogout" class="bg-red-500 hover:bg-red-600 text-white px-2 py-0.5 rounded text-xs transition-colors">
            Logout
          </button>
        </div>

        <!-- Desktop: Full user info -->
        <div class="hidden lg:flex items-center space-x-4">
          <span class="text-gray-700 text-sm">Welcome, {{ userInfo.displayName }}!</span>
          <button @click="handleLogout" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md transition-colors text-sm">
            Log out
          </button>
        </div>

        <!-- Mobile: Super compact -->
        <div class="flex md:hidden items-center">
          <span class="text-gray-700 text-xs mr-2">{{ userInfo.displayName?.split(' ')[0] }}</span>
          <button @click="handleLogout" class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs">
            Logout
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile/Tablet Menu Overlay -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 transform -translate-y-2"
      enter-to-class="opacity-100 transform translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 transform translate-y-0"
      leave-to-class="opacity-0 transform -translate-y-2"
    >
      <div v-if="showMobileMenu" class="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-40">
        <div class="px-4 py-4 max-h-[70vh] overflow-y-auto">
          <div class="grid grid-cols-1 gap-3">
            <!-- Primary Actions -->
            <div class="space-y-3">
              <router-link to="/jobs/create" class="flex items-center px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all" @click="closeMobileMenu">Create Job</router-link>
              <router-link to="/timesheet/optimized" class="flex items-center px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all" @click="closeMobileMenu">Optimized Timesheet</router-link>
              <a href="#" class="flex items-center px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all" @click="closeMobileMenu">Xero</a>
            </div>

            <!-- Separator -->
            <div class="border-t border-gray-200"></div>

            <!-- Expandable Sections -->
            <div class="space-y-2">
              <!-- Purchases Section -->
              <div class="bg-gray-50 rounded-md">
                <button
                  @click="toggleMobileSection('purchases')"
                  class="w-full flex items-center justify-between px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                >
                  Purchases
                  <ChevronDown :class="['h-4 w-4 transition-transform duration-200', mobileSections.purchases ? 'rotate-180' : '']" />
                </button>
                <Transition
                  enter-active-class="transition-all duration-200 ease-out"
                  enter-from-class="opacity-0 max-h-0"
                  enter-to-class="opacity-100 max-h-40"
                  leave-active-class="transition-all duration-200 ease-in"
                  leave-from-class="opacity-100 max-h-40"
                  leave-to-class="opacity-0 max-h-0"
                >
                  <div v-if="mobileSections.purchases" class="overflow-hidden">
                    <div class="px-3 pb-2 space-y-1">
                      <a href="#" class="block px-2 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-all" @click="closeMobileMenu">Purchase Orders</a>
                      <a href="#" class="block px-2 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-all" @click="closeMobileMenu">Delivery Receipts</a>
                      <a href="#" class="block px-2 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-all" @click="closeMobileMenu">Use Stock</a>
                      <a href="#" class="block px-2 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-all" @click="closeMobileMenu">Upload Supplier Pricing</a>
                    </div>
                  </div>
                </Transition>
              </div>

              <!-- Reports Section -->
              <div class="bg-gray-50 rounded-md">
                <button
                  @click="toggleMobileSection('reports')"
                  class="w-full flex items-center justify-between px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                >
                  Reports
                  <ChevronDown :class="['h-4 w-4 transition-transform duration-200', mobileSections.reports ? 'rotate-180' : '']" />
                </button>
                <Transition
                  enter-active-class="transition-all duration-200 ease-out"
                  enter-from-class="opacity-0 max-h-0"
                  enter-to-class="opacity-100 max-h-40"
                  leave-active-class="transition-all duration-200 ease-in"
                  leave-from-class="opacity-100 max-h-40"
                  leave-to-class="opacity-0 max-h-0"
                >
                  <div v-if="mobileSections.reports" class="overflow-hidden">
                    <div class="px-3 pb-2 space-y-1">
                      <a href="#" class="block px-2 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-all" @click="closeMobileMenu">KPI Reports</a>
                    </div>
                  </div>
                </Transition>
              </div>

              <!-- Admin Section -->
              <div class="bg-gray-50 rounded-md">
                <button
                  @click="toggleMobileSection('admin')"
                  class="w-full flex items-center justify-between px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                >
                  Admin
                  <ChevronDown :class="['h-4 w-4 transition-transform duration-200', mobileSections.admin ? 'rotate-180' : '']" />
                </button>
                <Transition
                  enter-active-class="transition-all duration-200 ease-out"
                  enter-from-class="opacity-0 max-h-0"
                  enter-to-class="opacity-100 max-h-48"
                  leave-active-class="transition-all duration-200 ease-in"
                  leave-from-class="opacity-100 max-h-48"
                  leave-to-class="opacity-0 max-h-0"
                >
                  <div v-if="mobileSections.admin" class="overflow-hidden">
                    <div class="px-3 pb-2 space-y-1">
                      <a href="#" class="block px-2 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-all" @click="closeMobileMenu">Run Month End</a>
                      <a href="#" class="block px-2 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-all" @click="closeMobileMenu">Edit Staff</a>
                      <a href="#" class="block px-2 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-all" @click="closeMobileMenu">Edit Company Defaults</a>
                      <a href="#" class="block px-2 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-all" @click="closeMobileMenu">Archive Complete Jobs</a>
                    </div>
                  </div>
                </Transition>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ChevronDown, Menu, X } from 'lucide-vue-next'
import { useAppLayout } from '@/composables/useAppLayout'

// State
const activeDropdown = ref<string | null>(null)
const showMobileMenu = ref(false)
const mobileSections = ref({
  purchases: false,
  reports: false,
  admin: false
})

// Get user info and logout function from app layout
const { userInfo, handleLogout } = useAppLayout()

// Methods
const toggleDropdown = (dropdown: string) => {
  activeDropdown.value = activeDropdown.value === dropdown ? null : dropdown
}

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
  if (!showMobileMenu.value) {
    // Reset mobile sections when closing menu
    mobileSections.value = {
      purchases: false,
      reports: false,
      admin: false
    }
  }
}

const closeMobileMenu = () => {
  showMobileMenu.value = false
  mobileSections.value = {
    purchases: false,
    reports: false,
    admin: false
  }
}

const toggleMobileSection = (section: 'purchases' | 'reports' | 'admin') => {
  mobileSections.value[section] = !mobileSections.value[section]
}

const closeDropdowns = () => {
  activeDropdown.value = null
}

// Event listeners
onMounted(() => {
  document.addEventListener('click', closeDropdowns)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdowns)
})
</script>
