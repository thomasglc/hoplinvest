import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const ticker = ref('WPEA.PA')
  const manualPrice = ref<number | null>(null)
  const lastFetchedPrice = ref<number | null>(null)
  const lastFetchedAt = ref<string | null>(null)

  const currentPrice = computed(() => manualPrice.value ?? lastFetchedPrice.value)

  function updatePrice(price: number): void {
    lastFetchedPrice.value = price
    lastFetchedAt.value = new Date().toISOString()
  }

  function setManualPrice(price: number | null): void {
    manualPrice.value = price
  }

  function setTicker(t: string): void {
    ticker.value = t
  }

  return { ticker, manualPrice, lastFetchedPrice, lastFetchedAt, currentPrice, updatePrice, setManualPrice, setTicker }
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error pinia-plugin-persistedstate types lag behind pinia v3
}, { persist: true })
