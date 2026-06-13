'use server';

import { revalidatePath } from 'next/cache';
import { Prisma, type OrderStatus } from '@prisma/client';
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

function revalidateStorefrontProducts(productSlugs: Iterable<string>, categorySlugs: Iterable<string>) {
  revalidatePath('/');
  revalidatePath('/category/new-in');
  revalidatePath('/category/sale');
  for (const slug of categorySlugs) revalidatePath(`/category/${slug}`);
  for (const slug of productSlugs) revalidatePath(`/product/${slug}`);
}

class OrderTransitionAbort extends Error {
  constructor(message: string) {
    super(message);
  }
}

async function lockOrderForUpdate(tx: Prisma.TransactionClient, orderId: string): Promise<void> {
  await tx.$queryRaw(Prisma.sql`SELECT id FROM "Order" WHERE id = ${orderId} FOR UPDATE`);
}

export async function updateOrderStatusAction(orderId: string, toStatus: OrderStatus, note?: string): Promise<OrderActionResult> {
  await requireAdmin();

  const trimmedNote = note?.trim() || undefined;
  const affectedProductSlugs = new Set<string>();
  const affectedCategorySlugs = new Set<string>();

  try {
    await prisma.$transaction(async (tx) => {
      // Lock the order row before checking the current status. This makes status
      // transitions and stock restoration idempotent under double-clicks or two admins.
      await lockOrderForUpdate(tx, orderId);
      const order = await tx.order.findUnique({ where: { id: orderId }, select: { id: true, status: true, orderNumber: true } });
      if (!order) throw new OrderTransitionAbort('Order not found.');

      const fromStatus = order.status;
      if (fromStatus === toStatus) throw new OrderTransitionAbort('Order is already in that status.');
      if (!isAllowedTransition(fromStatus, toStatus)) {
        throw new OrderTransitionAbort(`Cannot move an order from ${fromStatus} to ${toStatus}.`);
      }

      if (toStatus === 'CANCELED') {
        const items = await tx.orderItem.findMany({
          where: { orderId },
          select: {
            productId: true,
            variantId: true,
            quantity: true,
            product: { select: { slug: true, category: { select: { slug: true } } } }
          }
        });

        const soldQuantityByProduct = new Map<string, number>();

        // Restore stock exactly once. The locked status transition above prevents
        // two concurrent cancel actions from restoring the same stock twice.
        for (const item of items) {
          soldQuantityByProduct.set(item.productId, (soldQuantityByProduct.get(item.productId) ?? 0) + item.quantity);
          affectedProductSlugs.add(item.product.slug);
          if (item.product.category?.slug) affectedCategorySlugs.add(item.product.category.slug);

          if (!item.variantId) continue;
          await tx.productVariant.update({ where: { id: item.variantId }, data: { quantity: { increment: item.quantity } } });
          await tx.inventoryLog.create({
            data: {
              productId: item.productId,
              variantId: item.variantId,
              orderId,
              type: 'ORDER_CANCELED',
              quantityChange: item.quantity,
              note: `Canceled order ${order.orderNumber}`
            }
          });
        }

        for (const [productId, quantity] of soldQuantityByProduct) {
          await tx.$executeRaw(
            Prisma.sql`UPDATE "Product" SET "soldCount" = GREATEST("soldCount" - ${quantity}, 0) WHERE "id" = ${productId}`
          );
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
        return;
      }

      const timestampField = STATUS_TIMESTAMP_FIELD[toStatus];
      const data: Prisma.OrderUpdateInput = {
        status: toStatus,
        statusHistory: { create: { fromStatus, toStatus, note: trimmedNote } }
      };
      if (timestampField) data[timestampField] = new Date();

      await tx.order.update({ where: { id: orderId }, data });
    });
  } catch (error) {
    if (error instanceof OrderTransitionAbort) {
      return { ok: false, message: error.message };
    }
    throw error;
  }

  revalidateOrder(orderId);
  if (toStatus === 'CANCELED') revalidateStorefrontProducts(affectedProductSlugs, affectedCategorySlugs);
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
