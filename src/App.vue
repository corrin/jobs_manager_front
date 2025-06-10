<template>
  <div id="app" class="min-h-screen bg-background text-foreground">
    <router-view />
    <Toaster class="pointer-events-auto" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { Toaster } from '@/components/ui/sonner'
import '@/plugins/axios'

const authStore = useAuthStore()

onMounted(async () => {
  // Try to initialize auth from stored tokens
  await authStore.initializeAuth()
})
</script>
