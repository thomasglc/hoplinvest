import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import DashboardView from '../views/DashboardView.vue'
import LoginView from '../views/LoginView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/login', component: LoginView, meta: { public: true } },
    { path: '/', component: DashboardView },
    { path: '/mois', component: () => import('../views/MonthsView.vue') },
    { path: '/ajouter', component: () => import('../views/AddView.vue') },
    { path: '/import', component: () => import('../views/ImportView.vue') },
    { path: '/config', component: () => import('../views/ConfigView.vue') }
  ]
})

router.beforeEach(async (to) => {
  if (to.meta.public) return true
  const auth = useAuthStore()
  if (!auth.isAuthenticated) {
    // Try to restore session from stored token before redirecting
    const ok = await auth.restoreSession()
    if (!ok) return '/login'
  }
  return true
})
