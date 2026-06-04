/**
 * Server-side order pricing. The client may display an estimate, but these
 * functions are the single source of truth for money — always computed from
 * DB variant prices, never from client-supplied totals.
 */

export const FREE_DELIVERY_THRESHOLD = 150;
export const DELIVERY_FEE = 15;

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calcDeliveryFee(subtotal: number): number {
  if (subtotal <= 0 || subtotal >= FREE_DELIVERY_THRESHOLD) return 0;
  return DELIVERY_FEE;
}

export type OrderTotals = {
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
};

export function calcOrderTotals(subtotal: number, discount = 0): OrderTotals {
  const cleanSubtotal = round2(Math.max(0, subtotal));
  const deliveryFee = calcDeliveryFee(cleanSubtotal);
  const cleanDiscount = round2(Math.max(0, discount));
  const total = round2(cleanSubtotal + deliveryFee - cleanDiscount);
  return { subtotal: cleanSubtotal, deliveryFee, discount: cleanDiscount, total: Math.max(0, total) };
}
