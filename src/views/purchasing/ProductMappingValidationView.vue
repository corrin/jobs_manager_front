<template>
  <AppLayout>
    <div class="p-4 md:p-8 flex flex-col gap-4">
      <Card class="rounded-2xl shadow-lg">
        <CardHeader class="border-b">
          <div class="flex items-center gap-2">
            <Package class="w-6 h-6 text-indigo-600" />
            <h1 class="text-xl font-bold">Product Mappings</h1>
          </div>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-gray-700">Mappings validation screen</p>
        </CardContent>
      </Card>
    </div>
  </AppLayout>
</template>
<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Package } from 'lucide-vue-next'
</script>
