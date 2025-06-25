<template>
  <div v-if="isSuperUser">
    <div class="flex flex-col lg:flex-row gap-4">
      <nav class="w-full lg:w-56 bg-white border-r border-gray-200 p-4 rounded-md shadow-sm">
        <ul class="space-y-2">
          <li>
            <RouterLink
              :to="{ name: 'admin-staff' }"
              class="block px-3 py-2 rounded hover:bg-blue-50"
              :class="{ 'bg-blue-100 font-bold': isActiveTab('staff') }"
            >
              Staff
            </RouterLink>
          </li>
          <!-- Futuras abas: Company Defaults, etc -->
        </ul>
      </nav>
      <main class="flex-1 p-4">
        <RouterView />
      </main>
    </div>
  </div>
  <div v-else class="text-center text-red-500 py-10">
    <p>Você não tem permissão para acessar o painel administrativo.</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppLayout } from '@/composables/useAppLayout'

const { userInfo } = useAppLayout()
const isSuperUser = computed(() => userInfo.value?.is_superuser)
const route = useRoute()

function isActiveTab(tab: string) {
  return route.name === `admin-${tab}`
}
</script>

<style scoped>
/* Adicione estilos customizados se necessário */
</style>
