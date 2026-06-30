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

function inPeriod(key: string, p: Period): boolean {
  const [y, m] = key.split('-').map(Number)
  switch (p) {
    case 'all': return true
    case 'year': return y === currentYear
    case 'quarter': return y === currentYear && Math.ceil(m / 3) === currentQuarter
    case 'month': return y === currentYear && m === currentMonth
  }
}

const filteredData = computed(() =>
  investments.cumulativeChartData.filter(d => inPeriod(d.x, period.value))
)

const series = computed(() => {
  const data = filteredData.value
  if (!data.length) return []

  const investedSeries = data.map(d => ({ x: d.x, y: d.invested }))

  if (!settings.currentPrice || investments.totalInvested === 0) {
    return [{ name: 'Investi', data: investedSeries }]
  }

  const totalGain = investments.totalShares * settings.currentPrice - investments.totalInvested
  const latestInvested = investments.cumulativeChartData[investments.cumulativeChartData.length - 1]?.invested ?? 1

  const gainSeries = data.map(d => ({
    x: d.x,
    y: parseFloat(((d.invested / latestInvested) * totalGain).toFixed(2))
  }))

  return [
    { name: 'Investi', data: investedSeries },
    { name: 'Plus-value', data: gainSeries }
  ]
})

const options: ApexOptions = {
  chart: { type: 'area', stacked: true, background: 'transparent', toolbar: { show: false }, zoom: { enabled: false } },
  colors: ['#7c3aed', '#10b981'],
  fill: { type: 'gradient', gradient: { opacityFrom: 0.65, opacityTo: 0.08 } },
  stroke: { curve: 'smooth', width: 2 },
  xaxis: { type: 'category', labels: { style: { colors: '#6b7280', fontSize: '10px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
  yaxis: { labels: { style: { colors: '#6b7280', fontSize: '10px' }, formatter: (v: number) => `${(v / 1000).toFixed(0)}k€` } },
  grid: { borderColor: '#ffffff12' },
  legend: { labels: { colors: '#9ca3af' } },
  tooltip: { theme: 'dark', y: { formatter: (v: number) => `${v.toLocaleString('fr-FR')} €` } },
  dataLabels: { enabled: false }
}
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
    <VueApexCharts
      v-if="series.length"
      type="area"
      height="180"
      :options="options"
      :series="series"
    />
    <p v-else class="text-gray-500 text-sm text-center py-10">
      {{ investments.cumulativeChartData.length ? 'Aucune donnée sur cette période' : 'Importe des transactions pour voir le graphique' }}
    </p>
  </div>
</template>
