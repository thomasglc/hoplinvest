<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../stores/settings'
import { fetchETFPrice, clearPriceCache } from '../utils/etf-price'

const settings = useSettingsStore()
const router = useRouter()

const tickerInput = ref(settings.ticker)
const manualPriceInput = ref<number | ''>(settings.manualPrice ?? '')
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

function saveManualPrice() {
  const val = Number(manualPriceInput.value)
  settings.setManualPrice(val > 0 ? val : null)
}

function clearManualPrice() {
  manualPriceInput.value = ''
  settings.setManualPrice(null)
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
      <p v-if="settings.manualPrice" class="text-amber-400 text-xs mt-1">⚠ Prix manuel actif — le prix affiché est le vôtre</p>
    </div>

    <!-- Manual price override -->
    <div class="glass-card p-4">
      <label class="text-gray-400 text-xs uppercase tracking-widest block mb-2">Prix manuel (€) — optionnel</label>
      <div class="flex gap-2">
        <input
          v-model.number="manualPriceInput"
          type="number"
          min="0.0001"
          step="0.0001"
          placeholder="ex: 6.3892"
          class="flex-1 bg-transparent text-white text-base outline-none placeholder-gray-600"
        />
        <button
          @click="saveManualPrice"
          class="px-3 py-1 text-sm rounded-lg bg-violet-600/40 text-violet-300 hover:bg-violet-600/60 transition"
        >Sauver</button>
        <button
          v-if="settings.manualPrice"
          @click="clearManualPrice"
          class="px-3 py-1 text-sm rounded-lg bg-red-600/30 text-red-400 hover:bg-red-600/50 transition"
        >✕</button>
      </div>
      <p class="text-gray-600 text-xs mt-2">Utilisé si l'API Yahoo Finance est indisponible</p>
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
  </div>
</template>
