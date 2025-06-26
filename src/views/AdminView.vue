<template>
  <div v-if="isStaff">
    <div class="flex flex-col lg:flex-row gap-4">
      <nav class="w-full lg:w-56 bg-white border-r border-gray-200 p-4 rounded-md shadow-sm">
        <ul class="space-y-2">
          <li>
            <RouterLink
              :to="{ name: 'admin-staff' }"
              class="block px-3 py-2 rounded hover:bg-blue-50"
              :class="{ 'bg-blue-100 font-bold': isActiveTab('staff') }"
            >
              Staff
            </RouterLink>
          </li>
          <!-- Future tabs: Company Defaults, etc -->
        </ul>
      </nav>
      <main class="flex-1 p-4">
        <RouterView />
      </main>
    </div>
  </div>
  <div v-else class="text-center text-red-500 py-10">
    <p>You do not have permission to access the admin panel.</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppLayout } from '@/composables/useAppLayout'

const { userInfo } = useAppLayout()
const isStaff = computed(() => {
  const staffFlag = userInfo.value?.is_staff
  console.log('[AdminView] userInfo:', userInfo.value)
  console.log('[AdminView] is_staff:', staffFlag)
  return staffFlag
})
const route = useRoute()

function isActiveTab(tab: string) {
  return route.name === `admin-${tab}`
}
</script>

<style scoped>
/* No custom styles needed */
</style>
