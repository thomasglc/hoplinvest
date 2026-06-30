import { DIRECTUS_URL } from '../services/directus'

const FLOW_ID = '555b2ea8-4f07-43ad-8194-fb3e1146fd0b'
const CACHE_KEY = 'hoplinvest_price_cache'
const CACHE_TTL_MS = 15 * 60 * 1000

interface PriceCache {
  price: number
  fetchedAt: number
  ticker: string
}

export async function fetchETFPrice(ticker: string): Promise<number> {
  const cached = localStorage.getItem(CACHE_KEY)
  if (cached) {
    const parsed: PriceCache = JSON.parse(cached)
    if (parsed.ticker === ticker && Date.now() - parsed.fetchedAt < CACHE_TTL_MS) {
      return parsed.price
    }
  }

  const res = await fetch(`${DIRECTUS_URL}/flows/trigger/${FLOW_ID}?ticker=${encodeURIComponent(ticker)}`)
  if (!res.ok) throw new Error(`Flow HTTP ${res.status}`)
  const data = await res.json()
  const price = data?.price
  if (typeof price !== 'number') throw new Error('Invalid flow response')

  localStorage.setItem(CACHE_KEY, JSON.stringify({ price, fetchedAt: Date.now(), ticker }))
  return price
}

export function clearPriceCache(): void {
  localStorage.removeItem(CACHE_KEY)
}
