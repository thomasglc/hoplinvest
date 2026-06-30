const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart'
const CORS_PROXY = 'https://api.allorigins.win/get?url='
const CACHE_KEY = 'hoplinvest_price_cache'
const CACHE_TTL_MS = 15 * 60 * 1000

interface PriceCache {
  price: number
  fetchedAt: number
  ticker: string
}

async function fetchDirect(ticker: string): Promise<number> {
  const res = await fetch(`${YAHOO_BASE}/${ticker}?interval=1d&range=1d`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice
  if (typeof price !== 'number') throw new Error('Invalid response shape')
  return price
}

async function fetchViaProxy(ticker: string): Promise<number> {
  const encoded = encodeURIComponent(`${YAHOO_BASE}/${ticker}?interval=1d&range=1d`)
  const res = await fetch(`${CORS_PROXY}${encoded}`)
  if (!res.ok) throw new Error(`Proxy HTTP ${res.status}`)
  const wrapper = await res.json()
  const data = JSON.parse(wrapper.contents)
  const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice
  if (typeof price !== 'number') throw new Error('Invalid proxy response shape')
  return price
}

export async function fetchETFPrice(ticker: string): Promise<number> {
  const cached = localStorage.getItem(CACHE_KEY)
  if (cached) {
    const parsed: PriceCache = JSON.parse(cached)
    if (parsed.ticker === ticker && Date.now() - parsed.fetchedAt < CACHE_TTL_MS) {
      return parsed.price
    }
  }
  let price: number
  try {
    price = await fetchDirect(ticker)
  } catch {
    price = await fetchViaProxy(ticker)
  }
  localStorage.setItem(CACHE_KEY, JSON.stringify({ price, fetchedAt: Date.now(), ticker }))
  return price
}

export function clearPriceCache(): void {
  localStorage.removeItem(CACHE_KEY)
}
