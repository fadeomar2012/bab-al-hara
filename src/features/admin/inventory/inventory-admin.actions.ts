'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/features/admin/auth/admin-auth';

export type InventoryActionResult = { ok: true; quantity: number } | { ok: false; message: string };

type VariantForInventoryAction = {
  id: string;
  productId: string;
  quantity: number;
  product: { slug: string; category: { slug: string } | null };
};

function revalidateInventoryViews(productSlug?: string, categorySlug?: string | null) {
  revalidatePath('/admin/inventory');
  revalidatePath('/admin/products');
  revalidatePath('/');
  revalidatePath('/category/new-in');
  revalidatePath('/category/sale');
  if (categorySlug) revalidatePath(`/category/${categorySlug}`);
  if (productSlug) revalidatePath(`/product/${productSlug}`);
}

async function lockVariantForUpdate(tx: Prisma.TransactionClient, variantId: string): Promise<void> {
  await tx.$queryRaw(Prisma.sql`SELECT id FROM "ProductVariant" WHERE id = ${variantId} FOR UPDATE`);
}

async function readVariantForInventoryAction(
  tx: Prisma.TransactionClient,
  variantId: string
): Promise<VariantForInventoryAction | null> {
  return tx.productVariant.findUnique({
    where: { id: variantId },
    select: {
      id: true,
      productId: true,
      quantity: true,
      product: { select: { slug: true, category: { select: { slug: true } } } }
    }
  });
}

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

  let productSlug: string | undefined;
  let categorySlug: string | null | undefined;

  try {
    const quantity = await prisma.$transaction(async (tx) => {
      // Lock first, then read and calculate the delta inside the same transaction.
      // This prevents concurrent admin adjustments from writing a wrong inventory delta.
      await lockVariantForUpdate(tx, variantId);
      const variant = await readVariantForInventoryAction(tx, variantId);
      if (!variant) throw new Error('VARIANT_NOT_FOUND');

      productSlug = variant.product.slug;
      categorySlug = variant.product.category?.slug ?? null;
      const delta = target - variant.quantity;

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

      return target;
    });

    revalidateInventoryViews(productSlug, categorySlug);
    return { ok: true, quantity };
  } catch (error) {
    if (error instanceof Error && error.message === 'VARIANT_NOT_FOUND') {
      return { ok: false, message: 'Variant not found.' };
    }
    throw error;
  }
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
    select: { quantity: true, product: { select: { slug: true, category: { select: { slug: true } } } } }
  });
  revalidateInventoryViews(variant.product.slug, variant.product.category?.slug ?? null);
  return { ok: true, quantity: variant.quantity };
}

export async function setVariantActiveAction(variantId: string, isActive: boolean): Promise<InventoryActionResult> {
  await requireAdmin();
  const variant = await prisma.productVariant.update({
    where: { id: variantId },
    data: { isActive },
    select: { quantity: true, product: { select: { slug: true, category: { select: { slug: true } } } } }
  });
  revalidateInventoryViews(variant.product.slug, variant.product.category?.slug ?? null);
  return { ok: true, quantity: variant.quantity };
}
