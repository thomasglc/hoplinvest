import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createItem, readItems, updateItem } from '@directus/sdk'
import { directus } from '../services/directus'

export const useSettingsStore = defineStore('settings', () => {
  const ticker = ref('WPEA.PA')
  const manualPrice = ref<number | null>(null)
  const lastFetchedPrice = ref<number | null>(null)
  const lastFetchedAt = ref<string | null>(null)

  // Directus row id for the user's settings record (upsert logic)
  const _settingsId = ref<number | null>(null)

  const currentPrice = computed(() => manualPrice.value ?? lastFetchedPrice.value)

  // ── Directus sync ─────────────────────────────────────────────────────────

  async function fetchSettings(): Promise<void> {
    try {
      const items = await directus.request(readItems('user_settings', { limit: 1 }))
      if (items.length) {
        const s = items[0]
        _settingsId.value = s.id
        ticker.value = s.ticker ?? 'WPEA.PA'
        manualPrice.value = s.manual_price ?? null
        lastFetchedPrice.value = s.last_fetched_price ?? null
        lastFetchedAt.value = s.last_fetched_at ?? null
      }
    } catch { /* use defaults on error */ }
  }

  async function _saveSettings(): Promise<void> {
    const payload = {
      ticker: ticker.value,
      manual_price: manualPrice.value,
      last_fetched_price: lastFetchedPrice.value,
      last_fetched_at: lastFetchedAt.value
    }
    if (_settingsId.value) {
      await directus.request(updateItem('user_settings', _settingsId.value, payload))
    } else {
      const created = await directus.request(createItem('user_settings', payload))
      _settingsId.value = (created as any).id
    }
  }

  function updatePrice(price: number): void {
    lastFetchedPrice.value = price
    lastFetchedAt.value = new Date().toISOString()
    _saveSettings().catch(() => {})
  }

  function setManualPrice(price: number | null): void {
    manualPrice.value = price
    _saveSettings().catch(() => {})
  }

  function setTicker(t: string): void {
    ticker.value = t
    _saveSettings().catch(() => {})
  }

  function clearLocal(): void {
    ticker.value = 'WPEA.PA'
    manualPrice.value = null
    lastFetchedPrice.value = null
    lastFetchedAt.value = null
    _settingsId.value = null
  }

  return {
    ticker, manualPrice, lastFetchedPrice, lastFetchedAt, currentPrice,
    fetchSettings, updatePrice, setManualPrice, setTicker, clearLocal
  }
})
