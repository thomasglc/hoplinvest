<script setup lang="ts">
import { ref, computed } from 'vue'
import { useInvestmentsStore } from '../stores/investments'
import { usePrivacyMode } from '../composables/usePrivacyMode'
import type { MonthStatus } from '../types'

const investments = useInvestmentsStore()
const { hidden } = usePrivacyMode()
const selectedYear = ref(new Date().getFullYear())
const selectedMonth = ref<number | null>(null)

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
const MONTHS_FULL_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

const now = new Date()

function getStatus(month: number): MonthStatus {
  return investments.getMonthStatus(selectedYear.value, month, now)
}

function monthData(month: number) {
  const key = `${selectedYear.value}-${String(month).padStart(2, '0')}`
  return investments.monthlyGroups.find(g => g.key === key) ?? null
}

function statusStyle(status: MonthStatus): string {
  switch (status) {
    case 'done': return 'border-emerald-500/50 bg-emerald-500/10'
    case 'missed': return 'border-red-500/40 bg-red-500/10'
    case 'current-pending': return 'border-amber-500/50 bg-amber-500/10'
    case 'future': return 'border-white/8 bg-white/4'
  }
}

function statusTextColor(status: MonthStatus): string {
  switch (status) {
    case 'done': return 'text-emerald-400'
    case 'missed': return 'text-red-400'
    case 'current-pending': return 'text-amber-400'
    case 'future': return 'text-gray-600'
  }
}

function statusIcon(status: MonthStatus): string {
  switch (status) {
    case 'done': return '✓'
    case 'missed': return '✗'
    case 'current-pending': return '⋯'
    case 'future': return '·'
  }
}

function selectMonth(month: number) {
  selectedMonth.value = selectedMonth.value === month ? null : month
}

const selectedDetail = computed(() => {
  if (selectedMonth.value === null) return null
  return monthData(selectedMonth.value)
})

function fmtEur(val: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val)
}

function fmtDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

const mask = '••••'
</script>

<template>
  <div class="flex flex-col" style="min-height: calc(100svh - 7.5rem)">
    <!-- Year selector -->
    <div class="flex items-center justify-between mb-6 shrink-0">
      <button
        @click="selectedYear--; selectedMonth = null"
        class="w-9 h-9 flex items-center justify-center rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition text-lg"
      >‹</button>
      <span class="text-white font-bold text-lg tracking-wide">{{ selectedYear }}</span>
      <button
        @click="selectedYear++; selectedMonth = null"
        class="w-9 h-9 flex items-center justify-center rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition text-lg"
      >›</button>
    </div>

    <!-- 4×3 grid -->
    <div
      class="grid grid-cols-4 gap-2 mb-4"
      :class="selectedMonth === null ? 'flex-1 grid-rows-3' : 'shrink-0'"
    >
      <button
        v-for="m in 12"
        :key="m"
        @click="selectMonth(m)"
        class="relative flex flex-col items-center justify-center px-1 rounded-xl border transition"
        :class="[
          statusStyle(getStatus(m)),
          selectedMonth === m ? 'py-3' : 'py-0',
          selectedMonth === m ? 'ring-2 ring-violet-500/70' : ''
        ]"
      >
        <span class="text-white/90 text-base font-bold">{{ MONTHS_FR[m - 1] }}</span>
        <span class="text-2xl leading-tight" :class="statusTextColor(getStatus(m))">{{ statusIcon(getStatus(m)) }}</span>
        <span class="text-xs font-semibold text-white/60 truncate w-full text-center mt-1">
          {{ hidden ? mask : (monthData(m) ? fmtEur(monthData(m)!.totalInvested).replace(' ', '').replace(' €', '€') : '—') }}
        </span>
      </button>
    </div>

    <!-- Month detail panel -->
    <Transition name="slide-up">
      <div v-if="selectedMonth !== null" class="flex-1 min-h-0">
        <div v-if="selectedDetail" class="glass-card p-4 h-full overflow-y-auto">
          <p class="text-violet-300 text-sm font-bold mb-3">
            {{ MONTHS_FULL_FR[selectedMonth! - 1] }} {{ selectedYear }}
          </p>

          <!-- Transaction list -->
          <div class="space-y-2 mb-3">
            <div
              v-for="tx in selectedDetail.transactions"
              :key="tx.id"
              class="flex items-center justify-between py-2 border-b border-white/6"
            >
              <div>
                <p class="text-white text-sm">
                  {{ fmtDate(tx.date) }} · {{ hidden ? mask : `${tx.quantity} parts · ${tx.executionPrice.toFixed(4)} €` }}
                </p>
                <p v-if="tx.brokerage" class="text-gray-500 text-xs">
                  Courtage {{ hidden ? mask : fmtEur(Math.abs(tx.brokerage)) }}
                </p>
              </div>
              <p class="text-white font-semibold text-sm">{{ hidden ? mask : fmtEur(Math.abs(tx.netAmount)) }}</p>
            </div>
          </div>

          <!-- Month totals -->
          <div class="flex justify-between items-center pt-1">
            <span class="text-gray-400 text-xs">Total {{ MONTHS_FULL_FR[selectedMonth! - 1] }}</span>
            <span class="text-white font-bold">{{ hidden ? mask : fmtEur(selectedDetail.totalInvested) }}</span>
          </div>
          <div v-if="selectedDetail.totalBrokerage" class="flex justify-between items-center mt-1">
            <span class="text-gray-500 text-xs">Courtage total</span>
            <span class="text-gray-400 text-xs">{{ hidden ? mask : fmtEur(selectedDetail.totalBrokerage) }}</span>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="glass-card p-6 text-center h-full flex items-center justify-center">
          <p class="text-gray-400 text-sm">Aucune transaction pour {{ MONTHS_FULL_FR[selectedMonth! - 1] }} {{ selectedYear }}</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.25s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
