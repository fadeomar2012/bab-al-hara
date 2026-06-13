/**
 * Server-side order pricing. The client may display an estimate, but these
 * functions are the single source of truth for money — always computed from
 * DB variant prices, never from client-supplied totals.
 */

export const FREE_DELIVERY_THRESHOLD = 150;
export const DELIVERY_FEE = 15;

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calcLineTotal(unitPrice: number, quantity: number): number {
  return roundMoney(Math.max(0, unitPrice) * Math.max(0, quantity));
}

export function calcDeliveryFee(subtotal: number): number {
  const cleanSubtotal = roundMoney(Math.max(0, subtotal));
  if (cleanSubtotal <= 0 || cleanSubtotal >= FREE_DELIVERY_THRESHOLD) return 0;
  return DELIVERY_FEE;
}

export type OrderTotals = {
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
};

export function calcOrderTotals(subtotal: number, discount = 0): OrderTotals {
  const cleanSubtotal = roundMoney(Math.max(0, subtotal));
  const deliveryFee = calcDeliveryFee(cleanSubtotal);
  const cleanDiscount = roundMoney(Math.max(0, discount));
  const total = roundMoney(cleanSubtotal + deliveryFee - cleanDiscount);
  return { subtotal: cleanSubtotal, deliveryFee, discount: cleanDiscount, total: Math.max(0, total) };
}
