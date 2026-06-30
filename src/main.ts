import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPersistedstate from 'pinia-plugin-persistedstate'
import VueApexCharts from 'vue3-apexcharts'
import { router } from './router'
import App from './App.vue'
import './style.css'

const pinia = createPinia()
pinia.use(piniaPersistedstate)

createApp(App)
  .use(pinia)
  .use(router)
  .use(VueApexCharts)
  .mount('#app')
