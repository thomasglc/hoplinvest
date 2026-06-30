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
