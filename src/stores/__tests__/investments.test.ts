import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useInvestmentsStore } from '../investments'
import type { Transaction } from '../../types'

function mockTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: crypto.randomUUID(),
    date: '2026-01-09',
    label: 'iShares',
    quantity: 241,
    executionPrice: 6.23,
    grossAmount: -1501.43,
    brokerage: -5.26,
    netAmount: -1506.69,
    currency: 'EUR',
    source: 'csv',
    ...overrides
  }
}

describe('investments store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('totalShares somme toutes les quantités', () => {
    const store = useInvestmentsStore()
    store.addTransaction(mockTx({ quantity: 241 }))
    store.addTransaction(mockTx({ quantity: 77 }))
    expect(store.totalShares).toBe(318)
  })

  it('totalInvested somme les |netAmount|', () => {
    const store = useInvestmentsStore()
    store.addTransaction(mockTx({ netAmount: -1506.69 }))
    store.addTransaction(mockTx({ netAmount: -479.71 }))
    expect(store.totalInvested).toBeCloseTo(1986.40, 1)
  })

  it('monthlyGroups regroupe par YYYY-MM', () => {
    const store = useInvestmentsStore()
    store.addTransaction(mockTx({ date: '2026-01-09' }))
    store.addTransaction(mockTx({ date: '2026-01-29' }))
    store.addTransaction(mockTx({ date: '2026-02-13' }))
    expect(store.monthlyGroups).toHaveLength(2)
    expect(store.monthlyGroups[0].key).toBe('2026-01')
    expect(store.monthlyGroups[0].transactions).toHaveLength(2)
  })

  it('getMonthStatus → done si transactions existantes', () => {
    const store = useInvestmentsStore()
    store.addTransaction(mockTx({ date: '2026-01-09' }))
    expect(store.getMonthStatus(2026, 1)).toBe('done')
  })

  it('getMonthStatus → missed si mois passé sans transactions', () => {
    const store = useInvestmentsStore()
    expect(store.getMonthStatus(2026, 1, new Date('2026-06-29'))).toBe('missed')
  })

  it('getMonthStatus → current-pending si mois courant sans transactions', () => {
    const store = useInvestmentsStore()
    expect(store.getMonthStatus(2026, 6, new Date('2026-06-29'))).toBe('current-pending')
  })

  it('getMonthStatus → future si mois à venir', () => {
    const store = useInvestmentsStore()
    expect(store.getMonthStatus(2026, 7, new Date('2026-06-29'))).toBe('future')
  })
})
