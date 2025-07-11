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
  /**
   * @deprecated Use generated types from src/api/generated instead
   * This interface will be removed after migration to openapi-zod-client generated types
   */
  interface Window {
    EventSource: typeof EventSource
  }
}
window.EventSource = Impl as unknown as typeof EventSource

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
