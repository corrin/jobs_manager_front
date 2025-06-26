import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import './plugins/axios'
import './plugins/ag-grid'

import './polyfills'
import { NativeEventSource, EventSourcePolyfill } from 'event-source-polyfill'

// escolhe implementação nativa ou polyfill
const Impl = NativeEventSource || EventSourcePolyfill

if (typeof window !== 'undefined') {
  ;(window as { EventSource: typeof EventSource }).EventSource = Impl as typeof EventSource
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
