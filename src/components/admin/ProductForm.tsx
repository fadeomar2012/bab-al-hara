'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createProductAction, updateProductAction, type ActionIssue } from '@/features/admin/products/product-admin.actions';
import type { ProductInput } from '@/features/admin/products/product-admin.validation';
import { slugify } from '@/features/admin/shared/admin-format';
import { ImageUploadButton } from './ImageUploadButton';
import { VariantBuilder, type VariantState } from './VariantBuilder';
import { ColorSelector, type ColorValue } from './ColorSelector';

type CategoryOption = { id: string; name: string; isActive: boolean };
type ImageState = { id?: string; url: string; alt: string; isPrimary: boolean; cloudinaryPublicId?: string };

// Re-export so external callers can use the type
export type { VariantState };

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

export function buildEmptyProduct(): ProductFormInitial {
  return {
    name: '', slug: '', subtitle: '', description: '', details: [],
    careInstructions: '', brand: '', categoryId: '', basePrice: '',
    status: 'DRAFT', isFeatured: false, isNewArrival: false, isBestSeller: false,
    tags: [], images: [], variants: []
  };
}

function numberOrUndefined(value: string): number | undefined {
  const t = value.trim();
  if (t === '') return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

// ── Matrix row (editable inline) ─────────────────────────────────────────────

type MatrixRowProps = {
  variant: VariantState;
  index: number;
  errorFor: (path: string) => string | undefined;
  onChange: (index: number, patch: Partial<VariantState>) => void;
  onRemove: (index: number) => void;
};

function MatrixRow({ variant, index, errorFor, onChange, onRemove }: MatrixRowProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const inactive = !variant.isActive;

  return (
    <div className={`vmCard${inactive ? ' vmInactive' : ''}`}>
      <div className="vmCardHead">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {variant.colorValue && (
            <span className="colorPreviewCircle sm" style={{ background: variant.colorValue }} aria-hidden="true" />
          )}
          <strong style={{ fontSize: 14 }}>
            {variant.colorName || '—'} · {variant.size || 'مقاس موحد'}
          </strong>
          {variant.id && <span className="adminBadge isArchived" style={{ fontSize: 11 }}>موجود</span>}
          {inactive && <span className="adminBadge stockOut" style={{ fontSize: 11 }}>معطّل</span>}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <label className={`adminCheck${variant.isActive ? ' isOn' : ''}`} style={{ minHeight: 0, padding: '5px 10px' }}>
            <input type="checkbox" checked={variant.isActive} onChange={(e) => onChange(index, { isActive: e.target.checked })} />
            {variant.isActive ? 'نشط' : 'معطّل'}
          </label>
          <button
            type="button"
            className="adminBtn adminBtnDanger adminBtnSm"
            onClick={() => onRemove(index)}
            title={variant.id ? 'تعطيل الخيار (سيظل موجوداً في الطلبات القديمة)' : 'إزالة الخيار'}
          >
            {variant.id ? 'تعطيل' : 'إزالة'}
          </button>
        </div>
      </div>

      <div className="adminRepeatGrid">
        {/* SKU */}
        <div className="adminField">
          <label>الـ SKU *</label>
          <input
            className={errorFor(`variants.${index}.sku`) ? 'hasError' : ''}
            value={variant.sku}
            onChange={(e) => onChange(index, { sku: e.target.value })}
          />
          {errorFor(`variants.${index}.sku`) && (
            <span className="adminFieldError">{errorFor(`variants.${index}.sku`)}</span>
          )}
        </div>

        {/* Size */}
        <div className="adminField">
          <label>المقاس</label>
          <input value={variant.size} onChange={(e) => onChange(index, { size: e.target.value })} />
        </div>

        {/* Price */}
        <div className="adminField">
          <label>السعر (₪) *</label>
          <input
            className={errorFor(`variants.${index}.price`) ? 'hasError' : ''}
            type="number" min="0" step="0.01"
            value={variant.price}
            onChange={(e) => onChange(index, { price: e.target.value })}
          />
          {errorFor(`variants.${index}.price`) && (
            <span className="adminFieldError">{errorFor(`variants.${index}.price`)}</span>
          )}
        </div>

        {/* Compare-at */}
        <div className="adminField">
          <label>قبل الخصم (₪)</label>
          <input type="number" min="0" step="0.01" value={variant.compareAtPrice} onChange={(e) => onChange(index, { compareAtPrice: e.target.value })} />
        </div>

        {/* Qty */}
        <div className="adminField">
          <label>الكمية *</label>
          <input
            className={errorFor(`variants.${index}.quantity`) ? 'hasError' : ''}
            type="number" min="0" step="1"
            value={variant.quantity}
            onChange={(e) => onChange(index, { quantity: e.target.value })}
          />
          {errorFor(`variants.${index}.quantity`) && (
            <span className="adminFieldError">{errorFor(`variants.${index}.quantity`)}</span>
          )}
        </div>

        {/* Threshold */}
        <div className="adminField">
          <label>حد المخزون المنخفض</label>
          <input type="number" min="0" step="1" value={variant.lowStockThreshold} onChange={(e) => onChange(index, { lowStockThreshold: e.target.value })} />
        </div>
      </div>

      {/* Colour editor (collapsible) */}
      <div>
        <button
          type="button"
          className="adminBtn adminBtnGhost adminBtnSm"
          onClick={() => setShowColorPicker((v) => !v)}
          style={{ marginBottom: showColorPicker ? 10 : 0 }}
        >
          {showColorPicker ? 'إغلاق محرر اللون' : '✏️ تعديل اللون'}
        </button>
        {showColorPicker && (
          <ColorSelector
            colorName={variant.colorName}
            colorValue={variant.colorValue}
            onChange={(v: ColorValue) => onChange(index, { colorName: v.colorName, colorValue: v.colorValue })}
          />
        )}
      </div>
    </div>
  );
}

// ── ProductForm ───────────────────────────────────────────────────────────────

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

  // ── Core field state ──────────────────────────────────────────────────────
  const [name,             setName]             = useState(initial.name);
  const [slug,             setSlug]             = useState(initial.slug);
  const [slugEdited,       setSlugEdited]       = useState(mode === 'edit');
  const [subtitle,         setSubtitle]         = useState(initial.subtitle);
  const [description,      setDescription]      = useState(initial.description);
  const [details,          setDetails]          = useState(initial.details.join('\n'));
  const [careInstructions, setCareInstructions] = useState(initial.careInstructions);
  const [brand,            setBrand]            = useState(initial.brand);
  const [categoryId,       setCategoryId]       = useState(initial.categoryId);
  const [basePrice,        setBasePrice]        = useState(initial.basePrice === '' ? '' : String(initial.basePrice));
  const [compareAtPrice,   setCompareAtPrice]   = useState(initial.compareAtPrice != null ? String(initial.compareAtPrice) : '');
  const [status,           setStatus]           = useState(initial.status);
  const [isFeatured,       setIsFeatured]       = useState(initial.isFeatured);
  const [isNewArrival,     setIsNewArrival]     = useState(initial.isNewArrival);
  const [isBestSeller,     setIsBestSeller]     = useState(initial.isBestSeller);
  const [tags,             setTags]             = useState(initial.tags.join(', '));
  const [images,           setImages]           = useState<ImageState[]>(initial.images);
  const [variants,         setVariants]         = useState<VariantState[]>(initial.variants);

  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [issues,      setIssues]      = useState<Record<string, string>>({});
  const [showBuilder, setShowBuilder] = useState(true);

  const errorFor = (path: string) => issues[path];

  const activeVariants  = useMemo(() => variants.filter((v) => v.isActive), [variants]);
  const activeCount     = activeVariants.length;
  const totalCount      = variants.length;
  const colorSet        = useMemo(() => new Set(activeVariants.filter((v) => v.colorName).map((v) => v.colorName.toLowerCase())), [activeVariants]);
  const sizeSet         = useMemo(() => new Set(activeVariants.filter((v) => v.size).map((v) => v.size.toLowerCase())), [activeVariants]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function onNameChange(value: string) {
    setName(value);
    if (!slugEdited) setSlug(slugify(value));
  }

  function updateVariant(index: number, patch: Partial<VariantState>) {
    setVariants((prev) => prev.map((v, i) => i === index ? { ...v, ...patch } : v));
  }

  function removeVariant(index: number) {
    const variant = variants[index];
    if (variant.id) {
      // Existing DB record — mark inactive to preserve order/inventory history
      updateVariant(index, { isActive: false });
    } else {
      // Unsaved new row — safe to splice out
      setVariants((prev) => prev.filter((_, i) => i !== index));
    }
  }

  function addManualVariant() {
    setVariants((prev) => [
      ...prev,
      { sku: '', colorName: '', colorValue: '', size: '', price: basePrice, compareAtPrice, quantity: '0', lowStockThreshold: '5', isActive: true }
    ]);
  }

  function handleGenerate(newVariants: VariantState[]) {
    setVariants((prev) => [...prev, ...newVariants]);
  }

  // ── Image helpers ─────────────────────────────────────────────────────────

  function setPrimaryImage(index: number) {
    setImages((prev) => prev.map((img, i) => ({ ...img, isPrimary: i === index })));
  }
  function updateImage(index: number, patch: Partial<ImageState>) {
    setImages((prev) => prev.map((img, i) => i === index ? { ...img, ...patch } : img));
  }
  function addUploadedImage(image: { secureUrl: string; publicId: string }) {
    setImages((prev) => [
      ...prev,
      { url: image.secureUrl, alt: '', isPrimary: prev.length === 0, cloudinaryPublicId: image.publicId }
    ]);
  }

  // ── Payload + submit ──────────────────────────────────────────────────────

  function buildPayload(): ProductInput {
    return {
      name: name.trim(),
      slug: slug.trim(),
      subtitle:         subtitle.trim()         || undefined,
      description:      description.trim(),
      details:          details.split('\n').map((l) => l.trim()).filter(Boolean),
      careInstructions: careInstructions.trim() || undefined,
      brand:            brand.trim()            || undefined,
      categoryId,
      basePrice:    numberOrUndefined(basePrice)      ?? Number.NaN,
      compareAtPrice: numberOrUndefined(compareAtPrice),
      status,
      isFeatured,
      isNewArrival,
      isBestSeller,
      tags:   tags.split(',').map((t) => t.trim()).filter(Boolean),
      images: images.map((img, i) => ({
        id:  img.id,
        url: img.url.trim(),
        alt: img.alt.trim() || undefined,
        sortOrder: i,
        isPrimary: img.isPrimary,
        cloudinaryPublicId: img.cloudinaryPublicId?.trim() || undefined
      })),
      variants: variants.map((v) => ({
        id:               v.id,
        sku:              v.sku.trim(),
        colorName:        v.colorName.trim() || undefined,
        colorValue:       v.colorValue.trim() || undefined,
        size:             v.size.trim()      || undefined,
        price:            numberOrUndefined(v.price) ?? Number.NaN,
        compareAtPrice:   numberOrUndefined(v.compareAtPrice),
        quantity:         numberOrUndefined(v.quantity) ?? 0,
        lowStockThreshold: numberOrUndefined(v.lowStockThreshold) ?? 0,
        isActive:         v.isActive
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

      if (result && !result.ok) {
        setFormMessage(result.message);
        const map: Record<string, string> = {};
        result.issues.forEach((issue: ActionIssue) => { map[issue.path] = issue.message; });
        setIssues(map);
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <form className="adminForm" onSubmit={handleSubmit}>
      {formMessage && <div className="adminAlert isError" role="alert">{formMessage}</div>}
      {status === 'ACTIVE' && activeCount === 0 && (
        <div className="adminAlert isInfo">يحتاج المنتج النشط إلى خيار نشط واحد على الأقل قبل أن يُحفظ.</div>
      )}

      {/* ── Basics ── */}
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

      {/* ── Pricing & status ── */}
      <div className="adminCard">
        <div className="adminCardHeader"><h2>التسعير والحالة</h2></div>
        <div className="adminFormGrid two">
          <div className="adminField">
            <label htmlFor="p-category">التصنيف *</label>
            <select id="p-category" className={errorFor('categoryId') ? 'hasError' : ''} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
              <option value="">اختر تصنيفاً…</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}{cat.isActive ? '' : ' (معطّل)'}</option>
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
          <label className={`adminCheck${isFeatured  ? ' isOn' : ''}`}><input type="checkbox" checked={isFeatured}  onChange={(e) => setIsFeatured(e.target.checked)}  /> مميز</label>
          <label className={`adminCheck${isNewArrival? ' isOn' : ''}`}><input type="checkbox" checked={isNewArrival} onChange={(e) => setIsNewArrival(e.target.checked)} /> وصل حديثاً</label>
          <label className={`adminCheck${isBestSeller? ' isOn' : ''}`}><input type="checkbox" checked={isBestSeller} onChange={(e) => setIsBestSeller(e.target.checked)} /> الأكثر مبيعاً</label>
        </div>
      </div>

      {/* ── Images ── */}
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

      {/* ── Variant Builder ── */}
      <div className="adminCard">
        <div className="adminCardHeader">
          <div>
            <h2>منشئ الخيارات</h2>
            <p className="adminMuted">حدد الألوان والمقاسات مرة واحدة ثم اضغط &quot;توليد الخيارات&quot;.</p>
          </div>
          <button
            type="button"
            className="adminBtn adminBtnGhost adminBtnSm"
            onClick={() => setShowBuilder((v) => !v)}
          >
            {showBuilder ? 'طي المنشئ' : 'فتح المنشئ'}
          </button>
        </div>
        {showBuilder && (
          <VariantBuilder
            productSlug={slug}
            basePrice={basePrice}
            baseCompareAtPrice={compareAtPrice}
            existingVariants={variants}
            onGenerate={handleGenerate}
          />
        )}
      </div>

      {/* ── Variant Matrix ── */}
      <div className="adminCard">
        <div className="adminCardHeader">
          <div>
            <h2>الخيارات الناتجة</h2>
            <p className="vmSummary">
              {colorSet.size > 0 ? `${colorSet.size} ألوان · ` : ''}
              {sizeSet.size > 0 ? `${sizeSet.size} مقاسات · ` : ''}
              {totalCount} خيار · {activeCount} نشط
            </p>
          </div>
          <button type="button" className="adminBtn adminBtnGhost adminBtnSm" onClick={addManualVariant}>+ إضافة يدوي</button>
        </div>

        {errorFor('variants') && <div className="adminAlert isError" style={{ marginBottom: 10 }}>{errorFor('variants')}</div>}

        {variants.length === 0 ? (
          <div className="adminEmptyState">
            <span className="adminEmptyIcon">📦</span>
            <strong className="adminEmptyTitle">لا توجد خيارات بعد</strong>
            <p className="adminEmptyDesc">استخدم منشئ الخيارات أعلاه لتوليد مجموعة ألوان ومقاسات، أو أضف خياراً يدوياً.</p>
          </div>
        ) : (
          <div className="vmList">
            {variants.map((variant, index) => (
              <MatrixRow
                key={variant.id ?? `new-${index}`}
                variant={variant}
                index={index}
                errorFor={errorFor}
                onChange={updateVariant}
                onRemove={removeVariant}
              />
            ))}
          </div>
        )}
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
