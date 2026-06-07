'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { Prisma, ProductStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/features/admin/auth/admin-auth';
import { productInputSchema, type ProductInput, type ProductParsed } from './product-admin.validation';

export type ActionIssue = { path: string; message: string };
export type SaveResult = { ok: true; id: string } | { ok: false; message: string; issues: ActionIssue[] };

function fail(message: string, issues: ActionIssue[] = []): SaveResult {
  return { ok: false, message, issues };
}

/** Normalise one primary image: if none flagged, the first becomes primary. */
function withPrimaryImage(images: ProductParsed['images']) {
  if (images.length === 0) return images;
  if (images.some((image) => image.isPrimary)) return images;
  return images.map((image, index) => ({ ...image, isPrimary: index === 0 }));
}

async function assertUniqueSlug(slug: string, ignoreId?: string): Promise<ActionIssue | null> {
  const existing = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
  if (existing && existing.id !== ignoreId) {
    return { path: 'slug', message: 'This slug is already used by another product' };
  }
  return null;
}

async function assertUniqueSkus(variants: ProductParsed['variants'], ignoreProductId?: string): Promise<ActionIssue[]> {
  const skus = variants.map((variant) => variant.sku);
  if (skus.length === 0) return [];
  const clashes = await prisma.productVariant.findMany({
    where: { sku: { in: skus }, ...(ignoreProductId ? { productId: { not: ignoreProductId } } : {}) },
    select: { sku: true }
  });
  const clashed = new Set(clashes.map((c) => c.sku));
  const issues: ActionIssue[] = [];
  variants.forEach((variant, index) => {
    if (clashed.has(variant.sku)) {
      issues.push({ path: `variants.${index}.sku`, message: `SKU "${variant.sku}" already exists` });
    }
  });
  return issues;
}

function toVariantCreate(variant: ProductParsed['variants'][number]): Prisma.ProductVariantCreateWithoutProductInput {
  return {
    sku: variant.sku,
    colorName: variant.colorName,
    colorValue: variant.colorValue,
    size: variant.size,
    price: variant.price,
    compareAtPrice: variant.compareAtPrice,
    quantity: variant.quantity,
    lowStockThreshold: variant.lowStockThreshold,
    isActive: variant.isActive
  };
}

function productScalarData(data: ProductParsed): Prisma.ProductUpdateInput {
  return {
    name: data.name,
    slug: data.slug,
    subtitle: data.subtitle ?? null,
    description: data.description,
    details: data.details,
    careInstructions: data.careInstructions ?? null,
    brand: data.brand ?? null,
    basePrice: data.basePrice,
    compareAtPrice: data.compareAtPrice ?? null,
    status: data.status,
    isFeatured: data.isFeatured,
    isNewArrival: data.isNewArrival,
    isBestSeller: data.isBestSeller,
    tags: data.tags
  };
}

export async function createProductAction(input: ProductInput): Promise<SaveResult> {
  await requireAdmin();

  const parsed = productInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail('Please fix the highlighted fields.', parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })));
  }
  const data = parsed.data;

  const issues: ActionIssue[] = [];
  const slugIssue = await assertUniqueSlug(data.slug);
  if (slugIssue) issues.push(slugIssue);
  issues.push(...(await assertUniqueSkus(data.variants)));
  if (issues.length) return fail('Please fix the highlighted fields.', issues);

  const images = withPrimaryImage(data.images);
  await prisma.product.create({
    data: {
      ...(productScalarData(data) as Prisma.ProductCreateInput),
      category: { connect: { id: data.categoryId } },
      images: { create: images.map((image, index) => ({ url: image.url, alt: image.alt, sortOrder: image.sortOrder ?? index, isPrimary: image.isPrimary, cloudinaryPublicId: image.cloudinaryPublicId ?? null })) },
      variants: { create: data.variants.map(toVariantCreate) }
    },
    select: { id: true }
  });

  revalidatePath('/admin/products');
  revalidatePath('/');
  redirect('/admin/products');
}

export async function updateProductAction(id: string, input: ProductInput): Promise<SaveResult> {
  await requireAdmin();

  const existing = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return fail('Product not found.');

  const parsed = productInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail('Please fix the highlighted fields.', parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })));
  }
  const data = parsed.data;

  const issues: ActionIssue[] = [];
  const slugIssue = await assertUniqueSlug(data.slug, id);
  if (slugIssue) issues.push(slugIssue);
  issues.push(...(await assertUniqueSkus(data.variants, id)));
  if (issues.length) return fail('Please fix the highlighted fields.', issues);

  const images = withPrimaryImage(data.images);

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: { ...productScalarData(data), category: { connect: { id: data.categoryId } } }
    });

    // Sync images: replace wholesale (images cascade from product only, safe to rebuild).
    await tx.productImage.deleteMany({ where: { productId: id } });
    if (images.length) {
      await tx.productImage.createMany({
        data: images.map((image, index) => ({
          productId: id,
          url: image.url,
          alt: image.alt ?? null,
          sortOrder: image.sortOrder ?? index,
          isPrimary: image.isPrimary,
          cloudinaryPublicId: image.cloudinaryPublicId ?? null
        }))
      });
    }

    // Sync variants.
    //
    // SAFETY: ProductVariant rows are referenced by OrderItem and InventoryLog.
    //   - InventoryLog.variantId has onDelete: Cascade → hard-deleting a variant
    //     would destroy audit history. Never hard-delete.
    //   - OrderItem.variantId has onDelete: SetNull → hard-delete is DB-safe but
    //     loses the live link to historical orders.
    //
    // Strategy:
    //   1. Variants with an id that appear in the payload → update in-place.
    //   2. Variants with an id that are ABSENT from the payload → mark isActive=false
    //      (soft-delete; they remain in the DB and all history is preserved).
    //      The form keeps id-ed variants in the payload (as inactive) when the
    //      admin uses "Deactivate" so step 2 normally fires only for unexpected
    //      omissions.
    //   3. Variants without an id → create new.

    const incomingIds = data.variants
      .filter((variant) => variant.id)
      .map((variant) => variant.id as string);

    // Soft-delete any DB variant not present in the incoming payload
    if (incomingIds.length > 0) {
      await tx.productVariant.updateMany({
        where: { productId: id, id: { notIn: incomingIds } },
        data: { isActive: false }
      });
    } else {
      // No id-ed variants incoming → mark ALL existing ones inactive
      await tx.productVariant.updateMany({
        where: { productId: id },
        data: { isActive: false }
      });
    }

    for (const variant of data.variants) {
      if (variant.id) {
        await tx.productVariant.update({ where: { id: variant.id }, data: toVariantCreate(variant) });
      } else {
        await tx.productVariant.create({ data: { ...toVariantCreate(variant), product: { connect: { id } } } });
      }
    }
  });

  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${id}/edit`);
  revalidatePath('/');
  redirect('/admin/products');
}

export async function setProductStatusAction(id: string, status: ProductStatus): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin();

  if (status === 'ACTIVE') {
    const activeVariants = await prisma.productVariant.count({ where: { productId: id, isActive: true } });
    if (activeVariants === 0) {
      return { ok: false, message: 'Cannot activate: product has no active variants.' };
    }
  }

  await prisma.product.update({ where: { id }, data: { status } });
  revalidatePath('/admin/products');
  revalidatePath('/');
  return { ok: true };
}
