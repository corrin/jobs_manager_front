<template>
  <div v-if="isStaff" class="h-full w-full flex">
    <!-- Sidebar -->
    <nav
      class="w-72 min-w-60 bg-gradient-to-b from-indigo-900 via-indigo-800 to-zinc-900 text-white flex flex-col p-6 gap-8 shadow-2xl rounded-r-3xl h-full relative animate-fade-in"
    >
      <div class="flex flex-col items-center gap-2 mb-6">
        <div
          class="w-16 h-16 rounded-full bg-indigo-700 flex items-center justify-center shadow-lg animate-bounce"
        >
          <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke-width="2" />
            <path d="M12 6v6l4 2" stroke-width="2" />
          </svg>
        </div>
        <div class="text-lg font-bold mt-2">{{ userInfo.value?.first_name || 'User' }}</div>
        <div class="text-sm text-indigo-200">{{ today }}</div>
        <div class="italic text-indigo-300 text-xs mt-1 animate-pulse">
          What are we going to do today?
        </div>
      </div>
      <ul class="flex-1 space-y-2">
        <li v-for="tab in tabs" :key="tab.name">
          <RouterLink
            :to="{ name: tab.route }"
            class="block px-4 py-3 rounded-xl font-semibold transition-all duration-150 flex items-center gap-2 text-base"
            :class="
              isActive(tab.key)
                ? 'bg-indigo-600 text-white shadow-lg scale-105'
                : 'hover:bg-indigo-700 hover:text-indigo-100 text-indigo-200'
            "
          >
            <span v-if="tab.icon" class="w-5 h-5"> <component :is="tab.icon" /> </span>
            {{ tab.label }}
          </RouterLink>
        </li>
      </ul>
      <div class="mt-auto text-xs text-indigo-300 text-center opacity-70">Admin Panel</div>
    </nav>
    <!-- Main Content -->
    <main class="flex-1 h-full overflow-auto bg-zinc-50 p-0">
      <RouterView />
    </main>
  </div>
  <div v-else class="text-center text-red-500 py-10">
    You do not have permission to access the admin panel.
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppLayout } from '@/composables/useAppLayout'
import { UsersIcon } from '@heroicons/vue/24/outline'

const { userInfo } = useAppLayout()
const isStaff = computed(() => Boolean(userInfo.value?.is_staff))
const route = useRoute()

const today = new Date().toLocaleDateString(undefined, {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

const tabs = [
  {
    name: 'Staff',
    key: 'staff',
    label: 'Staff',
    route: 'admin-staff',
    icon: UsersIcon,
  },
  // Add more tabs here as needed
]

function isActive(tab: string) {
  return route.name === `admin-${tab}`
}
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.7s;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
