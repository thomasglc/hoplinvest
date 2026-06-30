<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSettingsStore } from '../../stores/settings'
import { fetchETFPrice } from '../../utils/etf-price'

const settings = useSettingsStore()
const loading = ref(false)
const error = ref(false)

async function refresh() {
  loading.value = true
  error.value = false
  try {
    const price = await fetchETFPrice(settings.ticker)
    settings.updatePrice(price)
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(refresh)
</script>

<template>
  <button
    @click="refresh"
    class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-violet-500/40 bg-violet-500/15 text-violet-300 text-xs font-semibold transition hover:bg-violet-500/25 active:scale-95"
    :class="{ 'opacity-50 pointer-events-none': loading }"
  >
    <span v-if="loading" class="animate-spin inline-block">⏳</span>
    <span v-else-if="error">❌</span>
    <span v-else>{{ settings.ticker }}</span>
    <span v-if="settings.currentPrice"> {{ settings.currentPrice.toFixed(4) }} €</span>
    <span v-else-if="!loading" class="text-gray-500"> —</span>
  </button>
</template>
