import { createDirectus, rest, authentication } from '@directus/sdk'
import type { Transaction } from '../types'

const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL as string

// ── Directus schema types ────────────────────────────────────────────────────

interface DirectusTransaction {
  id: number
  user_created: string
  date_created: string
  date: string
  label: string
  quantity: number
  execution_price: number
  gross_amount: number
  brokerage: number
  net_amount: number
  currency: string
  source: 'csv' | 'manual'
}

interface DirectusUserSettings {
  id: number
  user_created: string
  ticker: string
  manual_price: number | null
  last_fetched_price: number | null
  last_fetched_at: string | null
}

interface Schema {
  transactions: DirectusTransaction[]
  user_settings: DirectusUserSettings[]
}

// ── Client ───────────────────────────────────────────────────────────────────

export const directus = createDirectus<Schema>(DIRECTUS_URL)
  .with(authentication('json'))
  .with(rest())

// ── Mappers ──────────────────────────────────────────────────────────────────

export function toTransaction(d: DirectusTransaction): Transaction {
  return {
    id: String(d.id),
    date: d.date,
    label: d.label,
    quantity: d.quantity,
    executionPrice: d.execution_price,
    grossAmount: d.gross_amount,
    brokerage: d.brokerage,
    netAmount: d.net_amount,
    currency: d.currency,
    source: d.source
  }
}

export function toDirectusTransaction(t: Transaction): Omit<DirectusTransaction, 'id' | 'user_created' | 'date_created'> {
  return {
    date: t.date,
    label: t.label,
    quantity: t.quantity,
    execution_price: t.executionPrice,
    gross_amount: t.grossAmount,
    brokerage: t.brokerage,
    net_amount: t.netAmount,
    currency: t.currency,
    source: t.source
  }
}

export type { DirectusUserSettings }
