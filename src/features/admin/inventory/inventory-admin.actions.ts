'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/features/admin/auth/admin-auth';

export type InventoryActionResult = { ok: true; quantity: number } | { ok: false; message: string };

/**
 * Set a variant's exact quantity and record a MANUAL_ADJUSTMENT inventory log
 * capturing the delta. No-op (still ok) when the quantity is unchanged.
 */
export async function adjustVariantQuantityAction(
  variantId: string,
  newQuantity: number,
  note?: string
): Promise<InventoryActionResult> {
  await requireAdmin();

  const target = Math.trunc(newQuantity);
  if (!Number.isFinite(target) || target < 0) {
    return { ok: false, message: 'Quantity must be a whole number ≥ 0.' };
  }

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { id: true, productId: true, quantity: true }
  });
  if (!variant) return { ok: false, message: 'Variant not found.' };

  const delta = target - variant.quantity;

  await prisma.$transaction(async (tx) => {
    await tx.productVariant.update({ where: { id: variantId }, data: { quantity: target } });
    if (delta !== 0) {
      await tx.inventoryLog.create({
        data: {
          productId: variant.productId,
          variantId: variant.id,
          type: 'MANUAL_ADJUSTMENT',
          quantityChange: delta,
          note: note?.trim() || 'Manual admin inventory adjustment'
        }
      });
    }
  });

  revalidatePath('/admin/inventory');
  revalidatePath('/admin/products');
  revalidatePath('/');
  return { ok: true, quantity: target };
}

export async function updateVariantThresholdAction(variantId: string, threshold: number): Promise<InventoryActionResult> {
  await requireAdmin();
  const value = Math.trunc(threshold);
  if (!Number.isFinite(value) || value < 0) {
    return { ok: false, message: 'Threshold must be a whole number ≥ 0.' };
  }
  const variant = await prisma.productVariant.update({
    where: { id: variantId },
    data: { lowStockThreshold: value },
    select: { quantity: true }
  });
  revalidatePath('/admin/inventory');
  return { ok: true, quantity: variant.quantity };
}

export async function setVariantActiveAction(variantId: string, isActive: boolean): Promise<InventoryActionResult> {
  await requireAdmin();
  const variant = await prisma.productVariant.update({
    where: { id: variantId },
    data: { isActive },
    select: { quantity: true }
  });
  revalidatePath('/admin/inventory');
  revalidatePath('/admin/products');
  revalidatePath('/');
  return { ok: true, quantity: variant.quantity };
}
