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


function revalidateProductCatalog(productSlugs: Iterable<string>, categorySlugs: Iterable<string>) {
  revalidatePath('/admin/products');
  revalidatePath('/');
  revalidatePath('/category/new-in');
  revalidatePath('/category/sale');
  for (const slug of categorySlugs) revalidatePath(`/category/${slug}`);
  for (const slug of productSlugs) revalidatePath(`/product/${slug}`);
}

async function assertUniqueSlug(slug: string, ignoreId?: string): Promise<ActionIssue | null> {
  const existing = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
  if (existing && existing.id !== ignoreId) {
    return { path: 'slug', message: 'This slug is already used by another product' };
  }
  return null;
}

async function assertUniqueSkus(variants: ProductParsed['variants'], ignoreVariantIds: string[] = []): Promise<ActionIssue[]> {
  const skus = [...new Set(variants.map((variant) => variant.sku.trim()).filter(Boolean))];
  if (skus.length === 0) return [];

  const clashes = await prisma.productVariant.findMany({
    where: {
      sku: { in: skus },
      ...(ignoreVariantIds.length ? { id: { notIn: ignoreVariantIds } } : {})
    },
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

function submittedVariantIds(variants: ProductParsed['variants']): string[] {
  return variants.flatMap((variant) => (variant.id ? [variant.id] : []));
}

function variantScalarData(variant: ProductParsed['variants'][number]) {
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

function toVariantCreateData(variant: ProductParsed['variants'][number]): Prisma.ProductVariantCreateWithoutProductInput {
  return variantScalarData(variant);
}

function toVariantCreateManyData(productId: string, variant: ProductParsed['variants'][number]): Prisma.ProductVariantCreateManyInput {
  return {
    productId,
    ...variantScalarData(variant)
  };
}

function toVariantUpdateData(variant: ProductParsed['variants'][number]): Prisma.ProductVariantUpdateManyMutationInput {
  return variantScalarData(variant);
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
  const product = await prisma.product.create({
    data: {
      ...(productScalarData(data) as Prisma.ProductCreateInput),
      category: { connect: { id: data.categoryId } },
      images: { create: images.map((image, index) => ({ url: image.url, alt: image.alt, sortOrder: image.sortOrder ?? index, isPrimary: image.isPrimary, cloudinaryPublicId: image.cloudinaryPublicId ?? null })) },
      variants: { create: data.variants.map(toVariantCreateData) }
    },
    select: { slug: true, category: { select: { slug: true } } }
  });

  revalidateProductCatalog([product.slug], [product.category.slug]);
  redirect('/admin/products');
}

export async function updateProductAction(id: string, input: ProductInput): Promise<SaveResult> {
  await requireAdmin();

  const existing = await prisma.product.findUnique({
    where: { id },
    select: { id: true, slug: true, category: { select: { slug: true } } }
  });
  if (!existing) return fail('Product not found.');

  const parsed = productInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail('Please fix the highlighted fields.', parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })));
  }
  const data = parsed.data;

  const issues: ActionIssue[] = [];
  const slugIssue = await assertUniqueSlug(data.slug, id);
  if (slugIssue) issues.push(slugIssue);
  issues.push(...(await assertUniqueSkus(data.variants, submittedVariantIds(data.variants))));
  if (issues.length) return fail('Please fix the highlighted fields.', issues);

  const images = withPrimaryImage(data.images);

  try {
    // Read the current variant IDs before building the write batch.
    // This lets us preserve existing IDs, verify ownership, and avoid the
    // fragile long-lived interactive transaction that was expiring in dev.
    const existingVariants = await prisma.productVariant.findMany({
      where: { productId: id },
      select: { id: true }
    });
    const existingIds = new Set(existingVariants.map((variant) => variant.id));
    const incomingIds = submittedVariantIds(data.variants);

    for (const variantId of incomingIds) {
      if (!existingIds.has(variantId)) {
        throw new Error('VARIANT_NOT_FOUND_FOR_PRODUCT');
      }
    }

    const incomingIdSet = new Set(incomingIds);
    const removedIds = existingVariants
      .map((variant) => variant.id)
      .filter((variantId) => !incomingIdSet.has(variantId));

    const existingVariantWrites = data.variants
      .filter((variant): variant is ProductParsed['variants'][number] & { id: string } => Boolean(variant.id))
      .map((variant) =>
        prisma.productVariant.updateMany({
          where: { id: variant.id, productId: id },
          data: toVariantUpdateData(variant)
        })
      );

    const newVariants = data.variants.filter((variant) => !variant.id);

    const operations: Prisma.PrismaPromise<unknown>[] = [
      prisma.product.update({
        where: { id },
        data: { ...productScalarData(data), category: { connect: { id: data.categoryId } } }
      }),
      // Sync images: replace wholesale (images cascade from product only, safe to rebuild).
      prisma.productImage.deleteMany({ where: { productId: id } })
    ];

    if (images.length) {
      operations.push(
        prisma.productImage.createMany({
          data: images.map((image, index) => ({
            productId: id,
            url: image.url,
            alt: image.alt ?? null,
            sortOrder: image.sortOrder ?? index,
            isPrimary: image.isPrimary,
            cloudinaryPublicId: image.cloudinaryPublicId ?? null
          }))
        })
      );
    }

    // Never hard-delete ProductVariant rows. Existing variants may be referenced
    // by OrderItem and InventoryLog, so removed rows are only disabled.
    if (removedIds.length) {
      operations.push(
        prisma.productVariant.updateMany({
          where: { productId: id, id: { in: removedIds } },
          data: { isActive: false }
        })
      );
    }

    operations.push(...existingVariantWrites);

    if (newVariants.length) {
      operations.push(
        prisma.productVariant.createMany({
          data: newVariants.map((variant) => toVariantCreateManyData(id, variant))
        })
      );
    }

    // Use Prisma's batched transaction instead of an interactive transaction.
    // The previous async callback transaction could expire while many variant
    // writes were still running, then fail with P2028 Transaction not found.
    await prisma.$transaction(operations);

  } catch (error) {
    if (error instanceof Error && error.message === 'VARIANT_NOT_FOUND_FOR_PRODUCT') {
      return fail('Variant not found for this product. Please refresh the page and try again.');
    }
    throw error;
  }

  const updated = await prisma.product.findUnique({
    where: { id },
    select: { slug: true, category: { select: { slug: true } } }
  });

  revalidatePath(`/admin/products/${id}/edit`);
  revalidateProductCatalog(
    [existing.slug, updated?.slug].filter((slug): slug is string => Boolean(slug)),
    [existing.category.slug, updated?.category.slug].filter((slug): slug is string => Boolean(slug))
  );
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

  const product = await prisma.product.update({
    where: { id },
    data: { status },
    select: { slug: true, category: { select: { slug: true } } }
  });
  revalidateProductCatalog([product.slug], [product.category.slug]);
  return { ok: true };
}
