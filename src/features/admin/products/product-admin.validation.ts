import { z } from 'zod';

export const PRODUCT_STATUSES = ['DRAFT', 'ACTIVE', 'ARCHIVED'] as const;

/** Accept absolute http(s) URLs or root-relative paths (e.g. /mock-products/x.svg). */
function isValidImageUrl(value: string): boolean {
  if (value.startsWith('/')) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

const slugSchema = z
  .string()
  .trim()
  .min(1, 'Slug is required')
  .max(120, 'Slug is too long')
  .regex(/^[\p{Letter}\p{Number}]+(?:-[\p{Letter}\p{Number}]+)*$/u, 'Use lowercase letters, numbers and dashes only');

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const variantInputSchema = z.object({
  id: z.string().optional(),
  sku: z.string().trim().min(1, 'SKU is required').max(64, 'SKU is too long'),
  colorName: optionalText,
  colorValue: optionalText,
  size: optionalText,
  price: z.coerce.number().min(0, 'Price must be ≥ 0'),
  compareAtPrice: z
    .union([z.coerce.number().min(0, 'Compare-at price must be ≥ 0'), z.literal('').transform(() => undefined)])
    .optional(),
  quantity: z.coerce.number().int('Quantity must be a whole number').min(0, 'Quantity must be ≥ 0'),
  lowStockThreshold: z.coerce.number().int('Threshold must be a whole number').min(0, 'Threshold must be ≥ 0'),
  isActive: z.boolean()
});

export const imageInputSchema = z.object({
  id: z.string().optional(),
  url: z.string().trim().min(1, 'Image URL is required').refine(isValidImageUrl, 'Enter a valid URL or a path starting with /'),
  alt: optionalText,
  sortOrder: z.coerce.number().int().min(0).default(0),
  isPrimary: z.boolean().default(false),
  cloudinaryPublicId: optionalText
});

export const productInputSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(160, 'Name is too long'),
    slug: slugSchema,
    subtitle: optionalText,
    description: z.string().trim().min(1, 'Description is required'),
    details: z.array(z.string().trim()).optional().default([]),
    careInstructions: optionalText,
    brand: optionalText,
    categoryId: z.string().trim().min(1, 'Category is required'),
    basePrice: z.coerce.number().min(0, 'Base price must be ≥ 0'),
    compareAtPrice: z
      .union([z.coerce.number().min(0, 'Compare-at price must be ≥ 0'), z.literal('').transform(() => undefined)])
      .optional(),
    status: z.enum(PRODUCT_STATUSES),
    isFeatured: z.boolean().default(false),
    isNewArrival: z.boolean().default(false),
    isBestSeller: z.boolean().default(false),
    tags: z.array(z.string().trim().min(1)).default([]),
    images: z.array(imageInputSchema).default([]),
    variants: z.array(variantInputSchema).default([])
  })
  .superRefine((data, ctx) => {
    // Unique SKUs within the form
    const seen = new Map<string, number>();
    data.variants.forEach((variant, index) => {
      const key = variant.sku.trim().toLowerCase();
      if (seen.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate SKU "${variant.sku}" in this product`,
          path: ['variants', index, 'sku']
        });
      } else {
        seen.set(key, index);
      }
    });

    // Exactly one primary image (if any images exist)
    const primaryCount = data.images.filter((image) => image.isPrimary).length;
    if (data.images.length > 0 && primaryCount > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Only one image can be primary',
        path: ['images']
      });
    }

    // ACTIVE products must have at least one active variant
    if (data.status === 'ACTIVE' && !data.variants.some((variant) => variant.isActive)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'An ACTIVE product needs at least one active variant',
        path: ['status']
      });
    }
  });

export type ProductInput = z.input<typeof productInputSchema>;
export type ProductParsed = z.output<typeof productInputSchema>;
export type VariantInput = z.input<typeof variantInputSchema>;
export type ImageInput = z.input<typeof imageInputSchema>;
