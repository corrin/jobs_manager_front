import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import './plugins/axios'
import './plugins/ag-grid'

import './polyfills'
import { NativeEventSource, EventSourcePolyfill } from 'event-source-polyfill'

const Impl = NativeEventSource || EventSourcePolyfill

declare global {
  interface Window {
    EventSource: typeof EventSource
  }
}
window.EventSource = Impl as unknown as typeof EventSource

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)

// Set up ETag manager after Pinia is initialized
import { setupETagManager, setupJobReloadManager } from './api/client'
import { useJobETags } from './composables/useJobETags'
import { useJobsStore } from './stores/jobs'

// Initialize the ETag manager with the composable
const { getETag, setETag } = useJobETags()
setupETagManager({ getETag, setETag })

// Initialize the job reload manager with the store
const jobsStore = useJobsStore(pinia)
setupJobReloadManager({
  reloadJobOnConflict: (jobId: string) => jobsStore.reloadJobOnConflict(jobId),
})

app.mount('#app')
