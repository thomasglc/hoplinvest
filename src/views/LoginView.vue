<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useInvestmentsStore } from '../stores/investments'
import { useSettingsStore } from '../stores/settings'

const router = useRouter()
const auth = useAuthStore()
const investments = useInvestmentsStore()
const settings = useSettingsStore()

const email = ref('')
const password = ref('')

async function submit() {
  const ok = await auth.login(email.value, password.value)
  if (ok) {
    await Promise.all([
      investments.fetchTransactions(),
      settings.fetchSettings()
    ])
    router.push('/')
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <p class="text-violet-400 text-xs font-bold uppercase tracking-widest mb-2">HoplInvest</p>
        <h1 class="text-white text-2xl font-black">Connexion</h1>
      </div>

      <form @submit.prevent="submit" class="space-y-3">
        <div class="glass-card p-4">
          <label class="text-gray-400 text-xs uppercase tracking-widest block mb-2">Email</label>
          <input
            v-model="email"
            type="email"
            required
            autocomplete="email"
            placeholder="ton@email.com"
            class="w-full bg-transparent text-white text-base outline-none placeholder-gray-700"
          />
        </div>

        <div class="glass-card p-4">
          <label class="text-gray-400 text-xs uppercase tracking-widest block mb-2">Mot de passe</label>
          <input
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            placeholder="••••••••"
            class="w-full bg-transparent text-white text-base outline-none placeholder-gray-700"
          />
        </div>

        <p v-if="auth.error" class="text-red-400 text-sm text-center">{{ auth.error }}</p>

        <button
          type="submit"
          :disabled="auth.loading"
          class="w-full py-4 rounded-2xl font-bold text-base bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50 transition"
        >
          {{ auth.loading ? 'Connexion…' : 'Se connecter' }}
        </button>
      </form>
    </div>
  </div>
</template>
