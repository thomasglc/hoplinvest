import { createRouter, createWebHashHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: DashboardView },
    { path: '/mois', component: () => import('../views/MonthsView.vue') },
    { path: '/ajouter', component: () => import('../views/AddView.vue') },
    { path: '/import', component: () => import('../views/ImportView.vue') },
    { path: '/config', component: () => import('../views/ConfigView.vue') }
  ]
})
