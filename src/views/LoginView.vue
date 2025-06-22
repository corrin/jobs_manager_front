<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h1 class="text-3xl font-bold text-gray-900">Jobs Manager</h1>
        <p class="mt-2 text-gray-600">Sign in with your credentials</p>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700 mb-1"
              >Username</label
            >
            <input
              id="username"
              v-model="credentials.username"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              :class="{ 'border-red-500': hasError && !credentials.username }"
              placeholder="Enter your username"
              required
              autocomplete="username"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1"
              >Password</label
            >
            <input
              id="password"
              v-model="credentials.password"
              type="password"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              :class="{ 'border-red-500': hasError && !credentials.password }"
              placeholder="Enter your password"
              required
              autocomplete="current-password"
            />
          </div>

          <div
            v-if="error"
            class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm"
          >
            {{ error }}
          </div>

          <button
            type="submit"
            class="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isLoading || !isFormValid"
          >
            <span v-if="isLoading">Signing in...</span>
            <span v-else>Sign In</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLogin } from '@/composables/useLogin'

const { credentials, hasError, isFormValid, isLoading, error, handleLogin } = useLogin()
</script>
