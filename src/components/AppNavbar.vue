<template>
  <nav class="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4 fixed top-0 left-0 right-0 z-50">
    <div class="flex items-center justify-between">
      <!-- Mobile Menu Button & Logo -->
      <div class="flex items-center">
        <button
          @click="toggleMobileMenu"
          class="md:hidden mr-3 p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        >
          <Menu v-if="!showMobileMenu" class="h-6 w-6" />
          <X v-else class="h-6 w-6" />
        </button>
        <h1 class="text-lg sm:text-xl font-bold text-gray-900">Jobs Manager</h1>
      </div>

      <!-- Desktop Navigation -->
      <div class="hidden md:flex items-center space-x-6">
        <router-link to="/jobs" class="text-gray-700 hover:text-blue-600 transition-colors text-sm">Jobs Kanban</router-link>
        <a href="#" class="text-gray-700 hover:text-blue-600 transition-colors text-sm">Create Job</a>
        <a href="#" class="text-gray-700 hover:text-blue-600 transition-colors text-sm">Timesheets</a>

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

      <!-- Desktop User Info -->
      <div class="hidden md:flex items-center space-x-4">
        <span class="text-gray-700 text-sm">Welcome, {{ userInfo.displayName }}!</span>
        <button @click="handleLogout" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md transition-colors text-sm">
          Log out
        </button>
      </div>

      <!-- Mobile User Info -->
      <div class="flex md:hidden items-center">
        <span class="text-gray-700 text-xs mr-2">{{ userInfo.displayName?.split(' ')[0] }}</span>
        <button @click="handleLogout" class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs">
          Logout
        </button>
      </div>
    </div>

    <!-- Mobile Menu -->
    <div v-if="showMobileMenu" class="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
      <div class="space-y-3">
        <router-link 
          to="/jobs" 
          class="block text-gray-700 hover:text-blue-600 transition-colors font-medium"
          @click="closeMobileMenu"
        >
          Jobs Kanban
        </router-link>
        <a href="#" class="block text-gray-700 hover:text-blue-600 transition-colors" @click="closeMobileMenu">Create Job</a>
        <a href="#" class="block text-gray-700 hover:text-blue-600 transition-colors" @click="closeMobileMenu">Timesheets</a>
        
        <!-- Mobile Purchases Section -->
        <div>
          <button @click="toggleMobileSection('purchases')" class="w-full text-left text-gray-700 hover:text-blue-600 transition-colors flex items-center justify-between">
            Purchases
            <ChevronDown :class="['h-4 w-4 transition-transform', mobileSections.purchases ? 'rotate-180' : '']" />
          </button>
          <div v-if="mobileSections.purchases" class="mt-2 ml-4 space-y-2">
            <a href="#" class="block text-sm text-gray-600 hover:text-blue-600" @click="closeMobileMenu">Purchase Orders</a>
            <a href="#" class="block text-sm text-gray-600 hover:text-blue-600" @click="closeMobileMenu">Delivery Receipts</a>
            <a href="#" class="block text-sm text-gray-600 hover:text-blue-600" @click="closeMobileMenu">Use Stock</a>
            <a href="#" class="block text-sm text-gray-600 hover:text-blue-600" @click="closeMobileMenu">Upload Supplier Pricing</a>
          </div>
        </div>

        <a href="#" class="block text-gray-700 hover:text-blue-600 transition-colors" @click="closeMobileMenu">Xero</a>

        <!-- Mobile Reports Section -->
        <div>
          <button @click="toggleMobileSection('reports')" class="w-full text-left text-gray-700 hover:text-blue-600 transition-colors flex items-center justify-between">
            Reports
            <ChevronDown :class="['h-4 w-4 transition-transform', mobileSections.reports ? 'rotate-180' : '']" />
          </button>
          <div v-if="mobileSections.reports" class="mt-2 ml-4 space-y-2">
            <a href="#" class="block text-sm text-gray-600 hover:text-blue-600" @click="closeMobileMenu">KPI Reports</a>
          </div>
        </div>

        <!-- Mobile Admin Section -->
        <div>
          <button @click="toggleMobileSection('admin')" class="w-full text-left text-gray-700 hover:text-blue-600 transition-colors flex items-center justify-between">
            Admin
            <ChevronDown :class="['h-4 w-4 transition-transform', mobileSections.admin ? 'rotate-180' : '']" />
          </button>
          <div v-if="mobileSections.admin" class="mt-2 ml-4 space-y-2">
            <a href="#" class="block text-sm text-gray-600 hover:text-blue-600" @click="closeMobileMenu">Run Month End</a>
            <a href="#" class="block text-sm text-gray-600 hover:text-blue-600" @click="closeMobileMenu">Edit Staff</a>
            <a href="#" class="block text-sm text-gray-600 hover:text-blue-600" @click="closeMobileMenu">Edit Company Defaults</a>
            <a href="#" class="block text-sm text-gray-600 hover:text-blue-600" @click="closeMobileMenu">Archive Complete Jobs</a>
          </div>
        </div>
      </div>
    </div>
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
