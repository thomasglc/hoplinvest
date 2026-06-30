import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createItem, readItems, updateItem } from '@directus/sdk'
import { apiRequest } from '../services/directus'
import type { DirectusUserSettings } from '../services/directus'

export const useSettingsStore = defineStore('settings', () => {
  const ticker = ref('WPEA.PA')
  const lastFetchedPrice = ref<number | null>(null)
  const lastFetchedAt = ref<string | null>(null)

  const _settingsId = ref<number | null>(null)

  const currentPrice = computed(() => lastFetchedPrice.value)

  // ── Directus sync ─────────────────────────────────────────────────────────

  async function fetchSettings(): Promise<void> {
    try {
      const items = await apiRequest<DirectusUserSettings[]>(readItems('user_settings', { limit: 1 }))
      if (items.length) {
        const s = items[0]
        _settingsId.value = s.id
        ticker.value = s.ticker ?? 'WPEA.PA'
        lastFetchedPrice.value = s.last_fetched_price ?? null
        lastFetchedAt.value = s.last_fetched_at ?? null
      }
    } catch { /* use defaults on error */ }
  }

  async function _saveSettings(): Promise<void> {
    const payload = {
      ticker: ticker.value,
      last_fetched_price: lastFetchedPrice.value,
      last_fetched_at: lastFetchedAt.value
    }
    if (_settingsId.value) {
      await apiRequest(updateItem('user_settings', _settingsId.value, payload))
    } else {
      const created = await apiRequest(createItem('user_settings', payload))
      _settingsId.value = (created as any).id
    }
  }

  function updatePrice(price: number): void {
    lastFetchedPrice.value = price
    lastFetchedAt.value = new Date().toISOString()
    _saveSettings().catch(() => {})
  }

  function setTicker(t: string): void {
    ticker.value = t
    _saveSettings().catch(() => {})
  }

  function clearLocal(): void {
    ticker.value = 'WPEA.PA'
    lastFetchedPrice.value = null
    lastFetchedAt.value = null
    _settingsId.value = null
  }

  return {
    ticker, lastFetchedPrice, lastFetchedAt, currentPrice,
    fetchSettings, updatePrice, setTicker, clearLocal
  }
})
