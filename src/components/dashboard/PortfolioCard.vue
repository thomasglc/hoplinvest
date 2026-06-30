<script setup lang="ts">
import { computed } from 'vue'
import { useInvestmentsStore } from '../../stores/investments'
import { useSettingsStore } from '../../stores/settings'

const investments = useInvestmentsStore()
const settings = useSettingsStore()

const portfolioValue = computed(() =>
  settings.currentPrice ? investments.totalShares * settings.currentPrice : null
)

const unrealizedGain = computed(() =>
  portfolioValue.value !== null ? portfolioValue.value - investments.totalInvested : null
)

const gainPercent = computed(() =>
  unrealizedGain.value !== null && investments.totalInvested > 0
    ? (unrealizedGain.value / investments.totalInvested) * 100
    : null
)

function fmt(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
}
</script>

<template>
  <div class="glass-card p-5 mb-4">
    <p class="text-gray-400 text-xs mb-1 uppercase tracking-widest">Valeur du portefeuille</p>
    <p class="text-white font-black tracking-tight" style="font-size: 2.25rem; line-height: 1;">
      {{ portfolioValue !== null ? fmt(portfolioValue) : '—' }}
    </p>
    <p
      v-if="unrealizedGain !== null"
      class="mt-2 text-sm font-semibold"
      :class="unrealizedGain >= 0 ? 'text-emerald-400' : 'text-red-400'"
    >
      {{ unrealizedGain >= 0 ? '+' : '' }}{{ fmt(unrealizedGain) }}
      <span class="opacity-75"> · {{ gainPercent?.toFixed(2) }}%</span>
    </p>
    <p v-else class="mt-2 text-xs text-gray-500">
      Configure le prix ETF pour voir la plus-value
    </p>
  </div>
</template>
