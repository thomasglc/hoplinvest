import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  createItem, createItems, readItems, deleteItem
} from '@directus/sdk'
import { apiRequest, toTransaction, toDirectusTransaction } from '../services/directus'
import type { Transaction, MonthGroup, MonthStatus } from '../types'

export const useInvestmentsStore = defineStore('investments', () => {
  const transactions = ref<Transaction[]>([])
  const loadingData = ref(false)

  // ── Computed ──────────────────────────────────────────────────────────────

  const totalShares = computed(() =>
    transactions.value.reduce((sum, t) => sum + t.quantity, 0)
  )

  const totalInvested = computed(() =>
    transactions.value.reduce((sum, t) => sum + Math.abs(t.netAmount), 0)
  )

  const monthlyGroups = computed((): MonthGroup[] => {
    const map = new Map<string, Transaction[]>()
    for (const t of transactions.value) {
      const key = t.date.slice(0, 7)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    }
    return Array.from(map.entries())
      .map(([key, txs]) => ({
        key,
        year: parseInt(key.slice(0, 4)),
        month: parseInt(key.slice(5, 7)),
        transactions: txs,
        totalInvested: txs.reduce((s, t) => s + Math.abs(t.netAmount), 0),
        totalBrokerage: txs.reduce((s, t) => s + Math.abs(t.brokerage), 0),
        totalShares: txs.reduce((s, t) => s + t.quantity, 0)
      }))
      .sort((a, b) => a.key.localeCompare(b.key))
  })

  const cumulativeChartData = computed(() => {
    let cumInvested = 0
    let cumShares = 0
    return monthlyGroups.value.map(g => {
      cumInvested += g.totalInvested
      cumShares += g.totalShares
      const weightedAvgPrice = g.totalShares > 0
        ? g.transactions.reduce((s, t) => s + t.quantity * t.executionPrice, 0) / g.totalShares
        : 0
      return {
        x: g.key,
        invested: parseFloat(cumInvested.toFixed(2)),
        shares: cumShares,
        avgPrice: parseFloat(weightedAvgPrice.toFixed(4))
      }
    })
  })

  function getMonthStatus(year: number, month: number, now: Date = new Date()): MonthStatus {
    const key = `${year}-${String(month).padStart(2, '0')}`
    if (monthlyGroups.value.some(g => g.key === key)) return 'done'
    const target = new Date(year, month - 1, 1)
    const current = new Date(now.getFullYear(), now.getMonth(), 1)
    if (target > current) return 'future'
    if (target.getTime() === current.getTime()) return 'current-pending'
    return 'missed'
  }

  // ── Directus actions ──────────────────────────────────────────────────────

  async function fetchTransactions(): Promise<void> {
    loadingData.value = true
    try {
      const items = await apiRequest(
        readItems('transactions', {
          sort: ['date'],
          limit: -1
        })
      )
      transactions.value = (items as any[]).map(toTransaction)
    } finally {
      loadingData.value = false
    }
  }

  async function addTransaction(tx: Transaction): Promise<void> {
    const created = await apiRequest(
      createItem('transactions', toDirectusTransaction(tx))
    )
    transactions.value.push(toTransaction(created as any))
  }

  async function addTransactions(txs: Transaction[]): Promise<void> {
    if (!txs.length) return
    const created = await apiRequest(
      createItems('transactions', txs.map(toDirectusTransaction))
    )
    transactions.value.push(...(created as any[]).map(toTransaction))
  }

  async function removeTransaction(id: string): Promise<void> {
    await apiRequest(deleteItem('transactions', Number(id)))
    transactions.value = transactions.value.filter(t => t.id !== id)
  }

  function clearLocal(): void {
    transactions.value = []
  }

  return {
    transactions,
    loadingData,
    totalShares,
    totalInvested,
    monthlyGroups,
    cumulativeChartData,
    getMonthStatus,
    fetchTransactions,
    addTransaction,
    addTransactions,
    removeTransaction,
    clearLocal
  }
})
