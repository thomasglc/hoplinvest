import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { readMe } from '@directus/sdk'
import { directus } from '../services/directus'

// The authentication composable exposes .login()/.logout() directly on the client
const d = directus as any

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
      await d.login(email, password)
      const me = await directus.request(readMe())
      userId.value = me.id as string
      userEmail.value = me.email as string
      return true
    } catch {
      error.value = 'Email ou mot de passe incorrect'
      return false
    } finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    try { await d.logout() } catch { /* ignore */ }
    userId.value = null
    userEmail.value = null
  }

  async function restoreSession(): Promise<boolean> {
    try {
      // Attempt token refresh then read current user
      try { await d.refresh() } catch { /* no stored token */ }
      const me = await directus.request(readMe())
      userId.value = me.id as string
      userEmail.value = me.email as string
      return true
    } catch {
      return false
    }
  }

  return { userId, userEmail, loading, error, isAuthenticated, login, logout, restoreSession }
})
