<template>
  <div class="h-screen bg-gray-50 flex flex-col">
    <!-- Fixed Navbar -->
    <div class="flex-shrink-0">
      <AppNavbar />
    </div>
    
    <!-- Main Content with flex-1 to take remaining space -->
    <main class="flex-1 pt-12 md:pt-8 lg:pt-16 xl:pt-20 overflow-hidden">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import AppNavbar from './AppNavbar.vue'
</script>
