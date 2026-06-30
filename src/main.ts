import { createApp } from 'vue'
import { createPinia } from 'pinia'
import VueApexCharts from 'vue3-apexcharts'
import { router } from './router'
import App from './App.vue'
import './style.css'

// One-time cleanup: an earlier build registered a service worker (vite-plugin-pwa)
// that precached index.html and intercepted navigation, causing stale pages on
// devices that had already installed it. We no longer use a service worker — undo it.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(r => r.unregister())
  })
}
if ('caches' in window) {
  caches.keys().then(keys => keys.forEach(k => caches.delete(k)))
}

const pinia = createPinia()

createApp(App)
  .use(pinia)
  .use(router)
  .use(VueApexCharts)
  .mount('#app')
