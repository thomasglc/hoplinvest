<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { useInvestmentsStore } from '../../stores/investments'
import { useSettingsStore } from '../../stores/settings'
import { usePrivacyMode } from '../../composables/usePrivacyMode'

const investments = useInvestmentsStore()
const settings = useSettingsStore()
const { hidden } = usePrivacyMode()

// Debounce the price used in the chart so an incoming HTTP response
// doesn't interrupt the initial draw animation (speed: 900ms).
const chartPrice = ref<number | null>(settings.currentPrice)
let priceTimer: ReturnType<typeof setTimeout> | null = null
watch(() => settings.currentPrice, (newPrice) => {
  if (priceTimer) clearTimeout(priceTimer)
  priceTimer = setTimeout(() => { chartPrice.value = newPrice }, 1050)
})

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
const todayLabel = now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

const pad = (n: number) => String(n).padStart(2, '0')

function buildMonthKeys(startMonth: number): string[] {
  const keys: string[] = []
  let y = currentYear, m = startMonth
  while (y < currentYear || (y === currentYear && m <= currentMonth)) {
    keys.push(`${y}-${pad(m)}`)
    m++
    if (m > 12) { m = 1; y++ }
  }
  return keys
}

// Generate a complete month-by-month timeline for the selected period.
// Always appends a "today" point at the end using the live price so the chart
// always reaches today, even if the last investment was months ago.
const filteredData = computed(() => {
  const allData = investments.cumulativeChartData
  if (!allData.length) return []

  const currentPrice = chartPrice.value ?? 0

  let base: typeof allData
  if (period.value === 'all') {
    base = allData
  } else {
    let startMonth: number
    switch (period.value) {
      case 'year':    startMonth = 1; break
      case 'quarter': startMonth = (currentQuarter - 1) * 3 + 1; break
      case 'month':   startMonth = currentMonth; break
      default:        startMonth = 1
    }
    base = buildMonthKeys(startMonth)
      .map(key => {
        const actual = allData.find(d => d.x === key)
        if (actual) return actual
        const last = allData.filter(d => d.x <= key).at(-1)
        return { x: key, invested: last?.invested ?? 0, shares: last?.shares ?? 0, avgPrice: currentPrice }
      })
      .filter(d => d.invested > 0)
  }

  // Always append a "today" point with the live price
  const last = base.at(-1)
  if (!last || !currentPrice) return base
  const todayPoint = { x: todayLabel, invested: last.invested, shares: last.shares, avgPrice: currentPrice }
  // Don't duplicate if last point is already "today"
  if (last.x === todayLabel) return base
  return [...base, todayPoint]
})

const series = computed(() => {
  const data = filteredData.value
  if (!data.length) return []

  const investedSeries = data.map(d => ({ x: d.x, y: d.invested }))

  if (!chartPrice.value || investments.totalInvested === 0) {
    return [{ name: 'Investi', data: investedSeries }]
  }

  // Real gain at each point: cumulative_shares × price_at_that_month − cumulative_invested
  // price_at_that_month = weighted avg execution price of that month's transactions (= real ETF price)
  // For carry-forward months (no transactions): currentPrice is used instead
  const gainSeries = data.map(d => ({
    x: d.x,
    y: parseFloat(Math.max(0, d.shares * d.avgPrice - d.invested).toFixed(2))
  }))

  const hasGain = gainSeries.some(p => p.y > 0)
  if (!hasGain) return [{ name: 'Investi', data: investedSeries }]

  return [
    { name: 'Investi', data: investedSeries },
    { name: 'Plus-value', data: gainSeries }
  ]
})

// Computed options so Y-axis min updates reactively with the filter
const options = computed((): ApexOptions => {
  const data = filteredData.value
  const minInvested = data.length ? Math.min(...data.map(d => d.invested)) : 0
  // Always zoom Y axis so the curve fills the chart — prevents the "spring from bottom" animation glitch
  const yMin = Math.max(0, Math.floor(minInvested * 0.90))

  const yFormatter = (v: number) =>
    hidden.value ? '••••' : (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k€` : `${Math.round(v)}€`)

  return {
    chart: {
      type: 'area',
      stacked: true,
      background: 'transparent',
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: {
        enabled: true,
        speed: 900,
        animateGradually: { enabled: false },
        dynamicAnimation: { enabled: true, speed: 600 }
      }
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
    tooltip: { enabled: !hidden.value, theme: 'dark', y: { formatter: (v: number) => `${v.toLocaleString('fr-FR')} €` } },
    dataLabels: { enabled: false }
  }
})
</script>

<template>
  <div class="glass-card p-4 mb-4 flex flex-col h-full">
    <div class="flex items-center justify-between mb-3 shrink-0">
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
    <div class="flex-1 min-h-0">
      <VueApexCharts
        v-if="series.length"
        :key="period"
        type="area"
        height="100%"
        :options="options"
        :series="series"
      />
      <p v-else class="text-gray-500 text-sm text-center py-10">
        {{ investments.cumulativeChartData.length
          ? 'Aucune transaction sur cette période'
          : 'Importe des transactions pour voir le graphique' }}
      </p>
    </div>
  </div>
</template>
