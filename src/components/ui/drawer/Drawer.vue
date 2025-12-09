<!-- eslint-disable vue/multi-word-component-names -->
<script lang="ts" setup>
import type { DrawerRootEmits, DrawerRootProps } from 'vaul-vue'
import { DrawerRoot } from 'vaul-vue'

const props = withDefaults(defineProps<DrawerRootProps>(), {
  shouldScaleBackground: true,
})

const emit = defineEmits<DrawerRootEmits>()
</script>

<template>
  <DrawerRoot data-slot="drawer" v-bind="props as any" @update:open="emit('update:open', $event)">
    <slot />
  </DrawerRoot>
</template>
