import { describe, it, expect, vi } from 'vitest'
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

describe('parseCSV — séparateur point-virgule (Boursobank réel)', () => {
  const HEADER_SC = `libellé;Opération;Place;Date;Qté;Prix d'éxé;Montant brut;Courtage/Prélèvement;Montant net;Devise;`
  const SAMPLE_SC = `${HEADER_SC}
iShares MSCI World Swap PEA UCITS ETF - EUR ACC;Achat Comptant;Euronext Paris;09/01/2026;241.0;6.23;-1501.43;-5.26;-1506.69;EUR;
iShares MSCI World Swap PEA UCITS ETF - EUR ACC;Achat Comptant;Euronext Paris;09/01/2026;77.0;6.23;-479.71;0.0;-479.71;EUR;`

  it('parse un fichier à séparateur ;', () => {
    expect(parseCSV(SAMPLE_SC)).toHaveLength(2)
  })

  it('convertit correctement la date avec ;', () => {
    const [first] = parseCSV(SAMPLE_SC)
    expect(first.date).toBe('2026-01-09')
  })

  it('parse les montants sans virgule décimale (format réel export)', () => {
    const [first] = parseCSV(SAMPLE_SC)
    expect(first.netAmount).toBeCloseTo(-1506.69, 2)
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
