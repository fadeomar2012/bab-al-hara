'use server';

import { revalidatePath } from 'next/cache';
import type { OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/features/admin/auth/admin-auth';
import { isAllowedTransition, STATUS_TIMESTAMP_FIELD } from './order-admin.validation';

export type OrderActionResult = { ok: true } | { ok: false; message: string };

function revalidateOrder(id: string) {
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath('/admin');
  revalidatePath('/admin/inventory');
}

export async function updateOrderStatusAction(orderId: string, toStatus: OrderStatus, note?: string): Promise<OrderActionResult> {
  await requireAdmin();

  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true, status: true } });
  if (!order) return { ok: false, message: 'Order not found.' };

  const fromStatus = order.status;
  if (fromStatus === toStatus) return { ok: false, message: 'Order is already in that status.' };
  if (!isAllowedTransition(fromStatus, toStatus)) {
    return { ok: false, message: `Cannot move an order from ${fromStatus} to ${toStatus}.` };
  }

  const trimmedNote = note?.trim() || undefined;
  const timestampField = STATUS_TIMESTAMP_FIELD[toStatus];

  if (toStatus === 'CANCELED') {
    await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({ where: { id: orderId }, select: { orderNumber: true } });
      const items = await tx.orderItem.findMany({
        where: { orderId, variantId: { not: null } },
        select: { productId: true, variantId: true, quantity: true }
      });

      // Restore stock exactly once (guarded by the transition rules: CANCELED is terminal).
      for (const item of items) {
        if (!item.variantId) continue;
        await tx.productVariant.update({ where: { id: item.variantId }, data: { quantity: { increment: item.quantity } } });
        await tx.inventoryLog.create({
          data: {
            productId: item.productId,
            variantId: item.variantId,
            orderId,
            type: 'ORDER_CANCELED',
            quantityChange: item.quantity,
            note: `Canceled order ${current?.orderNumber ?? orderId}`
          }
        });
      }

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELED',
          canceledAt: new Date(),
          cancelReason: trimmedNote ?? null,
          statusHistory: { create: { fromStatus, toStatus: 'CANCELED', note: trimmedNote ?? 'Order canceled by admin' } }
        }
      });
    });

    revalidateOrder(orderId);
    revalidatePath('/');
    return { ok: true };
  }

  const data: Prisma.OrderUpdateInput = {
    status: toStatus,
    statusHistory: { create: { fromStatus, toStatus, note: trimmedNote } }
  };
  if (timestampField) data[timestampField] = new Date();

  await prisma.order.update({ where: { id: orderId }, data });
  revalidateOrder(orderId);
  return { ok: true };
}

export async function updateOrderAdminNoteAction(orderId: string, adminNote: string): Promise<OrderActionResult> {
  await requireAdmin();
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true } });
  if (!order) return { ok: false, message: 'Order not found.' };
  await prisma.order.update({ where: { id: orderId }, data: { adminNote: adminNote.trim() || null } });
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}
