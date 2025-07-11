<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg+*]:pl-7',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive:
          'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

/**

 * @deprecated Use generated types from src/api/generated instead

 * This interface will be removed after migration to openapi-zod-client generated types

 */

interface Props extends /* @vue-ignore */ VariantProps<typeof alertVariants> {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
const delegated = reactiveOmit(props, 'class')
</script>

<template>
  <div :class="cn(alertVariants({ variant: props.variant }), props.class)" v-bind="delegated">
    <slot />
  </div>
</template>
