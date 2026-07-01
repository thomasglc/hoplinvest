<script setup lang="ts">
import { useInvestmentsStore } from '../../stores/investments'
import { usePrivacyMode } from '../../composables/usePrivacyMode'

const investments = useInvestmentsStore()
const { hidden } = usePrivacyMode()

function fmt(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
}
</script>

<template>
  <div class="grid grid-cols-2 gap-3 mb-4">
    <div class="glass-card p-4">
      <p class="text-gray-400 text-[10px] uppercase tracking-widest mb-1">Total investi</p>
      <p class="text-white text-lg font-bold">{{ hidden ? '••••••' : fmt(investments.totalInvested) }}</p>
    </div>
    <div class="glass-card p-4">
      <p class="text-gray-400 text-[10px] uppercase tracking-widest mb-1">Parts totales</p>
      <p class="text-white text-lg font-bold">{{ hidden ? '••••' : Math.round(investments.totalShares).toLocaleString('fr-FR') }}</p>
    </div>
  </div>
</template>
