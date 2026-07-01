<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../stores/settings'
import { useAuthStore } from '../stores/auth'
import { fetchETFPrice, clearPriceCache } from '../utils/etf-price'
import { usePushNotifications } from '../composables/usePushNotifications'

const settings = useSettingsStore()
const auth = useAuthStore()
const router = useRouter()
const push = usePushNotifications()

async function logout() {
  await auth.logout()
  router.push('/login')
}

const tickerInput = ref(settings.ticker)
const refreshing = ref(false)
const refreshError = ref(false)

async function refreshPrice() {
  refreshing.value = true
  refreshError.value = false
  clearPriceCache()
  try {
    const price = await fetchETFPrice(settings.ticker)
    settings.updatePrice(price)
  } catch {
    refreshError.value = true
  } finally {
    refreshing.value = false
  }
}

function saveTicker() {
  settings.setTicker(tickerInput.value.trim() || 'WPEA.PA')
  clearPriceCache()
}

function fmtDatetime(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso))
}
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-white font-bold text-xl mb-6">Configuration</h1>

    <!-- ETF Ticker -->
    <div class="glass-card p-4">
      <label class="text-gray-400 text-xs uppercase tracking-widest block mb-2">Ticker Yahoo Finance</label>
      <div class="flex gap-2">
        <input
          v-model="tickerInput"
          type="text"
          placeholder="WPEA.PA"
          class="flex-1 bg-transparent text-white text-base outline-none placeholder-gray-600"
        />
        <button
          @click="saveTicker"
          class="px-3 py-1 text-sm rounded-lg bg-violet-600/40 text-violet-300 hover:bg-violet-600/60 transition"
        >Sauver</button>
      </div>
    </div>

    <!-- Live price refresh -->
    <div class="glass-card p-4">
      <div class="flex items-center justify-between mb-2">
        <div>
          <p class="text-gray-400 text-xs uppercase tracking-widest mb-0.5">Prix actuel</p>
          <p class="text-white font-bold text-xl">
            {{ settings.currentPrice ? `${settings.currentPrice.toFixed(4)} €` : '—' }}
          </p>
        </div>
        <button
          @click="refreshPrice"
          :disabled="refreshing"
          class="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 disabled:opacity-50 transition"
        >
          {{ refreshing ? '…' : '↻ Rafraîchir' }}
        </button>
      </div>
      <p v-if="refreshError" class="text-red-400 text-xs mt-1">Impossible de récupérer le prix</p>
      <p class="text-gray-600 text-xs">Dernière mise à jour : {{ fmtDatetime(settings.lastFetchedAt) }}</p>
    </div>

    <!-- Push notifications -->
    <div v-if="push.supported.value" class="glass-card p-4">
      <p class="text-gray-400 text-xs uppercase tracking-widest mb-3">Rappel hebdomadaire</p>
      <div v-if="push.status.value === 'subscribed'" class="flex items-center justify-between">
        <p class="text-green-400 text-sm">Notifications activées</p>
        <button @click="push.unsubscribe()" class="text-xs text-gray-500 hover:text-red-400 transition">Désactiver</button>
      </div>
      <div v-else-if="push.status.value === 'denied'" class="text-red-400 text-sm">
        Notifications bloquées — autorise-les dans les réglages Safari
      </div>
      <div v-else class="space-y-2">
        <p class="text-gray-300 text-sm">Reçois une notification chaque semaine si tu n'as pas encore enregistré d'investissement.</p>
        <button
          @click="push.subscribe()"
          :disabled="push.loading.value"
          class="w-full py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 disabled:opacity-50 transition"
        >
          {{ push.loading.value ? '…' : 'Activer les notifications' }}
        </button>
        <p v-if="push.error.value" class="text-red-400 text-xs">{{ push.error.value }}</p>
      </div>
    </div>

    <!-- Import link -->
    <button
      @click="router.push('/import')"
      class="w-full glass-card p-4 flex items-center gap-3 text-left hover:bg-white/5 transition rounded-2xl"
    >
      <span class="text-2xl">📂</span>
      <div>
        <p class="text-white font-medium text-sm">Importer un CSV</p>
        <p class="text-gray-500 text-xs">Relevé Boursobank au format tabulation</p>
      </div>
      <span class="ml-auto text-gray-500">›</span>
    </button>

    <!-- Logout -->
    <button
      @click="logout"
      class="w-full py-3 rounded-2xl border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition"
    >
      Se déconnecter
    </button>
  </div>
</template>
