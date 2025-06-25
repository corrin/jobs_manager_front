<template>
  <div class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm relative">
      <h3 class="text-lg font-bold mb-4">Confirmar exclusão</h3>
      <p>
        Tem certeza que deseja excluir <b>{{ staff?.first_name }} {{ staff?.last_name }}</b
        >?
      </p>
      <div class="flex justify-end gap-2 mt-6">
        <button type="button" class="btn" @click="$emit('close')">Cancelar</button>
        <button type="button" class="btn btn-error" @click="$emit('confirm')">Excluir</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Staff } from '@/types/staff'
defineProps<{ staff?: Staff }>()
</script>

<style scoped>
.btn {
  @apply px-3 py-1 rounded;
}
.btn-error {
  @apply bg-red-500 text-white;
}
</style>
