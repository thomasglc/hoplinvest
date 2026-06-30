<script setup lang="ts">
import { computed } from 'vue'
import PriceChip from '../components/dashboard/PriceChip.vue'
import PortfolioCard from '../components/dashboard/PortfolioCard.vue'
import StatsCards from '../components/dashboard/StatsCards.vue'
import PortfolioChart from '../components/dashboard/PortfolioChart.vue'
import { useInvestmentsStore } from '../stores/investments'

const investments = useInvestmentsStore()
const now = new Date()
const currentMonthAlert = computed(() =>
  investments.getMonthStatus(now.getFullYear(), now.getMonth() + 1) === 'current-pending'
)
</script>

<template>
  <div class="flex flex-col" style="min-height: calc(100svh - 7.5rem)">
    <div class="flex items-center justify-between mb-6">
      <span class="text-violet-300 text-xs font-bold uppercase tracking-widest">HoplInvest</span>
      <PriceChip />
    </div>
    <div
      v-if="currentMonthAlert"
      class="mb-4 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm"
    >
      ⚠️ Aucun investissement ce mois-ci
    </div>
    <PortfolioCard />
    <StatsCards />
    <PortfolioChart class="flex-1 min-h-0" />
  </div>
</template>
