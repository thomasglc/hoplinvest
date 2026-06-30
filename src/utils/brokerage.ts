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
