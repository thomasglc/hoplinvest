import { createApp } from 'vue'
import { createPinia } from 'pinia'
import VueApexCharts from 'vue3-apexcharts'
import { router } from './router'
import App from './App.vue'
import './style.css'

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
}

const pinia = createPinia()

createApp(App)
  .use(pinia)
  .use(router)
  .use(VueApexCharts)
  .mount('#app')
