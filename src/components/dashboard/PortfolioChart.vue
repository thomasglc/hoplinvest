<script setup lang="ts">
import { ref, computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { useInvestmentsStore } from '../../stores/investments'
import { useSettingsStore } from '../../stores/settings'

const investments = useInvestmentsStore()
const settings = useSettingsStore()

type Period = 'all' | 'year' | 'quarter' | 'month'

const period = ref<Period>('all')

const FILTERS: { key: Period; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'year', label: 'Année' },
  { key: 'quarter', label: 'Trimestre' },
  { key: 'month', label: 'Mois' }
]

const now = new Date()
const currentYear = now.getFullYear()
const currentMonth = now.getMonth() + 1
const currentQuarter = Math.ceil(currentMonth / 3)

const pad = (n: number) => String(n).padStart(2, '0')

// Generate a complete month-by-month timeline for the selected period.
// Months without transactions carry forward the last known cumulative value
// so the chart shows a flat line instead of a gap.
const filteredData = computed(() => {
  const allData = investments.cumulativeChartData
  if (!allData.length) return []
  if (period.value === 'all') return allData

  let startMonth: number
  switch (period.value) {
    case 'year':    startMonth = 1; break
    case 'quarter': startMonth = (currentQuarter - 1) * 3 + 1; break
    case 'month':   startMonth = currentMonth; break
    default:        startMonth = 1
  }

  // All YYYY-MM keys from period start to today
  const keys: string[] = []
  let y = currentYear, m = startMonth
  while (y < currentYear || (y === currentYear && m <= currentMonth)) {
    keys.push(`${y}-${pad(m)}`)
    m++
    if (m > 12) { m = 1; y++ }
  }

  // For each month, carry forward the last known cumulative invested amount
  return keys
    .map(key => {
      const prior = allData.filter(d => d.x <= key)
      const invested = prior.length ? prior.at(-1)!.invested : 0
      return { x: key, invested }
    })
    .filter(d => d.invested > 0) // skip months before the first ever investment
})

const series = computed(() => {
  const data = filteredData.value
  if (!data.length) return []

  const investedSeries = data.map(d => ({ x: d.x, y: d.invested }))

  if (!settings.currentPrice || investments.totalInvested === 0) {
    return [{ name: 'Investi', data: investedSeries }]
  }

  const totalGain = investments.totalShares * settings.currentPrice - investments.totalInvested
  const latestInvested = investments.cumulativeChartData.at(-1)?.invested ?? 1

  const gainSeries = data.map(d => ({
    x: d.x,
    y: parseFloat(((d.invested / latestInvested) * totalGain).toFixed(2))
  }))

  return [
    { name: 'Investi', data: investedSeries },
    { name: 'Plus-value', data: gainSeries }
  ]
})

// Computed options so Y-axis min updates reactively with the filter
const options = computed((): ApexOptions => {
  const data = filteredData.value
  const minInvested = data.length ? Math.min(...data.map(d => d.invested)) : 0
  // For sub-'all' periods, zoom in on Y axis so variation is visible
  const yMin = period.value === 'all' ? 0 : Math.max(0, Math.floor(minInvested * 0.95))

  const yFormatter = (v: number) =>
    Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k€` : `${Math.round(v)}€`

  return {
    chart: {
      type: 'area',
      stacked: true,
      background: 'transparent',
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true, speed: 300 }
    },
    colors: ['#7c3aed', '#10b981'],
    fill: { type: 'gradient', gradient: { opacityFrom: 0.65, opacityTo: 0.08 } },
    stroke: { curve: 'smooth', width: 2 },
    xaxis: {
      type: 'category',
      labels: { style: { colors: '#6b7280', fontSize: '10px' } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      min: yMin,
      labels: { style: { colors: '#6b7280', fontSize: '10px' }, formatter: yFormatter }
    },
    grid: { borderColor: '#ffffff12' },
    legend: { labels: { colors: '#9ca3af' } },
    tooltip: { theme: 'dark', y: { formatter: (v: number) => `${v.toLocaleString('fr-FR')} €` } },
    dataLabels: { enabled: false }
  }
})
</script>

<template>
  <div class="glass-card p-4 mb-4">
    <div class="flex items-center justify-between mb-3">
      <p class="text-gray-400 text-[10px] uppercase tracking-widest">Évolution du portefeuille</p>
      <div class="flex gap-1">
        <button
          v-for="f in FILTERS"
          :key="f.key"
          @click="period = f.key"
          class="px-2 py-0.5 rounded-full text-[10px] font-semibold transition"
          :class="period === f.key
            ? 'bg-violet-600 text-white'
            : 'text-gray-500 hover:text-gray-300'"
        >{{ f.label }}</button>
      </div>
    </div>

    <!-- :key force le re-mount complet d'ApexCharts à chaque changement de filtre -->
    <VueApexCharts
      v-if="series.length"
      :key="period"
      type="area"
      height="180"
      :options="options"
      :series="series"
    />
    <p v-else class="text-gray-500 text-sm text-center py-10">
      {{ investments.cumulativeChartData.length
        ? 'Aucune transaction sur cette période'
        : 'Importe des transactions pour voir le graphique' }}
    </p>
  </div>
</template>
