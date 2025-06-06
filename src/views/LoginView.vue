<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>Jobs Manager</h1>
        <p>Sign in with your credentials</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">Username</label>
          <input
            id="username"
            v-model="credentials.username"
            type="text"
            class="form-control"
            :class="{ 'error': hasError && !credentials.username }"
            placeholder="Enter your username"
            required
            autocomplete="username"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="credentials.password"
            type="password"
            class="form-control"
            :class="{ 'error': hasError && !credentials.password }"
            placeholder="Enter your password"
            required
            autocomplete="current-password"
          />
        </div>

        <div v-if="authStore.error" class="error-message">
          {{ authStore.error }}
        </div>

        <button
          type="submit"
          class="btn-login"
          :disabled="authStore.isLoading || !isFormValid"
        >
          <span v-if="authStore.isLoading">Signing in...</span>
          <span v-else>Sign In</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { LoginCredentials } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const credentials = ref<LoginCredentials>({
  username: '',
  password: ''
})

const hasError = ref(false)

const isFormValid = computed(() => {
  return credentials.value.username.trim() !== '' &&
         credentials.value.password.trim() !== ''
})

const handleLogin = async () => {
  hasError.value = false

  if (!isFormValid.value) {
    hasError.value = true
    return
  }

  const success = await authStore.login(credentials.value)

  if (success) {
    // Redirect to dashboard or intended route
    const redirectTo = router.currentRoute.value.query.redirect as string || '/dashboard'
    router.push(redirectTo)
  } else {
    hasError.value = true
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.login-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  padding: 3rem;
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header h1 {
  color: #1f2937;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.login-header p {
  color: #6b7280;
  font-size: 1rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.form-control {
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  outline: none;
}

.form-control:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-control.error {
  border-color: #ef4444;
}

.form-control::placeholder {
  color: #9ca3af;
}

.error-message {
  color: #ef4444;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 0.875rem;
  text-align: center;
}

.btn-login {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 1rem;
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 480px) {
  .login-card {
    padding: 2rem 1.5rem;
    margin: 1rem;
  }

  .login-header h1 {
    font-size: 1.75rem;
  }
}
</style>
