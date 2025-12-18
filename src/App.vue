<template>
  <div id="app" class="min-h-screen bg-background text-foreground">
    <router-view />
    <Toaster v-if="showToaster" :closeButton="true" />
  </div>
</template>

<script setup lang="ts">
import { debugLog } from '@/utils/debug'

import { onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { Toaster } from '@/components/ui/sonner'
import 'vue-sonner/style.css'
import { useFeatureFlags } from './stores/feature-flags'
import { useCompanyDefaultsStore } from '@/stores/companyDefaults'

const authStore = useAuthStore()
const showToaster = ref(false)

debugLog(useFeatureFlags().isCostingApiEnabled)

onMounted(async () => {
  // Prevent Vue warning: refs inside vue-sonner can break if the vnode is hoisted as static.
  showToaster.value = true
  try {
    await authStore.initializeAuth()
    const companyDefaultsStore = useCompanyDefaultsStore()

    debugLog('[App] Before loading company defaults:', companyDefaultsStore.companyDefaults)
    await companyDefaultsStore.loadCompanyDefaults()

    debugLog('[App] After loading company defaults:', companyDefaultsStore.companyDefaults)
  } catch (error) {
    debugLog('Failed to initialize auth or company defaults on app start:', error)
  }
})
</script>
