<template>
  <div id="app" class="min-h-screen bg-background text-foreground">
    <router-view />
    <Toaster />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCostingStore } from '@/stores/costing'
import { Toaster } from '@/components/ui/sonner'
import '@/plugins/axios'
import { useFeatureFlags } from './stores/feature-flags'

const authStore = useAuthStore()
const costingStore = useCostingStore()

console.log(useFeatureFlags().isCostingApiEnabled)

onMounted(async () => {
  // Try to initialize auth from stored tokens
  try {
    await authStore.initializeAuth()
  } catch (error) {
    console.warn('Failed to initialize auth on app start:', error)
  }
})

// Test function for costing store
const testCostingStore = async () => {
  console.log('🧪 Testing Costing Store...')
  
  // Test 1: Initial State
  console.log('1️⃣ Initial State:')
  console.log('   currentKind:', costingStore.currentKind)
  console.log('   costSet:', costingStore.costSet)
  console.log('   loading:', costingStore.loading)
  console.log('   isLoaded:', costingStore.isLoaded)
  
  // Test 2: Load costing data
  console.log('2️⃣ Loading costing data...')
  try {
    await costingStore.load('4e39419e-b886-4630-8fa5-fd9a35d98b63')
    
    console.log('   ✅ Data loaded successfully!')
    console.log('   costSet:', costingStore.costSet)
    console.log('   totalCost:', costingStore.totalCost)
    console.log('   totalRevenue:', costingStore.totalRevenue)
    console.log('   totalHours:', costingStore.totalHours)
    
    // Test 3: Grouped by kind
    console.log('3️⃣ Grouped by kind:')
    const grouped = costingStore.groupedByKind
    console.log('   time entries:', grouped.time.length, 'items')
    console.log('   material entries:', grouped.material.length, 'items')
    console.log('   adjust entries:', grouped.adjust.length, 'items')
    console.log('   grouped data:', grouped)
    
    // Test 4: Change kind
    console.log('4️⃣ Testing kind change...')
    costingStore.setCurrentKind('quote')
    console.log('   currentKind changed to:', costingStore.currentKind)
    
    // Reset to estimate
    costingStore.setCurrentKind('estimate')
    
  } catch (error) {
    console.log('   ❌ Error loading data:', error)
  }
  
  console.log('🏁 Costing store tests completed!')
}
</script>
