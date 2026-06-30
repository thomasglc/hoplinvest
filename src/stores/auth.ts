import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { readMe } from '@directus/sdk'
import { DIRECTUS_URL, getClient, saveToken, clearToken, getToken } from '../services/directus'

export const useAuthStore = defineStore('auth', () => {
  const userId = ref<string | null>(null)
  const userEmail = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!userId.value)

  async function login(email: string, password: string): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      // Use fetch directly — 100% visible in devtools, no composable magic
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
      saveToken(data.access_token)

      const me = await getClient(data.access_token).request(readMe())
      userId.value = me.id as string
      userEmail.value = me.email as string
      return true
    } catch (e) {
      error.value = 'Erreur de connexion — vérifie ta connexion internet'
      return false
    } finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    const token = getToken()
    if (token) {
      try {
        await fetch(`${DIRECTUS_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ refresh_token: token })
        })
      } catch { /* ignore */ }
    }
    clearToken()
    userId.value = null
    userEmail.value = null
  }

  async function restoreSession(): Promise<boolean> {
    const token = getToken()
    if (!token) return false
    try {
      const me = await getClient(token).request(readMe())
      userId.value = me.id as string
      userEmail.value = me.email as string
      return true
    } catch {
      clearToken()
      return false
    }
  }

  return { userId, userEmail, loading, error, isAuthenticated, login, logout, restoreSession }
})
