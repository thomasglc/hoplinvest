import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { readMe } from '@directus/sdk'
import { DIRECTUS_URL, apiRequest, saveTokens, clearToken, getValidToken } from '../services/directus'

export const useAuthStore = defineStore('auth', () => {
  const userId    = ref<string | null>(null)
  const userEmail = ref<string | null>(null)
  const loading   = ref(false)
  const error     = ref<string | null>(null)

  const isAuthenticated = computed(() => !!userId.value)

  async function login(email: string, password: string): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${DIRECTUS_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      if (!res.ok) {
        error.value = 'Email ou mot de passe incorrect'
        return false
      }
      const { data } = await res.json()
      saveTokens(data.access_token, data.refresh_token, data.expires)

      const me = await apiRequest<{ id: string; email: string }>(readMe())
      userId.value    = me.id
      userEmail.value = me.email
      return true
    } catch {
      error.value = 'Erreur de connexion — vérifie ta connexion internet'
      return false
    } finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    const refresh = localStorage.getItem('hoplinvest_refresh')
    if (refresh) {
      try {
        await fetch(`${DIRECTUS_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refresh })
        })
      } catch { /* ignore */ }
    }
    clearToken()
    userId.value    = null
    userEmail.value = null
  }

  async function restoreSession(): Promise<boolean> {
    // getValidToken() will auto-refresh if access token is expired
    const token = await getValidToken()
    if (!token) return false
    try {
      const me = await apiRequest<{ id: string; email: string }>(readMe())
      userId.value    = me.id
      userEmail.value = me.email
      return true
    } catch {
      clearToken()
      return false
    }
  }

  return { userId, userEmail, loading, error, isAuthenticated, login, logout, restoreSession }
})
