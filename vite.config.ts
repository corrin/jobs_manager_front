import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const allowedHosts = [
    'localhost',
    'msm-corrin-frontend.loca.lt',
    ...(env.VITE_ALLOWED_HOSTS ? env.VITE_ALLOWED_HOSTS.split(',').map((host) => host.trim()) : []),
  ]

  return {
    plugins: [vue(), tailwindcss()],
    resolve: {
      alias: {
        '@': `${path.resolve(__dirname, './src')}`,
        vue: 'vue/dist/vue.esm-bundler.js',
      },
    },
    server: {
      allowedHosts,
    },
  }
})
