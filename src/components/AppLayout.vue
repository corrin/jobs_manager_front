<template>
  <div class="h-screen bg-gray-50 flex flex-col">
    <div class="flex-shrink-0">
      <AppNavbar />
    </div>

    <main class="flex-1 pt-12 md:pt-8 lg:pt-14 flex flex-col min-h-0">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import AppNavbar from './AppNavbar.vue'
</script>
