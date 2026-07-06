export const MASSAGE_DISCOUNT_RATE = 0.15;

export function hasActiveSessionBalance(balances: {
  collective_balance?: number | null;
  individual_balance?: number | null;
  duo_balance?: number | null;
}): boolean {
  return (
    (balances.collective_balance ?? 0) > 0 ||
    (balances.individual_balance ?? 0) > 0 ||
    (balances.duo_balance ?? 0) > 0
  );
}

export function computeMassagePrice(basePrice: number, discountApplied: boolean): number {
  const price = discountApplied ? basePrice * (1 - MASSAGE_DISCOUNT_RATE) : basePrice;
  return Math.round(price * 100) / 100;
}

export function currentMonthRange(now = new Date()): { start: string; end: string } {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start: start.toISOString(), end: end.toISOString() };
}
