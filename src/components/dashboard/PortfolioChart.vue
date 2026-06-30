<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { useInvestmentsStore } from '../../stores/investments'
import { useSettingsStore } from '../../stores/settings'

const investments = useInvestmentsStore()
const settings = useSettingsStore()

const series = computed(() => {
  const data = investments.cumulativeChartData
  if (!data.length) return []

  const investedSeries = data.map(d => ({ x: d.x, y: d.invested }))

  if (!settings.currentPrice || investments.totalInvested === 0) {
    return [{ name: 'Investi', data: investedSeries }]
  }

  const totalGain = investments.totalShares * settings.currentPrice - investments.totalInvested
  const latestInvested = data[data.length - 1].invested

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
    <p class="text-gray-400 text-[10px] uppercase tracking-widest mb-3">Évolution du portefeuille</p>
    <VueApexCharts
      v-if="series.length"
      type="area"
      height="180"
      :options="options"
      :series="series"
    />
    <p v-else class="text-gray-500 text-sm text-center py-10">
      Importe des transactions pour voir le graphique
    </p>
  </div>
</template>
