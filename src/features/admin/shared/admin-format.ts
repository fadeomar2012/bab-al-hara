import type { ProductStockState } from '@/features/catalog/catalog.types';

export const ADMIN_CURRENCY = '₪';

/** Build a URL-safe slug from arbitrary text (supports Arabic by keeping unicode letters). */
export function slugify(input: string): string {
  return input
    .toString()
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function formatCurrency(value: number): string {
  return `${ADMIN_CURRENCY}${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/** Stock state for a single variant given its quantity and low-stock threshold. */
export function variantStockState(quantity: number, lowStockThreshold: number): ProductStockState {
  if (quantity <= 0) return 'out-of-stock';
  if (quantity <= lowStockThreshold) return 'low-stock';
  return 'in-stock';
}

export const STOCK_STATE_LABEL: Record<ProductStockState, string> = {
  'in-stock': 'متوفر',
  'low-stock': 'مخزون منخفض',
  'out-of-stock': 'نفد المخزون'
};
