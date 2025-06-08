<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Fixed Navbar -->
    <AppNavbar />
    
    <!-- Main Content with top padding to account for fixed navbar -->
    <main class="pt-16">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import AppNavbar from './AppNavbar.vue'
</script>
