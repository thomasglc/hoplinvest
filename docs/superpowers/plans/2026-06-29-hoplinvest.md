# HoplInvest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Vue 3 PWA for tracking monthly ETF investments with real-time price, stacked-area portfolio chart, monthly grid view, manual entry, and CSV import.

**Architecture:** Vue 3 + Vite SPA with Pinia stores persisted to localStorage. Pure utility functions handle CSV parsing and brokerage calculations (TDD). ApexCharts renders the stacked-area portfolio chart. Yahoo Finance API (with CORS proxy fallback) provides live ETF prices. Bottom-tab navigation, dark glassmorphism design (primary `#7c3aed`).

**Tech Stack:** Vue 3, Vite 6, TypeScript, Tailwind CSS v4 (@tailwindcss/vite), Pinia 2 + pinia-plugin-persistedstate, Vue Router 4, ApexCharts + vue3-apexcharts, vite-plugin-pwa, Vitest 2 + @vue/test-utils + jsdom

---

## File Map

```
hoplinvest/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── public/
│   ├── icon.svg                          ← PWA icon (SVG)
├── src/
│   ├── main.ts                           ← App bootstrap
│   ├── App.vue                           ← Root: layout + RouterView
│   ├── style.css                         ← Tailwind + glass-card utility
│   ├── router/
│   │   └── index.ts                      ← Vue Router config
│   ├── types/
│   │   └── index.ts                      ← Transaction, MonthGroup, MonthStatus
│   ├── utils/
│   │   ├── id.ts                         ← generateId (crypto.randomUUID)
│   │   ├── brokerage.ts                  ← calculateBrokerage, calculateTransaction
│   │   ├── csv-parser.ts                 ← parseCSV, deduplicateTransactions
│   │   ├── etf-price.ts                  ← fetchETFPrice (Yahoo Finance + proxy)
│   │   └── __tests__/
│   │       ├── brokerage.test.ts
│   │       └── csv-parser.test.ts
│   ├── stores/
│   │   ├── investments.ts                ← transactions, getters, getMonthStatus
│   │   ├── settings.ts                   ← ticker, prices, currentPrice
│   │   └── __tests__/
│   │       └── investments.test.ts
│   ├── components/
│   │   ├── layout/
│   │   │   └── BottomNav.vue
│   │   └── dashboard/
│   │       ├── PriceChip.vue
│   │       ├── PortfolioCard.vue
│   │       ├── StatsCards.vue
│   │       └── PortfolioChart.vue
│   │   └── months/
│   │       ├── MonthCard.vue
│   │       └── MonthDetail.vue
│   └── views/
│       ├── DashboardView.vue
│       ├── MonthsView.vue
│       ├── AddView.vue
│       ├── ImportView.vue
│       └── ConfigView.vue
```

---

## Task 1: Project scaffold

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `src/style.css`
- Create: `public/icon.svg`

- [ ] **Step 1: Initialise le projet Vite Vue TS**

```bash
cd C:/Users/thoma/Documents/Claude/hoplinvest
npm create vite@latest . -- --template vue-ts
```

- [ ] **Step 2: Installe toutes les dépendances**

```bash
npm install pinia pinia-plugin-persistedstate vue-router@4 apexcharts vue3-apexcharts
npm install -D tailwindcss @tailwindcss/vite vite-plugin-pwa
npm install -D vitest @vue/test-utils jsdom @vitest/coverage-v8
```

- [ ] **Step 3: Remplace `vite.config.ts`**

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'HoplInvest',
        short_name: 'HoplInvest',
        theme_color: '#7c3aed',
        background_color: '#0f0c29',
        display: 'standalone',
        icons: [
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
      }
    })
  ],
  test: {
    environment: 'jsdom',
    globals: true
  }
})
```

- [ ] **Step 4: Remplace `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 5: Crée `src/style.css`**

```css
@import "tailwindcss";

body {
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  min-height: 100vh;
  color: white;
  font-family: system-ui, -apple-system, sans-serif;
}

.glass-card {
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  border-radius: 16px;
}
```

- [ ] **Step 6: Crée `public/icon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
  <rect width="192" height="192" rx="40" fill="#7c3aed"/>
  <text x="96" y="130" font-size="100" text-anchor="middle" fill="white">📈</text>
</svg>
```

- [ ] **Step 7: Remplace `index.html`**

```html
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/icon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#7c3aed" />
    <title>HoplInvest</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 8: Vérifie que `npm run dev` démarre sans erreur**

```bash
npm run dev
```
Attendu : serveur Vite actif sur `http://localhost:5173`

- [ ] **Step 9: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold Vue 3 + Vite + Tailwind + PWA + Vitest"
```

---

## Task 2: Types partagés

**Files:**
- Create: `src/types/index.ts`
- Create: `src/utils/id.ts`

- [ ] **Step 1: Crée `src/types/index.ts`**

```ts
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
```

- [ ] **Step 2: Crée `src/utils/id.ts`**

```ts
export function generateId(): string {
  return crypto.randomUUID()
}
```

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts src/utils/id.ts
git commit -m "feat: add shared types and id utility"
```

---

## Task 3: Utilitaire courtage (TDD)

**Files:**
- Create: `src/utils/brokerage.ts`
- Create: `src/utils/__tests__/brokerage.test.ts`

- [ ] **Step 1: Crée le test `src/utils/__tests__/brokerage.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { calculateBrokerage, calculateTransaction } from '../brokerage'

describe('calculateBrokerage', () => {
  it('retourne 0 quand |montant| <= 500', () => {
    expect(calculateBrokerage(-100)).toBe(0)
    expect(calculateBrokerage(-498.31)).toBe(0)
    expect(calculateBrokerage(-500)).toBe(0)
  })

  it('applique 0,35% quand |montant| > 500', () => {
    expect(calculateBrokerage(-9498.19)).toBeCloseTo(-33.24, 1)
    expect(calculateBrokerage(-1496.87)).toBeCloseTo(-5.24, 1)
    expect(calculateBrokerage(-1479.16)).toBeCloseTo(-5.18, 1)
  })
})

describe('calculateTransaction', () => {
  it('calcule le montant brut comme -(quantité × prix)', () => {
    const result = calculateTransaction(82, 6.0769)
    expect(result.grossAmount).toBeCloseTo(-498.31, 1)
  })

  it('aucun courtage si montant brut <= 500€', () => {
    const result = calculateTransaction(82, 6.0769)
    expect(result.brokerage).toBe(0)
    expect(result.netAmount).toBeCloseTo(-498.31, 1)
  })

  it('courtage 0,35% si montant brut > 500€', () => {
    const result = calculateTransaction(1563, 6.0769)
    expect(result.grossAmount).toBeCloseTo(-9498.19, 0)
    expect(result.brokerage).toBeCloseTo(-33.24, 1)
    expect(result.netAmount).toBeCloseTo(-9531.43, 0)
  })

  it('cas limite 80 parts × 6,1852 = 494,82 (pas de courtage)', () => {
    const result = calculateTransaction(80, 6.1852)
    expect(result.grossAmount).toBeCloseTo(-494.82, 1)
    expect(result.brokerage).toBe(0)
  })
})
```

- [ ] **Step 2: Lance le test et vérifie qu'il échoue**

```bash
npx vitest run src/utils/__tests__/brokerage.test.ts
```
Attendu : FAIL — `Cannot find module '../brokerage'`

- [ ] **Step 3: Crée `src/utils/brokerage.ts`**

```ts
export const BROKERAGE_RATE = 0.0035
export const BROKERAGE_THRESHOLD = 500

export function calculateBrokerage(grossAmount: number): number {
  if (Math.abs(grossAmount) > BROKERAGE_THRESHOLD) {
    return parseFloat((-(Math.abs(grossAmount) * BROKERAGE_RATE)).toFixed(2))
  }
  return 0
}

export function calculateTransaction(
  quantity: number,
  executionPrice: number
): { grossAmount: number; brokerage: number; netAmount: number } {
  const grossAmount = parseFloat((-(quantity * executionPrice)).toFixed(2))
  const brokerage = calculateBrokerage(grossAmount)
  return {
    grossAmount,
    brokerage,
    netAmount: parseFloat((grossAmount + brokerage).toFixed(2))
  }
}
```

- [ ] **Step 4: Lance les tests et vérifie qu'ils passent**

```bash
npx vitest run src/utils/__tests__/brokerage.test.ts
```
Attendu : PASS — 6 tests

- [ ] **Step 5: Commit**

```bash
git add src/utils/brokerage.ts src/utils/__tests__/brokerage.test.ts
git commit -m "feat: add brokerage calculation utility (TDD)"
```

---

## Task 4: Parser CSV (TDD)

**Files:**
- Create: `src/utils/csv-parser.ts`
- Create: `src/utils/__tests__/csv-parser.test.ts`

- [ ] **Step 1: Crée le test `src/utils/__tests__/csv-parser.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseCSV, deduplicateTransactions } from '../csv-parser'
import type { Transaction } from '../../types'

vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid' })

const HEADER = `Libellé\tOpération\tPlace\tDate\tQté\tPrix d'éxé\tMontant brut\tCourtage/Prélèvement\tMontant net\tDevise`

const SAMPLE_CSV = `${HEADER}
iShares MSCI World Swap PEA UCITS ETF - EUR ACC\tAchat Comptant\tEuronext Paris\t19/03/2026\t82.0\t6.0769\t-498,31\t-1,74\t-500,05\tEUR
iShares MSCI World Swap PEA UCITS ETF - EUR ACC\tAchat Comptant\tEuronext Paris\t19/03/2026\t1563.0\t6.0769\t-9498,19\t-33,24\t-9531,43\tEUR`

describe('parseCSV', () => {
  it('retourne [] pour une seule ligne (header)', () => {
    expect(parseCSV(HEADER)).toEqual([])
  })

  it('parse toutes les lignes de données', () => {
    expect(parseCSV(SAMPLE_CSV)).toHaveLength(2)
  })

  it('convertit la date DD/MM/YYYY → YYYY-MM-DD', () => {
    const [first] = parseCSV(SAMPLE_CSV)
    expect(first.date).toBe('2026-03-19')
  })

  it('parse la quantité et le prix', () => {
    const [first] = parseCSV(SAMPLE_CSV)
    expect(first.quantity).toBe(82)
    expect(first.executionPrice).toBe(6.0769)
  })

  it('parse les montants avec virgule comme séparateur décimal', () => {
    const [first] = parseCSV(SAMPLE_CSV)
    expect(first.grossAmount).toBeCloseTo(-498.31, 2)
    expect(first.brokerage).toBeCloseTo(-1.74, 2)
    expect(first.netAmount).toBeCloseTo(-500.05, 2)
  })

  it('définit source à "csv"', () => {
    const [first] = parseCSV(SAMPLE_CSV)
    expect(first.source).toBe('csv')
  })

  it('ignore les lignes avec moins de 10 colonnes', () => {
    const broken = `${HEADER}\ncol1\tcol2\n${SAMPLE_CSV.split('\n')[1]}`
    expect(parseCSV(broken)).toHaveLength(1)
  })
})

describe('deduplicateTransactions', () => {
  const existing: Transaction[] = [
    { id: '1', date: '2026-03-19', quantity: 82, executionPrice: 6.0769 } as Transaction
  ]

  it('filtre les transactions déjà présentes', () => {
    const incoming: Transaction[] = [
      { id: '2', date: '2026-03-19', quantity: 82, executionPrice: 6.0769 } as Transaction,
      { id: '3', date: '2026-03-19', quantity: 1563, executionPrice: 6.0769 } as Transaction
    ]
    const result = deduplicateTransactions(existing, incoming)
    expect(result).toHaveLength(1)
    expect(result[0].quantity).toBe(1563)
  })

  it('retourne toutes les transactions si aucun doublon', () => {
    const incoming: Transaction[] = [
      { id: '4', date: '2026-01-09', quantity: 241, executionPrice: 6.23 } as Transaction
    ]
    expect(deduplicateTransactions(existing, incoming)).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Lance le test et vérifie qu'il échoue**

```bash
npx vitest run src/utils/__tests__/csv-parser.test.ts
```
Attendu : FAIL — `Cannot find module '../csv-parser'`

- [ ] **Step 3: Crée `src/utils/csv-parser.ts`**

```ts
import type { Transaction } from '../types'
import { generateId } from './id'

function parseNumber(value: string): number {
  return parseFloat(value.replace(',', '.').trim())
}

function parseDate(value: string): string {
  const [day, month, year] = value.trim().split('/')
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

export function parseCSV(content: string): Transaction[] {
  const lines = content.trim().split('\n')
  if (lines.length < 2) return []

  return lines
    .slice(1)
    .map(line => {
      const cols = line.split('\t')
      if (cols.length < 10) return null
      return {
        id: generateId(),
        label: cols[0].trim(),
        date: parseDate(cols[3]),
        quantity: parseNumber(cols[4]),
        executionPrice: parseNumber(cols[5]),
        grossAmount: parseNumber(cols[6]),
        brokerage: parseNumber(cols[7]),
        netAmount: parseNumber(cols[8]),
        currency: cols[9].trim(),
        source: 'csv' as const
      }
    })
    .filter((t): t is Transaction => t !== null)
}

export function deduplicateTransactions(
  existing: Transaction[],
  incoming: Transaction[]
): Transaction[] {
  const keys = new Set(
    existing.map(t => `${t.date}|${t.quantity}|${t.executionPrice}`)
  )
  return incoming.filter(
    t => !keys.has(`${t.date}|${t.quantity}|${t.executionPrice}`)
  )
}
```

- [ ] **Step 4: Lance les tests et vérifie qu'ils passent**

```bash
npx vitest run src/utils/__tests__/csv-parser.test.ts
```
Attendu : PASS — 9 tests

- [ ] **Step 5: Commit**

```bash
git add src/utils/csv-parser.ts src/utils/__tests__/csv-parser.test.ts
git commit -m "feat: add CSV parser with deduplication (TDD)"
```

---

## Task 5: Stores Pinia

**Files:**
- Create: `src/stores/investments.ts`
- Create: `src/stores/settings.ts`
- Create: `src/stores/__tests__/investments.test.ts`

- [ ] **Step 1: Crée le test `src/stores/__tests__/investments.test.ts`**

```ts
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
```

- [ ] **Step 2: Lance le test et vérifie qu'il échoue**

```bash
npx vitest run src/stores/__tests__/investments.test.ts
```
Attendu : FAIL — `Cannot find module '../investments'`

- [ ] **Step 3: Crée `src/stores/investments.ts`**

```ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Transaction, MonthGroup, MonthStatus } from '../types'

export const useInvestmentsStore = defineStore('investments', () => {
  const transactions = ref<Transaction[]>([])

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
    let cumulative = 0
    return monthlyGroups.value.map(g => {
      cumulative += g.totalInvested
      return { x: g.key, invested: parseFloat(cumulative.toFixed(2)) }
    })
  })

  function addTransaction(tx: Transaction): void {
    transactions.value.push(tx)
  }

  function addTransactions(txs: Transaction[]): void {
    transactions.value.push(...txs)
  }

  function getMonthStatus(year: number, month: number, now: Date = new Date()): MonthStatus {
    const key = `${year}-${String(month).padStart(2, '0')}`
    if (monthlyGroups.value.some(g => g.key === key)) return 'done'
    const target = new Date(year, month - 1, 1)
    const current = new Date(now.getFullYear(), now.getMonth(), 1)
    if (target > current) return 'future'
    if (target.getTime() === current.getTime()) return 'current-pending'
    return 'missed'
  }

  return {
    transactions,
    totalShares,
    totalInvested,
    monthlyGroups,
    cumulativeChartData,
    addTransaction,
    addTransactions,
    getMonthStatus
  }
}, { persist: true })
```

- [ ] **Step 4: Crée `src/stores/settings.ts`**

```ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const ticker = ref('WPEA.PA')
  const manualPrice = ref<number | null>(null)
  const lastFetchedPrice = ref<number | null>(null)
  const lastFetchedAt = ref<string | null>(null)

  const currentPrice = computed(() => manualPrice.value ?? lastFetchedPrice.value)

  function updatePrice(price: number): void {
    lastFetchedPrice.value = price
    lastFetchedAt.value = new Date().toISOString()
  }

  function setManualPrice(price: number | null): void {
    manualPrice.value = price
  }

  function setTicker(t: string): void {
    ticker.value = t
  }

  return { ticker, manualPrice, lastFetchedPrice, lastFetchedAt, currentPrice, updatePrice, setManualPrice, setTicker }
}, { persist: true })
```

- [ ] **Step 5: Lance les tests et vérifie qu'ils passent**

```bash
npx vitest run src/stores/__tests__/investments.test.ts
```
Attendu : PASS — 7 tests

- [ ] **Step 6: Lance tous les tests**

```bash
npx vitest run
```
Attendu : PASS — tous les tests (brokerage + csv-parser + investments)

- [ ] **Step 7: Commit**

```bash
git add src/stores/ src/utils/brokerage.ts src/utils/csv-parser.ts
git commit -m "feat: add Pinia stores and pass all unit tests"
```

---

## Task 6: Service prix ETF

**Files:**
- Create: `src/utils/etf-price.ts`

- [ ] **Step 1: Crée `src/utils/etf-price.ts`**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/etf-price.ts
git commit -m "feat: add ETF price service with CORS proxy fallback"
```

---

## Task 7: App shell (main.ts, App.vue, router, BottomNav)

**Files:**
- Modify: `src/main.ts`
- Create: `src/router/index.ts`
- Modify: `src/App.vue`
- Create: `src/components/layout/BottomNav.vue`

- [ ] **Step 1: Remplace `src/main.ts`**

```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPersistedstate from 'pinia-plugin-persistedstate'
import VueApexCharts from 'vue3-apexcharts'
import { router } from './router'
import App from './App.vue'
import './style.css'

const pinia = createPinia()
pinia.use(piniaPersistedstate)

createApp(App)
  .use(pinia)
  .use(router)
  .use(VueApexCharts)
  .mount('#app')
```

- [ ] **Step 2: Crée `src/router/index.ts`**

```ts
import { createRouter, createWebHashHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: DashboardView },
    { path: '/mois', component: () => import('../views/MonthsView.vue') },
    { path: '/ajouter', component: () => import('../views/AddView.vue') },
    { path: '/import', component: () => import('../views/ImportView.vue') },
    { path: '/config', component: () => import('../views/ConfigView.vue') }
  ]
})
```

- [ ] **Step 3: Crée `src/components/layout/BottomNav.vue`**

```vue
<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { path: '/', icon: '📊', label: 'Dashboard' },
  { path: '/mois', icon: '📅', label: 'Mois' },
  { path: '/ajouter', icon: '➕', label: 'Ajouter' },
  { path: '/config', icon: '⚙️', label: 'Config' }
]
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10"
       style="background: rgba(15, 12, 41, 0.92); backdrop-filter: blur(16px); padding-bottom: env(safe-area-inset-bottom);">
    <div class="flex max-w-md mx-auto">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.path"
        :to="tab.path"
        class="flex-1 flex flex-col items-center py-3 gap-0.5 text-[10px] font-medium transition-colors no-underline"
        :class="route.path === tab.path ? 'text-violet-400' : 'text-gray-500'"
      >
        <span class="text-xl leading-tight">{{ tab.icon }}</span>
        {{ tab.label }}
      </RouterLink>
    </div>
  </nav>
</template>
```

- [ ] **Step 4: Remplace `src/App.vue`**

```vue
<script setup lang="ts">
import BottomNav from './components/layout/BottomNav.vue'
</script>

<template>
  <div class="min-h-screen">
    <main class="max-w-md mx-auto px-4 pt-6 pb-24">
      <RouterView />
    </main>
    <BottomNav />
  </div>
</template>
```

- [ ] **Step 5: Crée un stub `src/views/DashboardView.vue` pour que le router compile**

```vue
<template>
  <div><p class="text-white">Dashboard</p></div>
</template>
```

- [ ] **Step 6: Lance `npm run dev` et vérifie la navigation en bas**

Attendu : app visible sur `http://localhost:5173`, 4 onglets en bas, navigation fonctionnelle

- [ ] **Step 7: Commit**

```bash
git add src/main.ts src/router/index.ts src/App.vue src/components/ src/views/DashboardView.vue
git commit -m "feat: add app shell with bottom navigation and router"
```

---

## Task 8: Dashboard view

**Files:**
- Create: `src/components/dashboard/PriceChip.vue`
- Create: `src/components/dashboard/PortfolioCard.vue`
- Create: `src/components/dashboard/StatsCards.vue`
- Create: `src/components/dashboard/PortfolioChart.vue`
- Modify: `src/views/DashboardView.vue`

- [ ] **Step 1: Crée `src/components/dashboard/PriceChip.vue`**

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSettingsStore } from '../../stores/settings'
import { fetchETFPrice } from '../../utils/etf-price'

const settings = useSettingsStore()
const loading = ref(false)
const error = ref(false)

async function refresh() {
  loading.value = true
  error.value = false
  try {
    const price = await fetchETFPrice(settings.ticker)
    settings.updatePrice(price)
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(refresh)
</script>

<template>
  <button
    @click="refresh"
    class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-violet-500/40 bg-violet-500/15 text-violet-300 text-xs font-semibold transition hover:bg-violet-500/25 active:scale-95"
    :class="{ 'opacity-50 pointer-events-none': loading }"
  >
    <span v-if="loading" class="animate-spin">⏳</span>
    <span v-else-if="error">❌</span>
    <span v-else>{{ settings.ticker }}</span>
    <span v-if="settings.currentPrice"> {{ settings.currentPrice.toFixed(4) }} €</span>
    <span v-else-if="!loading" class="text-gray-500"> —</span>
  </button>
</template>
```

- [ ] **Step 2: Crée `src/components/dashboard/PortfolioCard.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useInvestmentsStore } from '../../stores/investments'
import { useSettingsStore } from '../../stores/settings'

const investments = useInvestmentsStore()
const settings = useSettingsStore()

const portfolioValue = computed(() =>
  settings.currentPrice ? investments.totalShares * settings.currentPrice : null
)

const unrealizedGain = computed(() =>
  portfolioValue.value !== null ? portfolioValue.value - investments.totalInvested : null
)

const gainPercent = computed(() =>
  unrealizedGain.value !== null && investments.totalInvested > 0
    ? (unrealizedGain.value / investments.totalInvested) * 100
    : null
)

function fmt(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
}
</script>

<template>
  <div class="glass-card p-5 mb-4">
    <p class="text-gray-400 text-xs mb-1 uppercase tracking-widest">Valeur du portefeuille</p>
    <p class="text-white font-black tracking-tight" style="font-size: 2.25rem; line-height: 1;">
      {{ portfolioValue !== null ? fmt(portfolioValue) : '—' }}
    </p>
    <p
      v-if="unrealizedGain !== null"
      class="mt-2 text-sm font-semibold"
      :class="unrealizedGain >= 0 ? 'text-emerald-400' : 'text-red-400'"
    >
      {{ unrealizedGain >= 0 ? '+' : '' }}{{ fmt(unrealizedGain) }}
      <span class="opacity-75"> · {{ gainPercent?.toFixed(2) }}%</span>
    </p>
    <p v-else class="mt-2 text-xs text-gray-500">
      Configure le prix ETF pour voir la plus-value
    </p>
  </div>
</template>
```

- [ ] **Step 3: Crée `src/components/dashboard/StatsCards.vue`**

```vue
<script setup lang="ts">
import { useInvestmentsStore } from '../../stores/investments'

const investments = useInvestmentsStore()

function fmt(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
}
</script>

<template>
  <div class="grid grid-cols-2 gap-3 mb-4">
    <div class="glass-card p-4">
      <p class="text-gray-400 text-[10px] uppercase tracking-widest mb-1">Total investi</p>
      <p class="text-white text-lg font-bold">{{ fmt(investments.totalInvested) }}</p>
    </div>
    <div class="glass-card p-4">
      <p class="text-gray-400 text-[10px] uppercase tracking-widest mb-1">Parts totales</p>
      <p class="text-white text-lg font-bold">{{ Math.round(investments.totalShares).toLocaleString('fr-FR') }}</p>
    </div>
  </div>
</template>
```

- [ ] **Step 4: Crée `src/components/dashboard/PortfolioChart.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
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

const options = {
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
```

- [ ] **Step 5: Remplace `src/views/DashboardView.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import PriceChip from '../components/dashboard/PriceChip.vue'
import PortfolioCard from '../components/dashboard/PortfolioCard.vue'
import StatsCards from '../components/dashboard/StatsCards.vue'
import PortfolioChart from '../components/dashboard/PortfolioChart.vue'
import { useInvestmentsStore } from '../stores/investments'

const investments = useInvestmentsStore()
const now = new Date()
const currentMonthAlert = computed(() =>
  investments.getMonthStatus(now.getFullYear(), now.getMonth() + 1) === 'current-pending'
)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <span class="text-violet-300 text-xs font-bold uppercase tracking-widest">HoplInvest</span>
      <PriceChip />
    </div>
    <div
      v-if="currentMonthAlert"
      class="mb-4 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm"
    >
      ⚠️ Aucun investissement ce mois-ci
    </div>
    <PortfolioCard />
    <StatsCards />
    <PortfolioChart />
  </div>
</template>
```

- [ ] **Step 6: Vérifie le dashboard dans le navigateur**

Ouvre `http://localhost:5173` — tu dois voir : badge prix, carte portefeuille, cartes stats, message "Importe des transactions".

- [ ] **Step 7: Commit**

```bash
git add src/components/dashboard/ src/views/DashboardView.vue
git commit -m "feat: add dashboard view with portfolio card, stats and chart"
```

---

## Task 9: Vue mensuelle

**Files:**
- Create: `src/components/months/MonthCard.vue`
- Create: `src/components/months/MonthDetail.vue`
- Create: `src/views/MonthsView.vue`

- [ ] **Step 1: Crée `src/components/months/MonthCard.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { MonthStatus } from '../../types'

const props = defineProps<{
  month: number
  status: MonthStatus
  totalInvested: number
  selected: boolean
}>()

const emit = defineEmits<{ select: [] }>()

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

const CFG: Record<MonthStatus, { border: string; bg: string; text: string; icon: string }> = {
  done:            { border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: '✓' },
  missed:          { border: 'border-red-500/30',     bg: 'bg-red-500/10',     text: 'text-red-400',    icon: '✗' },
  'current-pending':{ border: 'border-amber-500/40', bg: 'bg-amber-500/10',   text: 'text-amber-400',  icon: '⚠' },
  future:          { border: 'border-white/8',        bg: 'bg-white/4',        text: 'text-gray-500',   icon: '·' }
}

const cfg = computed(() => CFG[props.status])

function fmt(v: number): string {
  return v > 0 ? `${Math.round(v).toLocaleString('fr-FR')}€` : '—'
}
</script>

<template>
  <button
    @click="emit('select')"
    class="rounded-xl p-2 text-center border w-full transition-all active:scale-95"
    :class="[cfg.bg, cfg.border, selected ? 'ring-2 ring-violet-500' : '']"
  >
    <div class="text-[10px] font-semibold text-gray-400">{{ MONTHS[month - 1] }}</div>
    <div class="text-sm my-0.5" :class="cfg.text">{{ cfg.icon }}</div>
    <div class="text-[9px]" :class="cfg.text">{{ fmt(totalInvested) }}</div>
  </button>
</template>
```

- [ ] **Step 2: Crée `src/components/months/MonthDetail.vue`**

```vue
<script setup lang="ts">
import type { MonthGroup } from '../../types'

defineProps<{ group: MonthGroup | null }>()

const MONTHS_FULL = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

function fmtEur(v: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v)
}

function fmtDate(d: string): string {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}
</script>

<template>
  <div class="glass-card p-4 mt-4" v-if="group">
    <h3 class="text-violet-300 text-xs font-bold uppercase tracking-widest mb-3">
      {{ MONTHS_FULL[group.month - 1] }} {{ group.year }}
    </h3>
    <div class="space-y-2 mb-3">
      <div v-for="tx in group.transactions" :key="tx.id" class="flex justify-between text-xs">
        <span class="text-gray-400">{{ fmtDate(tx.date) }} · {{ tx.quantity }} parts · {{ tx.executionPrice }}€</span>
        <span class="text-white font-semibold">{{ fmtEur(Math.abs(tx.netAmount)) }}</span>
      </div>
    </div>
    <div class="border-t border-white/10 pt-3 space-y-1">
      <div class="flex justify-between text-xs">
        <span class="text-gray-400">Courtage total</span>
        <span class="text-gray-400">{{ fmtEur(group.totalBrokerage) }}</span>
      </div>
      <div class="flex justify-between text-sm font-bold">
        <span class="text-violet-300">Total investi</span>
        <span class="text-white">{{ fmtEur(group.totalInvested) }}</span>
      </div>
    </div>
  </div>
  <div v-else class="glass-card p-4 mt-4 text-center text-gray-500 text-sm">
    Sélectionne un mois pour voir le détail
  </div>
</template>
```

- [ ] **Step 3: Crée `src/views/MonthsView.vue`**

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import MonthCard from '../components/months/MonthCard.vue'
import MonthDetail from '../components/months/MonthDetail.vue'
import { useInvestmentsStore } from '../stores/investments'
import type { MonthStatus } from '../types'

const investments = useInvestmentsStore()
const selectedYear = ref(new Date().getFullYear())
const selectedMonth = ref<number | null>(null)

const selectedGroup = computed(() => {
  if (selectedMonth.value === null) return null
  const key = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}`
  return investments.monthlyGroups.find(g => g.key === key) ?? null
})

function getInvested(month: number): number {
  const key = `${selectedYear.value}-${String(month).padStart(2, '0')}`
  return investments.monthlyGroups.find(g => g.key === key)?.totalInvested ?? 0
}

function getStatus(month: number): MonthStatus {
  return investments.getMonthStatus(selectedYear.value, month)
}

function toggle(month: number): void {
  selectedMonth.value = selectedMonth.value === month ? null : month
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <button @click="selectedYear--" class="text-violet-400 text-2xl w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition">‹</button>
      <span class="text-white font-bold text-lg">{{ selectedYear }}</span>
      <button @click="selectedYear++" class="text-violet-400 text-2xl w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition">›</button>
    </div>

    <div class="grid grid-cols-4 gap-2">
      <MonthCard
        v-for="month in 12"
        :key="month"
        :month="month"
        :status="getStatus(month)"
        :total-invested="getInvested(month)"
        :selected="selectedMonth === month"
        @select="toggle(month)"
      />
    </div>

    <MonthDetail :group="selectedGroup" />
  </div>
</template>
```

- [ ] **Step 4: Vérifie la vue mois dans le navigateur**

Clique sur l'onglet "Mois" — tu dois voir la grille 4×3, les cases grises (mois futurs). Tape sur un mois → panneau détail.

- [ ] **Step 5: Commit**

```bash
git add src/components/months/ src/views/MonthsView.vue
git commit -m "feat: add monthly grid view with status indicators and detail panel"
```

---

## Task 10: Formulaire d'ajout

**Files:**
- Create: `src/views/AddView.vue`

- [ ] **Step 1: Crée `src/views/AddView.vue`**

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useInvestmentsStore } from '../stores/investments'
import { calculateTransaction } from '../utils/brokerage'
import { generateId } from '../utils/id'

const investments = useInvestmentsStore()
const date = ref(new Date().toISOString().slice(0, 10))
const quantity = ref<number | ''>('')
const executionPrice = ref<number | ''>('')
const saved = ref(false)

const calc = computed(() => {
  if (!quantity.value || !executionPrice.value) return null
  return calculateTransaction(Number(quantity.value), Number(executionPrice.value))
})

function fmtEur(v: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Math.abs(v))
}

function save(): void {
  if (!calc.value || !quantity.value || !executionPrice.value) return
  investments.addTransaction({
    id: generateId(),
    date: date.value,
    label: 'iShares MSCI World Swap PEA UCITS ETF - EUR ACC',
    quantity: Number(quantity.value),
    executionPrice: Number(executionPrice.value),
    grossAmount: calc.value.grossAmount,
    brokerage: calc.value.brokerage,
    netAmount: calc.value.netAmount,
    currency: 'EUR',
    source: 'manual'
  })
  quantity.value = ''
  executionPrice.value = ''
  saved.value = true
  setTimeout(() => { saved.value = false }, 2000)
}
</script>

<template>
  <div>
    <h1 class="text-violet-300 text-xs font-bold uppercase tracking-widest mb-6">Ajouter un investissement</h1>

    <div class="glass-card p-5 space-y-4 mb-4">
      <div>
        <label class="text-gray-400 text-xs block mb-1.5">Date</label>
        <input
          v-model="date"
          type="date"
          class="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);"
        />
      </div>
      <div>
        <label class="text-gray-400 text-xs block mb-1.5">Quantité (parts)</label>
        <input
          v-model="quantity"
          type="number"
          step="0.001"
          min="0"
          placeholder="ex : 82"
          class="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-gray-600"
          style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);"
        />
      </div>
      <div>
        <label class="text-gray-400 text-xs block mb-1.5">Prix d'exécution (€ / part)</label>
        <input
          v-model="executionPrice"
          type="number"
          step="0.0001"
          min="0"
          placeholder="ex : 6.0769"
          class="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-gray-600"
          style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);"
        />
      </div>

      <!-- Calcul temps réel -->
      <div
        v-if="calc"
        class="rounded-xl p-4 space-y-2 text-sm"
        style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);"
      >
        <div class="flex justify-between">
          <span class="text-gray-400">Montant brut</span>
          <span class="text-white">{{ fmtEur(calc.grossAmount) }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">Courtage {{ calc.brokerage !== 0 ? '(0,35%)' : '' }}</span>
          <span :class="calc.brokerage !== 0 ? 'text-red-400' : 'text-gray-500'">
            {{ calc.brokerage !== 0 ? fmtEur(calc.brokerage) : 'Offert' }}
          </span>
        </div>
        <div class="flex justify-between border-t border-white/10 pt-2 font-bold">
          <span class="text-violet-300">Montant net</span>
          <span class="text-white">{{ fmtEur(calc.netAmount) }}</span>
        </div>
      </div>
    </div>

    <button
      @click="save"
      :disabled="!calc"
      class="w-full py-4 rounded-2xl font-bold text-sm transition-all active:scale-95"
      :class="calc
        ? 'bg-violet-600 hover:bg-violet-500 text-white'
        : 'text-gray-600 cursor-not-allowed'"
      :style="!calc ? 'background: rgba(255,255,255,0.05)' : ''"
    >
      {{ saved ? '✓ Enregistré !' : 'Enregistrer' }}
    </button>
  </div>
</template>
```

- [ ] **Step 2: Vérifie le formulaire dans le navigateur**

- Saisis 82 parts à 6.0769 → montant brut 498,31€, courtage "Offert", montant net 498,31€
- Saisis 1563 parts à 6.0769 → courtage ~33,24€ affiché en rouge
- Clique "Enregistrer" → bouton affiche "✓ Enregistré !" 2 secondes, dashboard se met à jour

- [ ] **Step 3: Commit**

```bash
git add src/views/AddView.vue
git commit -m "feat: add manual transaction form with real-time brokerage calculation"
```

---

## Task 11: Import CSV

**Files:**
- Create: `src/views/ImportView.vue`

- [ ] **Step 1: Crée `src/views/ImportView.vue`**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { parseCSV, deduplicateTransactions } from '../utils/csv-parser'
import { useInvestmentsStore } from '../stores/investments'
import type { Transaction } from '../types'

const investments = useInvestmentsStore()
const preview = ref<Transaction[]>([])
const isDragging = ref(false)
const imported = ref(false)
const error = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

function processFile(file: File): void {
  error.value = ''
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string
      const parsed = parseCSV(content)
      if (parsed.length === 0) {
        error.value = 'Aucune transaction trouvée dans ce fichier.'
        return
      }
      preview.value = deduplicateTransactions(investments.transactions, parsed)
      if (preview.value.length === 0) error.value = 'Toutes les transactions sont déjà importées.'
    } catch {
      error.value = 'Erreur lors de la lecture du fichier CSV.'
    }
  }
  reader.readAsText(file, 'UTF-8')
}

function onDrop(e: DragEvent): void {
  isDragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file) processFile(file)
}

function onFileInput(e: Event): void {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) processFile(file)
}

function confirmImport(): void {
  investments.addTransactions(preview.value)
  imported.value = true
  preview.value = []
  setTimeout(() => { imported.value = false }, 3000)
}

function fmtEur(v: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Math.abs(v))
}
</script>

<template>
  <div>
    <h1 class="text-violet-300 text-xs font-bold uppercase tracking-widest mb-6">Importer un CSV</h1>

    <!-- Dropzone -->
    <div
      class="glass-card p-8 text-center cursor-pointer transition-all mb-4 border-2"
      :class="isDragging ? 'border-violet-500 bg-violet-500/10' : 'border-transparent'"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
      @click="fileInputRef?.click()"
    >
      <div class="text-5xl mb-3">📂</div>
      <p class="text-gray-300 text-sm font-medium">Glisse ton CSV Boursobank ici</p>
      <p class="text-gray-500 text-xs mt-1">ou clique pour sélectionner un fichier</p>
      <input ref="fileInputRef" type="file" accept=".csv,.txt" class="hidden" @change="onFileInput" />
    </div>

    <p v-if="error" class="text-red-400 text-sm text-center mb-4">{{ error }}</p>

    <div v-if="imported" class="glass-card p-4 text-center text-emerald-400 font-semibold mb-4">
      ✓ Transactions importées avec succès !
    </div>

    <!-- Aperçu -->
    <div v-if="preview.length" class="glass-card p-4">
      <p class="text-violet-300 text-xs font-bold uppercase tracking-widest mb-3">
        {{ preview.length }} transaction(s) à importer
      </p>
      <div class="space-y-2 max-h-60 overflow-y-auto mb-4 pr-1">
        <div v-for="tx in preview" :key="tx.id" class="flex justify-between text-xs">
          <span class="text-gray-400">{{ tx.date }} · {{ tx.quantity }} parts · {{ tx.executionPrice }}€</span>
          <span class="text-white font-semibold">{{ fmtEur(tx.netAmount) }}</span>
        </div>
      </div>
      <button
        @click="confirmImport"
        class="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all active:scale-95"
      >
        Confirmer l'import ({{ preview.length }} lignes)
      </button>
    </div>

    <p class="text-center text-gray-600 text-xs mt-6">
      Format : CSV Boursobank — séparateur tabulation, dates DD/MM/YYYY
    </p>
  </div>
</template>
```

- [ ] **Step 2: Vérifie l'import dans le navigateur**

- Crée un fichier `test.csv` avec les données de l'exemple de la spec et glisse-le sur la zone
- Tu dois voir l'aperçu avec 20 lignes, puis "Confirmer l'import"
- Après confirmation : dashboard affiche les données, vue mois colorie les mois correctement

- [ ] **Step 3: Commit**

```bash
git add src/views/ImportView.vue
git commit -m "feat: add CSV import with drag-and-drop, preview and deduplication"
```

---

## Task 12: Config view

**Files:**
- Create: `src/views/ConfigView.vue`

- [ ] **Step 1: Crée `src/views/ConfigView.vue`**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { fetchETFPrice, clearPriceCache } from '../utils/etf-price'

const settings = useSettingsStore()
const tickerInput = ref(settings.ticker)
const manualPriceInput = ref(settings.manualPrice?.toString() ?? '')
const refreshing = ref(false)
const refreshError = ref(false)

function saveTicker(): void {
  settings.setTicker(tickerInput.value.trim().toUpperCase())
}

function saveManualPrice(): void {
  const val = parseFloat(manualPriceInput.value.replace(',', '.'))
  settings.setManualPrice(isNaN(val) || manualPriceInput.value === '' ? null : val)
}

function clearManual(): void {
  manualPriceInput.value = ''
  settings.setManualPrice(null)
}

async function forceRefresh(): Promise<void> {
  refreshing.value = true
  refreshError.value = false
  clearPriceCache()
  try {
    const price = await fetchETFPrice(settings.ticker)
    settings.updatePrice(price)
  } catch {
    refreshError.value = true
  } finally {
    refreshing.value = false
  }
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
}
</script>

<template>
  <div>
    <h1 class="text-violet-300 text-xs font-bold uppercase tracking-widest mb-6">Configuration</h1>

    <div class="space-y-4">
      <!-- Import CSV -->
      <RouterLink
        to="/import"
        class="glass-card p-4 flex items-center justify-between no-underline group"
      >
        <div>
          <p class="text-white text-sm font-semibold">Importer un CSV</p>
          <p class="text-gray-400 text-xs mt-0.5">Fichier Boursobank au format tabulé</p>
        </div>
        <span class="text-violet-400 text-xl group-hover:translate-x-1 transition-transform">›</span>
      </RouterLink>

      <!-- Ticker -->
      <div class="glass-card p-4">
        <label class="text-gray-400 text-xs block mb-2">Ticker Yahoo Finance</label>
        <div class="flex gap-2">
          <input
            v-model="tickerInput"
            type="text"
            class="flex-1 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 uppercase"
            style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);"
          />
          <button @click="saveTicker" class="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all">
            OK
          </button>
        </div>
        <p class="text-gray-500 text-xs mt-1.5">Actuel : {{ settings.ticker }}</p>
      </div>

      <!-- Prix temps réel -->
      <div class="glass-card p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-gray-400 text-xs">Prix ETF (temps réel)</span>
          <button
            @click="forceRefresh"
            :disabled="refreshing"
            class="text-violet-400 text-xs hover:text-violet-300 transition-colors disabled:opacity-50"
          >
            {{ refreshing ? '⏳ En cours…' : '🔄 Rafraîchir' }}
          </button>
        </div>
        <p class="text-white text-2xl font-bold">
          {{ settings.lastFetchedPrice?.toFixed(4) ?? '—' }} €
        </p>
        <p class="text-gray-500 text-xs mt-1">Mis à jour : {{ fmtDate(settings.lastFetchedAt) }}</p>
        <p v-if="refreshError" class="text-red-400 text-xs mt-2">
          ❌ Impossible de contacter Yahoo Finance
        </p>
      </div>

      <!-- Prix manuel -->
      <div class="glass-card p-4">
        <label class="text-gray-400 text-xs block mb-2">Prix manuel (fallback si API indisponible)</label>
        <div class="flex gap-2">
          <input
            v-model="manualPriceInput"
            type="number"
            step="0.0001"
            min="0"
            placeholder="ex : 6.23"
            class="flex-1 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-gray-600"
            style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);"
          />
          <button @click="saveManualPrice" class="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all">
            OK
          </button>
        </div>
        <div v-if="settings.manualPrice" class="flex items-center justify-between mt-2">
          <p class="text-amber-400 text-xs">⚠ Prix manuel actif : {{ settings.manualPrice }} €</p>
          <button @click="clearManual" class="text-gray-500 text-xs hover:text-red-400 transition-colors">
            Retirer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Vérifie la config dans le navigateur**

- Entre un prix manuel ex. `6.20` → le dashboard doit recalculer la plus-value
- Clique "Retirer" → plus-value disparaît si l'API n'est pas disponible
- Clique "Rafraîchir" → badge prix se met à jour

- [ ] **Step 3: Commit**

```bash
git add src/views/ConfigView.vue
git commit -m "feat: add config view with ticker, live price refresh and manual price"
```

---

## Task 13: Build final et vérification PWA

**Files:**
- Modify: `package.json` (scripts déjà là)

- [ ] **Step 1: Lance le build de production**

```bash
npm run build
```
Attendu : dossier `dist/` créé sans erreurs TypeScript

- [ ] **Step 2: Prévisualise le build**

```bash
npm run preview
```
Ouvre `http://localhost:4173` — vérifie que tout fonctionne.

- [ ] **Step 3: Vérifie l'installabilité PWA**

Dans Chrome : ouvre les DevTools → onglet "Application" → "Manifest" — tu dois voir le nom, la couleur, l'icône. Le bouton d'installation (⊕) doit apparaître dans la barre d'adresse.

- [ ] **Step 4: Test complet du flux utilisateur**

1. Importe le CSV de test via `/import`
2. Vérifie que le dashboard affiche les données : montant investi, graphique
3. Vérifie la vue mois : mois verts pour les mois avec transactions
4. Ajoute une transaction manuelle via `/ajouter` : saisis 100 parts à 6.10
5. Vérifie que le calcul affiche courtage = 0 (100 × 6.10 = 610 → > 500 → courtage = 610 × 0.35% = 2.14€)

  > Correction étape 5 : 100 × 6.10 = 610€ > 500€ → courtage = 610 × 0.0035 = 2.14€ → montant net = 612.14€

6. Configure le prix ETF manuellement à `6.23` → la plus-value s'affiche sur le dashboard

- [ ] **Step 5: Lance tous les tests une dernière fois**

```bash
npx vitest run
```
Attendu : tous les tests PASS

- [ ] **Step 6: Commit final**

```bash
git add -A
git commit -m "feat: complete HoplInvest PWA — all views, tests passing, production build ok"
```
