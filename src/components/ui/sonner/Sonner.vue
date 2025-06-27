<!-- eslint-disable vue/multi-word-component-names -->
<script lang="ts" setup>
import { Toaster as Sonner, type ToasterProps } from 'vue-sonner'

const props = defineProps<ToasterProps>()
</script>

<template>
  <div class="app-sonner">
    <Sonner
      class="toaster group"
      v-bind="props"
      :closeButton="true"
      :duration="4000"
      position="top-right"
      :style="{
        '--normal-bg': 'var(--popover)',
        '--normal-text': 'var(--popover-foreground)',
        '--normal-border': 'var(--border)',
      }"
    />
  </div>
</template>
