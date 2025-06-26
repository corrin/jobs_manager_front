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
import { useCompanyDefaultsStore } from '@/stores/companyDefaults'

const authStore = useAuthStore()

console.log(useFeatureFlags().isCostingApiEnabled)

onMounted(async () => {
  try {
    await authStore.initializeAuth()
    const companyDefaultsStore = useCompanyDefaultsStore()

    console.log('[App] Before loading company defaults:', companyDefaultsStore.companyDefaults)
    await companyDefaultsStore.loadCompanyDefaults()

    console.log('[App] After loading company defaults:', companyDefaultsStore.companyDefaults)
  } catch (error) {
    console.warn('Failed to initialize auth or company defaults on app start:', error)
  }
})
</script>
