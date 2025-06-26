<template>
  <div v-if="isStaff">
    <div class="flex flex-col lg:flex-row gap-4">
      <nav class="w-full lg:w-56 bg-white border-r border-slate-200 p-4 rounded-md shadow-sm">
        <ul class="space-y-2">
          <li>
            <RouterLink
              :to="{ name: 'admin-staff' }"
              class="block px-3 py-2 rounded hover:bg-indigo-50"
              :class="{ 'bg-indigo-100 font-bold': isActive('staff') }"
            >
              Staff
            </RouterLink>
          </li>
        </ul>
      </nav>
      <main class="flex-1 p-4">
        <RouterView />
      </main>
    </div>
  </div>
  <div v-else class="text-center text-red-500 py-10">
    You do not have permission to access the admin panel.
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppLayout } from '@/composables/useAppLayout'

const { userInfo } = useAppLayout()
const isStaff = computed(() => Boolean(userInfo.value?.is_staff))
const route = useRoute()

function isActive(tab: string) {
  return route.name === `admin-${tab}`
}
</script>

<style scoped>
/* No custom styles needed */
</style>
