<template>
  <nav class="bg-white border-b border-gray-200 px-6 py-4 fixed top-0 left-0 right-0 z-50">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-8">
        <h1 class="text-xl font-bold text-gray-900">Jobs Manager</h1>
        <div class="flex items-center space-x-6">
          <router-link to="/jobs" class="text-gray-700 hover:text-blue-600 transition-colors">Jobs Kanban</router-link>
          <a href="#" class="text-gray-700 hover:text-blue-600 transition-colors">Create Job</a>
          <a href="#" class="text-gray-700 hover:text-blue-600 transition-colors">Timesheets</a>

          <!-- Purchases Dropdown -->
          <div class="relative" @click.stop>
            <button @click="toggleDropdown('purchases')" class="text-gray-700 hover:text-blue-600 transition-colors flex items-center">
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

          <a href="#" class="text-gray-700 hover:text-blue-600 transition-colors">Xero</a>

          <!-- Reports Dropdown -->
          <div class="relative" @click.stop>
            <button @click="toggleDropdown('reports')" class="text-gray-700 hover:text-blue-600 transition-colors flex items-center">
              Reports
              <ChevronDown class="ml-1 h-4 w-4" />
            </button>
            <div v-if="activeDropdown === 'reports'" class="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
              <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">KPI Reports</a>
            </div>
          </div>

          <!-- Admin Dropdown -->
          <div class="relative" @click.stop>
            <button @click="toggleDropdown('admin')" class="text-gray-700 hover:text-blue-600 transition-colors flex items-center">
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
      </div>

      <div class="flex items-center space-x-4">
        <span class="text-gray-700">Welcome, {{ userInfo.displayName }}!</span>
        <button @click="handleLogout" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors">
          Log out
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { useAppLayout } from '@/composables/useAppLayout'

// State
const activeDropdown = ref<string | null>(null)

// Get user info and logout function from app layout
const { userInfo, handleLogout } = useAppLayout()

// Methods
const toggleDropdown = (dropdown: string) => {
  activeDropdown.value = activeDropdown.value === dropdown ? null : dropdown
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
