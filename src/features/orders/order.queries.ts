import 'server-only';
import { prisma } from '@/lib/prisma';
import { normalizePhone } from './order.validation';
import { mapOrderView } from './order.mappers';
import type { OrderView } from './order.types';

const orderWithItems = { items: { orderBy: { createdAt: 'asc' } } } as const;

/** Load an order for the success page (by order number only). */
export async function getOrderByNumber(orderNumber: string): Promise<OrderView | null> {
  const order = await prisma.order.findUnique({
    where: { orderNumber: orderNumber.trim() },
    include: orderWithItems
  });
  return order ? mapOrderView(order) : null;
}

/**
 * Public tracking lookup — requires BOTH order number and matching phone,
 * so a phone number alone can't enumerate someone else's orders.
 */
export async function getOrderByNumberAndPhone(orderNumber: string, phone: string): Promise<OrderView | null> {
  const normalized = normalizePhone(phone);
  const order = await prisma.order.findUnique({
    where: { orderNumber: orderNumber.trim() },
    include: orderWithItems
  });
  if (!order) return null;
  if (normalizePhone(order.customerPhone) !== normalized) return null;
  return mapOrderView(order);
}
