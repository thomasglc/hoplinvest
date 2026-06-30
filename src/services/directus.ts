import { createDirectus, rest, staticToken } from '@directus/sdk'
import type { Transaction } from '../types'

export const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL as string

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

// ── Token storage ─────────────────────────────────────────────────────────────

const KEY_ACCESS  = 'hoplinvest_token'
const KEY_REFRESH = 'hoplinvest_refresh'
const KEY_EXPIRES = 'hoplinvest_expires'  // timestamp ms when access_token expires

export function saveTokens(access: string, refresh: string, expiresMs: number) {
  localStorage.setItem(KEY_ACCESS,  access)
  localStorage.setItem(KEY_REFRESH, refresh)
  localStorage.setItem(KEY_EXPIRES, String(Date.now() + expiresMs))
}

export function clearToken() {
  localStorage.removeItem(KEY_ACCESS)
  localStorage.removeItem(KEY_REFRESH)
  localStorage.removeItem(KEY_EXPIRES)
}

export function getToken(): string | null {
  return localStorage.getItem(KEY_ACCESS)
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem(KEY_REFRESH)
  if (!refresh) return null
  try {
    const res = await fetch(`${DIRECTUS_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh, mode: 'json' })
    })
    if (!res.ok) return null
    const { data } = await res.json()
    saveTokens(data.access_token, data.refresh_token, data.expires)
    return data.access_token
  } catch {
    return null
  }
}

// Returns a valid access token, refreshing automatically if needed.
export async function getValidToken(): Promise<string | null> {
  const token   = localStorage.getItem(KEY_ACCESS)
  const expires = Number(localStorage.getItem(KEY_EXPIRES) || 0)

  // Refresh proactively 60 s before expiry
  if (!token || Date.now() > expires - 60_000) {
    return refreshAccessToken()
  }
  return token
}

// ── Client factory ────────────────────────────────────────────────────────────

export function getClient(token?: string) {
  const t = token ?? localStorage.getItem(KEY_ACCESS) ?? ''
  return createDirectus<Schema>(DIRECTUS_URL)
    .with(staticToken(t))
    .with(rest())
}

// Authenticated request with automatic token refresh.
export async function apiRequest<T>(command: Parameters<ReturnType<typeof getClient>['request']>[0]): Promise<T> {
  const token = await getValidToken()
  if (!token) throw new Error('Not authenticated')
  return getClient(token).request(command) as Promise<T>
}

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
