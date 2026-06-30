export interface Transaction {
  id: string
  date: string           // YYYY-MM-DD
  label: string
  quantity: number
  executionPrice: number
  grossAmount: number    // négatif (achat)
  brokerage: number      // négatif ou 0
  netAmount: number      // négatif (achat)
  currency: string
  source: 'csv' | 'manual'
}

export interface MonthGroup {
  key: string            // YYYY-MM
  year: number
  month: number          // 1–12
  transactions: Transaction[]
  totalInvested: number  // somme |netAmount|
  totalBrokerage: number // somme |brokerage|
  totalShares: number    // somme quantity
}

export type MonthStatus = 'done' | 'missed' | 'current-pending' | 'future'
