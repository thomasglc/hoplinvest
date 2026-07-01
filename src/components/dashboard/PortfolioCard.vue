<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useInvestmentsStore } from '../../stores/investments'
import { useSettingsStore } from '../../stores/settings'
import { usePrivacyMode } from '../../composables/usePrivacyMode'

const investments = useInvestmentsStore()
const settings = useSettingsStore()
const { hidden, toggle } = usePrivacyMode()

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
    <div class="flex items-center justify-between mb-1">
      <p class="text-gray-400 text-xs uppercase tracking-widest">Valeur du portefeuille</p>
      <button @click="toggle" class="text-gray-500 hover:text-gray-300 transition-colors">
        <Icon :icon="hidden ? 'ion:eye-off-outline' : 'ion:eye-outline'" class="text-[18px]" />
      </button>
    </div>
    <p class="text-white font-black tracking-tight" style="font-size: 2.25rem; line-height: 1;">
      {{ hidden ? '••••••' : (portfolioValue !== null ? fmt(portfolioValue) : '—') }}
    </p>
    <p
      v-if="unrealizedGain !== null"
      class="mt-2 text-sm font-semibold"
      :class="unrealizedGain >= 0 ? 'text-emerald-400' : 'text-red-400'"
    >
      <span v-if="!hidden">{{ unrealizedGain >= 0 ? '+' : '' }}{{ fmt(unrealizedGain) }} · </span>
      {{ gainPercent?.toFixed(2) }}%
    </p>
    <p v-else class="mt-2 text-xs text-gray-500">
      Configure le prix ETF pour voir la plus-value
    </p>
  </div>
</template>
