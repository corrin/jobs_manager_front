<template>
  <div id="app" class="min-h-screen bg-background text-foreground">
    <router-view />
    <Toaster />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { Toaster } from '@/components/ui/sonner'
import '@/plugins/axios'
import { useFeatureFlags } from './stores/feature-flags'

const authStore = useAuthStore()

console.log(useFeatureFlags().isCostingApiEnabled)

onMounted(async () => {
  try {
    await authStore.initializeAuth()
  } catch (error) {
    console.warn('Failed to initialize auth on app start:', error)
  }
})
</script>
