'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createProductAction, updateProductAction, type ActionIssue } from '@/features/admin/products/product-admin.actions';
import type { ProductInput } from '@/features/admin/products/product-admin.validation';
import { slugify } from '@/features/admin/shared/admin-format';
import { ImageUploadButton } from './ImageUploadButton';

type CategoryOption = { id: string; name: string; isActive: boolean };

type ImageState = { id?: string; url: string; alt: string; isPrimary: boolean; cloudinaryPublicId?: string };
type VariantState = {
  id?: string;
  sku: string;
  colorName: string;
  colorValue: string;
  size: string;
  price: string;
  compareAtPrice: string;
  quantity: string;
  lowStockThreshold: string;
  isActive: boolean;
};

export type ProductFormInitial = {
  id?: string;
  name: string;
  slug: string;
  subtitle: string;
  description: string;
  details: string[];
  careInstructions: string;
  brand: string;
  categoryId: string;
  basePrice: number | '';
  compareAtPrice?: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  tags: string[];
  images: ImageState[];
  variants: VariantState[];
};

const EMPTY_VARIANT: VariantState = {
  sku: '',
  colorName: '',
  colorValue: '',
  size: '',
  price: '',
  compareAtPrice: '',
  quantity: '0',
  lowStockThreshold: '5',
  isActive: true
};

export function buildEmptyProduct(): ProductFormInitial {
  return {
    name: '',
    slug: '',
    subtitle: '',
    description: '',
    details: [],
    careInstructions: '',
    brand: '',
    categoryId: '',
    basePrice: '',
    status: 'DRAFT',
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: false,
    tags: [],
    images: [],
    variants: [{ ...EMPTY_VARIANT }]
  };
}

function numberOrUndefined(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : undefined;
}

export function ProductForm({
  mode,
  productId,
  categories,
  initial
}: {
  mode: 'create' | 'edit';
  productId?: string;
  categories: CategoryOption[];
  initial: ProductFormInitial;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [slugEdited, setSlugEdited] = useState(mode === 'edit');
  const [subtitle, setSubtitle] = useState(initial.subtitle);
  const [description, setDescription] = useState(initial.description);
  const [details, setDetails] = useState(initial.details.join('\n'));
  const [careInstructions, setCareInstructions] = useState(initial.careInstructions);
  const [brand, setBrand] = useState(initial.brand);
  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [basePrice, setBasePrice] = useState(initial.basePrice === '' ? '' : String(initial.basePrice));
  const [compareAtPrice, setCompareAtPrice] = useState(initial.compareAtPrice != null ? String(initial.compareAtPrice) : '');
  const [status, setStatus] = useState(initial.status);
  const [isFeatured, setIsFeatured] = useState(initial.isFeatured);
  const [isNewArrival, setIsNewArrival] = useState(initial.isNewArrival);
  const [isBestSeller, setIsBestSeller] = useState(initial.isBestSeller);
  const [tags, setTags] = useState(initial.tags.join(', '));
  const [images, setImages] = useState<ImageState[]>(initial.images);
  const [variants, setVariants] = useState<VariantState[]>(initial.variants.length ? initial.variants : [{ ...EMPTY_VARIANT }]);

  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [issues, setIssues] = useState<Record<string, string>>({});

  const errorFor = (path: string) => issues[path];

  const activeVariantCount = useMemo(() => variants.filter((variant) => variant.isActive).length, [variants]);

  function onNameChange(value: string) {
    setName(value);
    if (!slugEdited) setSlug(slugify(value));
  }

  function setPrimaryImage(index: number) {
    setImages((prev) => prev.map((image, i) => ({ ...image, isPrimary: i === index })));
  }

  function updateImage(index: number, patch: Partial<ImageState>) {
    setImages((prev) => prev.map((image, i) => (i === index ? { ...image, ...patch } : image)));
  }

  function addUploadedImage(image: { secureUrl: string; publicId: string }) {
    setImages((prev) => [
      ...prev,
      { url: image.secureUrl, alt: '', isPrimary: prev.length === 0, cloudinaryPublicId: image.publicId }
    ]);
  }

  function updateVariant(index: number, patch: Partial<VariantState>) {
    setVariants((prev) => prev.map((variant, i) => (i === index ? { ...variant, ...patch } : variant)));
  }

  function buildPayload(): ProductInput {
    return {
      name: name.trim(),
      slug: slug.trim(),
      subtitle: subtitle.trim() || undefined,
      description: description.trim(),
      details: details.split('\n').map((line) => line.trim()).filter(Boolean),
      careInstructions: careInstructions.trim() || undefined,
      brand: brand.trim() || undefined,
      categoryId,
      basePrice: numberOrUndefined(basePrice) ?? Number.NaN,
      compareAtPrice: numberOrUndefined(compareAtPrice),
      status,
      isFeatured,
      isNewArrival,
      isBestSeller,
      tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      images: images.map((image, index) => ({
        id: image.id,
        url: image.url.trim(),
        alt: image.alt.trim() || undefined,
        sortOrder: index,
        isPrimary: image.isPrimary,
        cloudinaryPublicId: image.cloudinaryPublicId?.trim() || undefined
      })),
      variants: variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku.trim(),
        colorName: variant.colorName.trim() || undefined,
        colorValue: variant.colorValue.trim() || undefined,
        size: variant.size.trim() || undefined,
        price: numberOrUndefined(variant.price) ?? Number.NaN,
        compareAtPrice: numberOrUndefined(variant.compareAtPrice),
        quantity: numberOrUndefined(variant.quantity) ?? 0,
        lowStockThreshold: numberOrUndefined(variant.lowStockThreshold) ?? 0,
        isActive: variant.isActive
      }))
    };
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormMessage(null);
    setIssues({});

    const payload = buildPayload();
    startTransition(async () => {
      const result = mode === 'create'
        ? await createProductAction(payload)
        : await updateProductAction(productId as string, payload);

      // On success the action redirects; we only get here on failure.
      if (result && !result.ok) {
        setFormMessage(result.message);
        const map: Record<string, string> = {};
        result.issues.forEach((issue: ActionIssue) => {
          map[issue.path] = issue.message;
        });
        setIssues(map);
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  return (
    <form className="adminForm" onSubmit={handleSubmit}>
      {formMessage && <div className="adminAlert isError" role="alert">{formMessage}</div>}
      {status === 'ACTIVE' && activeVariantCount === 0 && (
        <div className="adminAlert isInfo">يحتاج المنتج النشط إلى خيار نشط واحد على الأقل قبل أن يُحفظ.</div>
      )}

      {/* Basics */}
      <div className="adminCard">
        <div className="adminCardHeader"><h2>أساسيات المنتج</h2></div>
        <div className="adminFormGrid two">
          <div className="adminField">
            <label htmlFor="p-name">الاسم *</label>
            <input id="p-name" className={errorFor('name') ? 'hasError' : ''} value={name} onChange={(e) => onNameChange(e.target.value)} required />
            {errorFor('name') && <span className="adminFieldError">{errorFor('name')}</span>}
          </div>
          <div className="adminField">
            <label htmlFor="p-slug">الـ slug *</label>
            <input
              id="p-slug"
              className={errorFor('slug') ? 'hasError' : ''}
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }}
              onBlur={(e) => setSlug(slugify(e.target.value))}
              required
            />
            {errorFor('slug') ? <span className="adminFieldError">{errorFor('slug')}</span> : <span className="adminFieldHint">يُستخدم في رابط المتجر. يُملأ تلقائياً من الاسم.</span>}
          </div>
          <div className="adminField spanTwo">
            <label htmlFor="p-subtitle">العنوان الفرعي</label>
            <input id="p-subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
          </div>
          <div className="adminField spanTwo">
            <label htmlFor="p-description">الوصف *</label>
            <textarea id="p-description" className={errorFor('description') ? 'hasError' : ''} value={description} onChange={(e) => setDescription(e.target.value)} required />
            {errorFor('description') && <span className="adminFieldError">{errorFor('description')}</span>}
          </div>
          <div className="adminField">
            <label htmlFor="p-details">التفاصيل (واحدة في كل سطر)</label>
            <textarea id="p-details" value={details} onChange={(e) => setDetails(e.target.value)} placeholder={'خامة ناعمة\nجاهز كهدية'} />
          </div>
          <div className="adminField">
            <label htmlFor="p-care">تعليمات العناية</label>
            <textarea id="p-care" value={careInstructions} onChange={(e) => setCareInstructions(e.target.value)} />
          </div>
          <div className="adminField">
            <label htmlFor="p-brand">العلامة التجارية</label>
            <input id="p-brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
          </div>
          <div className="adminField">
            <label htmlFor="p-tags">الوسوم (مفصولة بفواصل)</label>
            <input id="p-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="هدية، صيف" />
          </div>
        </div>
      </div>

      {/* Pricing & status */}
      <div className="adminCard">
        <div className="adminCardHeader"><h2>التسعير والحالة</h2></div>
        <div className="adminFormGrid two">
          <div className="adminField">
            <label htmlFor="p-category">التصنيف *</label>
            <select id="p-category" className={errorFor('categoryId') ? 'hasError' : ''} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
              <option value="">اختر تصنيفاً…</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}{category.isActive ? '' : ' (معطّل)'}</option>
              ))}
            </select>
            {errorFor('categoryId') && <span className="adminFieldError">{errorFor('categoryId')}</span>}
          </div>
          <div className="adminField">
            <label htmlFor="p-status">الحالة *</label>
            <select id="p-status" className={errorFor('status') ? 'hasError' : ''} value={status} onChange={(e) => setStatus(e.target.value as ProductFormInitial['status'])}>
              <option value="DRAFT">مسودة</option>
              <option value="ACTIVE">نشط</option>
              <option value="ARCHIVED">مؤرشف</option>
            </select>
            {errorFor('status') && <span className="adminFieldError">{errorFor('status')}</span>}
          </div>
          <div className="adminField">
            <label htmlFor="p-baseprice">السعر الأساسي (₪) *</label>
            <input id="p-baseprice" className={errorFor('basePrice') ? 'hasError' : ''} type="number" min="0" step="0.01" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} required />
            {errorFor('basePrice') && <span className="adminFieldError">{errorFor('basePrice')}</span>}
          </div>
          <div className="adminField">
            <label htmlFor="p-compareprice">السعر قبل الخصم (₪)</label>
            <input id="p-compareprice" className={errorFor('compareAtPrice') ? 'hasError' : ''} type="number" min="0" step="0.01" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} />
            {errorFor('compareAtPrice') && <span className="adminFieldError">{errorFor('compareAtPrice')}</span>}
          </div>
        </div>
        <div className="adminCheckRow" style={{ marginTop: 13 }}>
          <label className={`adminCheck${isFeatured ? ' isOn' : ''}`}><input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} /> مميز</label>
          <label className={`adminCheck${isNewArrival ? ' isOn' : ''}`}><input type="checkbox" checked={isNewArrival} onChange={(e) => setIsNewArrival(e.target.checked)} /> وصل حديثاً</label>
          <label className={`adminCheck${isBestSeller ? ' isOn' : ''}`}><input type="checkbox" checked={isBestSeller} onChange={(e) => setIsBestSeller(e.target.checked)} /> الأكثر مبيعاً</label>
        </div>
      </div>

      {/* Images */}
      <div className="adminCard">
        <div className="adminCardHeader">
          <div><h2>الصور</h2><p className="adminMuted">ارفعي صورة من جهازك أو أدخلي رابط الصورة يدوياً. الصورة الرئيسية تظهر أولاً.</p></div>
          <div className="adminBtnRow">
            <ImageUploadButton kind="product" onUploaded={addUploadedImage} label="رفع صورة" />
            <button type="button" className="adminBtn adminBtnGhost adminBtnSm" onClick={() => setImages((prev) => [...prev, { url: '', alt: '', isPrimary: prev.length === 0 }])}>+ رابط صورة</button>
          </div>
        </div>
        {errorFor('images') && <div className="adminAlert isError" style={{ marginBottom: 10 }}>{errorFor('images')}</div>}
        {images.length === 0 ? (
          <div className="adminEmptyState">لا توجد صور بعد. سيستخدم المتجر صورة افتراضية.</div>
        ) : (
          images.map((image, index) => (
            <div className="adminRepeatRow" key={index}>
              <div className="adminRepeatHeader">
                <strong>صورة {index + 1}{image.cloudinaryPublicId ? ' · Cloudinary' : ''}</strong>
                <button type="button" className="adminBtn adminBtnDanger adminBtnSm" onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}>حذف الصورة</button>
              </div>
              <div className="adminImageRow">
                {image.url ? (
                  <img className="adminImagePreview" src={image.url} alt={image.alt || `صورة ${index + 1}`} />
                ) : (
                  <div className="adminImagePreview adminImagePreviewEmpty" aria-hidden="true">لا معاينة</div>
                )}
                <div className="adminRepeatGrid" style={{ flex: 1, minWidth: 0 }}>
                  <div className="adminField">
                    <label>رابط الصورة *</label>
                    <input className={errorFor(`images.${index}.url`) ? 'hasError' : ''} value={image.url} onChange={(e) => updateImage(index, { url: e.target.value })} placeholder="/mock-products/bag-camel.svg" />
                    {errorFor(`images.${index}.url`) && <span className="adminFieldError">{errorFor(`images.${index}.url`)}</span>}
                  </div>
                  <div className="adminField">
                    <label>النص البديل</label>
                    <input value={image.alt} onChange={(e) => updateImage(index, { alt: e.target.value })} />
                  </div>
                </div>
              </div>
              <label className={`adminCheck${image.isPrimary ? ' isOn' : ''}`} style={{ width: 'fit-content' }}>
                <input type="radio" name="primaryImage" checked={image.isPrimary} onChange={() => setPrimaryImage(index)} /> الصورة الرئيسية
              </label>
            </div>
          ))
        )}
      </div>

      {/* Variants */}
      <div className="adminCard">
        <div className="adminCardHeader">
          <div><h2>الخيارات</h2><p className="adminMuted">{activeVariantCount} نشط · {variants.length} إجمالاً. يجب أن تكون قيم الـ SKU فريدة.</p></div>
          <button type="button" className="adminBtn adminBtnGhost adminBtnSm" onClick={() => setVariants((prev) => [...prev, { ...EMPTY_VARIANT }])}>+ إضافة خيار</button>
        </div>
        {variants.map((variant, index) => (
          <div className="adminRepeatRow" key={index}>
            <div className="adminRepeatHeader">
              <strong>الخيار {index + 1}{variant.sku ? ` · ${variant.sku}` : ''}</strong>
              {variants.length > 1 && (
                <button type="button" className="adminBtn adminBtnDanger adminBtnSm" onClick={() => setVariants((prev) => prev.filter((_, i) => i !== index))}>إزالة</button>
              )}
            </div>
            <div className="adminRepeatGrid">
              <div className="adminField">
                <label>الـ SKU *</label>
                <input className={errorFor(`variants.${index}.sku`) ? 'hasError' : ''} value={variant.sku} onChange={(e) => updateVariant(index, { sku: e.target.value })} />
                {errorFor(`variants.${index}.sku`) && <span className="adminFieldError">{errorFor(`variants.${index}.sku`)}</span>}
              </div>
              <div className="adminField">
                <label>المقاس</label>
                <input value={variant.size} onChange={(e) => updateVariant(index, { size: e.target.value })} />
              </div>
              <div className="adminField">
                <label>اسم اللون</label>
                <input value={variant.colorName} onChange={(e) => updateVariant(index, { colorName: e.target.value })} />
              </div>
              <div className="adminField">
                <label>قيمة اللون (hex)</label>
                <input value={variant.colorValue} onChange={(e) => updateVariant(index, { colorValue: e.target.value })} placeholder="#bd8754" />
              </div>
              <div className="adminField">
                <label>السعر (₪) *</label>
                <input className={errorFor(`variants.${index}.price`) ? 'hasError' : ''} type="number" min="0" step="0.01" value={variant.price} onChange={(e) => updateVariant(index, { price: e.target.value })} />
                {errorFor(`variants.${index}.price`) && <span className="adminFieldError">{errorFor(`variants.${index}.price`)}</span>}
              </div>
              <div className="adminField">
                <label>السعر قبل الخصم (₪)</label>
                <input type="number" min="0" step="0.01" value={variant.compareAtPrice} onChange={(e) => updateVariant(index, { compareAtPrice: e.target.value })} />
              </div>
              <div className="adminField">
                <label>الكمية *</label>
                <input className={errorFor(`variants.${index}.quantity`) ? 'hasError' : ''} type="number" min="0" step="1" value={variant.quantity} onChange={(e) => updateVariant(index, { quantity: e.target.value })} />
                {errorFor(`variants.${index}.quantity`) && <span className="adminFieldError">{errorFor(`variants.${index}.quantity`)}</span>}
              </div>
              <div className="adminField">
                <label>حد المخزون المنخفض</label>
                <input type="number" min="0" step="1" value={variant.lowStockThreshold} onChange={(e) => updateVariant(index, { lowStockThreshold: e.target.value })} />
              </div>
            </div>
            <label className={`adminCheck${variant.isActive ? ' isOn' : ''}`} style={{ width: 'fit-content' }}>
              <input type="checkbox" checked={variant.isActive} onChange={(e) => updateVariant(index, { isActive: e.target.checked })} /> خيار نشط
            </label>
          </div>
        ))}
      </div>

      <div className="adminBtnRow">
        <button type="submit" className="adminBtn adminBtnPrimary" disabled={pending}>
          {pending ? 'جارٍ الحفظ…' : mode === 'create' ? 'إنشاء المنتج' : 'حفظ التغييرات'}
        </button>
        <button type="button" className="adminBtn adminBtnGhost" disabled={pending} onClick={() => router.push('/admin/products')}>إلغاء</button>
      </div>
    </form>
  );
}
