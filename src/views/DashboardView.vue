<template>
  <AppLayout>
    <div class="dashboard-main">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="welcome-card">
        <h2>Welcome to Jobs Manager</h2>
        <p>Work and project management system</p>

        <div class="user-details" v-if="hasUser && userStats">
          <h3>User Information</h3>
          <div class="user-grid">
            <div class="user-item">
              <strong>ID:</strong> {{ userStats.id }}
            </div>
            <div class="user-item">
              <strong>Username:</strong> {{ userStats.username }}
            </div>
            <div class="user-item">
              <strong>Email:</strong> {{ userStats.email }}
            </div>
            <div class="user-item">
              <strong>Name:</strong> {{ userStats.firstName }} {{ userStats.lastName }}
            </div>
            <div class="user-item">
              <strong>Active:</strong> {{ userStats.isActive ? 'Yes' : 'No' }}
            </div>
            <div class="user-item">
              <strong>Staff:</strong> {{ userStats.isStaff ? 'Yes' : 'No' }}
            </div>
          </div>
        </div>

        <div class="actions">
          <div class="flex gap-4 justify-center">
            <router-link 
              to="/kanban" 
              class="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 002 2m0 0v10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
              </svg>
              View Kanban Board
            </router-link>
          </div>
          <p class="text-center text-muted-foreground mt-4">Soon, all system features will be available here.</p>
        </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { useDashboard } from '@/composables/useDashboard'
import AppLayout from '@/components/AppLayout.vue'

const { userStats, hasUser } = useDashboard()
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background-color: #f8fafc;
}

.dashboard-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dashboard-header h1 {
  color: #1a202c;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info span {
  color: #4a5568;
  font-weight: 500;
}

.btn-logout {
  background-color: #e53e3e;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-logout:hover {
  background-color: #c53030;
}

.dashboard-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.welcome-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.welcome-card h2 {
  color: #1a202c;
  font-size: 1.875rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.welcome-card > p {
  color: #718096;
  font-size: 1.125rem;
  margin-bottom: 2rem;
}

.user-details {
  margin: 2rem 0;
  padding: 1.5rem;
  background-color: #f7fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.user-details h3 {
  color: #2d3748;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.user-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.user-item {
  color: #4a5568;
  font-size: 0.875rem;
}

.user-item strong {
  color: #2d3748;
  font-weight: 600;
}

.actions {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e2e8f0;
}

.actions p {
  color: #718096;
  font-style: italic;
  text-align: center;
}

@media (max-width: 768px) {
  .header-content {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .dashboard-main {
    padding: 1rem;
  }

  .welcome-card {
    padding: 1.5rem;
  }

  .user-grid {
    grid-template-columns: 1fr;
  }
}
</style>
