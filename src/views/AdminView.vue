<template>
  <div v-if="isStaff" class="admin-layout">
    <!-- Sidebar -->
    <nav class="sidebar">
      <div class="user-card">
        <div class="avatar">
          <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke-width="2" />
            <path d="M12 6v6l4 2" stroke-width="2" />
          </svg>
        </div>
        <div class="user-name">
          {{ userInfo.value?.preferred_name || userInfo.value?.first_name || 'User' }}
        </div>
        <div class="user-date">{{ today }}</div>
        <div class="user-quote">What are we going to do today?</div>
      </div>
      <ul class="tab-list">
        <li v-for="tab in tabs" :key="tab.name">
          <RouterLink
            :to="{ name: tab.route }"
            class="tab-link"
            :class="isActive(tab.key) ? 'tab-link--active' : ''"
          >
            <span v-if="tab.icon" class="tab-icon"> <component :is="tab.icon" /> </span>
            {{ tab.label }}
          </RouterLink>
        </li>
      </ul>
      <div class="sidebar-footer">Admin Panel</div>
    </nav>
    <!-- Main Content -->
    <main class="admin-main">
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
import { Users } from 'lucide-vue-next'

const { userInfo } = useAppLayout()
const isStaff = computed(() => Boolean(userInfo.value?.is_staff))
const route = useRoute()

const today = new Date().toLocaleDateString('en-NZ', {
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
    icon: Users,
  },
  // Add more tabs here as needed
]

function isActive(tab: string) {
  return route.name === `admin-${tab}`
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  height: 100%;
  min-height: 0;
  background: #f4f4f5;
  overflow: hidden;
}
.sidebar {
  width: 18rem;
  min-width: 15rem;
  background: linear-gradient(to bottom, #312e81, #3730a3 60%, #18181b 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  gap: 2rem;
  box-shadow: 0 8px 32px 0 rgba(31, 41, 55, 0.25);
  border-top-right-radius: 1.5rem;
  border-bottom-right-radius: 1.5rem;
  height: 100%;
  position: sticky;
  top: 0;
  z-index: 10;
}
.user-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}
.avatar {
  width: 4rem;
  height: 4rem;
  border-radius: 9999px;
  background: #4338ca;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px 0 rgba(49, 46, 129, 0.25);
  margin-bottom: 0.5rem;
  animation: bounce 1.2s infinite alternate;
}
@keyframes bounce {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-8px);
  }
}
.user-name {
  font-size: 1.125rem;
  font-weight: bold;
  margin-top: 0.25rem;
}
.user-date {
  font-size: 0.95rem;
  color: #c7d2fe;
}
.user-quote {
  font-style: italic;
  color: #a5b4fc;
  font-size: 0.8rem;
  margin-top: 0.25rem;
  animation: pulse 2s infinite alternate;
}
@keyframes pulse {
  0% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}
.tab-list {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.tab-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 1rem;
  color: #c7d2fe;
  background: transparent;
  transition: all 0.15s;
  box-shadow: none;
}
.tab-link--active {
  background: #4f46e5;
  color: #fff;
  box-shadow: 0 2px 8px 0 rgba(49, 46, 129, 0.15);
  transform: scale(1.04);
}
.tab-link:not(.tab-link--active):hover {
  background: #3730a3;
  color: #e0e7ff;
}
.tab-icon {
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sidebar-footer {
  margin-top: auto;
  font-size: 0.8rem;
  color: #a5b4fc;
  text-align: center;
  opacity: 0.7;
  padding-bottom: 0.5rem;
}
.admin-main {
  flex: 1 1 0;
  height: 100%;
  overflow-y: auto;
  background: #f4f4f5;
  padding: 0;
  min-width: 0;
}
</style>
