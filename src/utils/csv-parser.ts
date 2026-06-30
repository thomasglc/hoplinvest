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
    .map((line): Transaction | null => {
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
