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
              v-for="item in navigationItems"
              :key="item.name"
              :to="item.to"
              class="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors"
              active-class="text-foreground bg-accent"
            >
              {{ item.label }}
            </router-link>
          </nav>

          <!-- User Menu -->
          <div class="flex items-center space-x-4">
            <span class="text-sm text-muted-foreground">
              {{ userInfo.displayName }}
            </span>
            <Button variant="outline" size="sm" @click="handleLogout">
              Sign Out
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
import { Button } from '@/components/ui/button'
import { useAppLayout } from '@/composables/useAppLayout'

const { navigationItems, userInfo, handleLogout } = useAppLayout()
</script>
