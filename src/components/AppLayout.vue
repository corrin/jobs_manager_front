<template>
  <div class="min-h-screen bg-background">
    <!-- Navigation Header -->
    <header class="bg-card border-b border-border">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo / Brand -->
          <div class="flex items-center">
            <router-link to="/" class="text-xl font-bold text-foreground">
              Jobs Manager
            </router-link>
          </div>

          <!-- Navigation Links -->
          <nav class="hidden md:flex space-x-8">
            <router-link
              to="/kanban"
              class="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors"
              active-class="text-foreground bg-accent"
            >
              Kanban
            </router-link>
            <router-link
              to="/dashboard"
              class="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors"
              active-class="text-foreground bg-accent"
            >
              Dashboard
            </router-link>
          </nav>

          <!-- User Menu -->
          <div class="flex items-center space-x-4">
            <span class="text-sm text-muted-foreground">
              {{ authStore.fullName || authStore.user?.username }}
            </span>
            <Button variant="outline" size="sm" @click="handleLogout">
              Sair
            </Button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main>
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'

const router = useRouter()
const authStore = useAuthStore()

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>
