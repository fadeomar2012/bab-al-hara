'use client';

import { useState } from 'react';
import { ColorSelector, type ColorValue } from './ColorSelector';

// ── Types ────────────────────────────────────────────────────────────────────

export type BuilderColor = { colorName: string; colorValue: string };

export type VariantState = {
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

// Common fashion size presets
const SIZE_PRESETS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'مقاس موحد'];

// ── SKU generation ───────────────────────────────────────────────────────────

const ARABIC_TO_EN: Record<string, string> = {
  'أحمر': 'red', 'احمر': 'red', 'أسود': 'black', 'اسود': 'black',
  'أبيض': 'white', 'ابيض': 'white', 'بيج': 'beige', 'بني': 'brown',
  'جملي': 'camel', 'وردي': 'pink', 'أزرق': 'blue', 'ازرق': 'blue',
  'أخضر': 'green', 'اخضر': 'green', 'ذهبي': 'gold', 'فضي': 'silver',
  'رمادي': 'gray', 'كحلي': 'navy', 'زيتي': 'olive', 'برتقالي': 'orange',
  'مقاس موحد': 'one-size', 'موحد': 'one-size', 'صغير': 'small',
  'وسط': 'medium', 'كبير': 'large', 'xlarge': 'xl',
};

function slugForSku(text: string): string {
  if (!text) return '';
  const trimmed = text.trim();
  // Direct Arabic map
  const mapped = ARABIC_TO_EN[trimmed];
  if (mapped) return mapped;
  // Translate remaining Arabic chars to latin slug
  return trimmed
    .toLowerCase()
    .replace(/[؀-ۿ]+/g, (m) => ARABIC_TO_EN[m] || '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateSku(
  productSlug: string,
  colorName: string,
  size: string,
  usedSkus: Set<string>
): string {
  const colorPart = slugForSku(colorName) || 'color';
  const sizePart  = slugForSku(size)      || 'one-size';
  const base = [productSlug, colorPart, sizePart]
    .filter(Boolean).join('-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '') || 'variant';

  let candidate = base;
  let n = 2;
  while (usedSkus.has(candidate.toLowerCase())) {
    candidate = `${base}-${n++}`;
  }
  return candidate;
}

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
  productSlug: string;
  basePrice: string;
  baseCompareAtPrice: string;
  existingVariants: VariantState[];
  onGenerate: (newVariants: VariantState[]) => void;
};

export function VariantBuilder({
  productSlug,
  basePrice,
  baseCompareAtPrice,
  existingVariants,
  onGenerate,
}: Props) {
  const [colors, setColors] = useState<BuilderColor[]>([]);
  const [sizes,  setSizes]  = useState<string[]>([]);
  const [sizeInput, setSizeInput] = useState('');
  const [defaultPrice,     setDefaultPrice]     = useState(basePrice);
  const [defaultCompare,   setDefaultCompare]   = useState(baseCompareAtPrice);
  const [defaultThreshold, setDefaultThreshold] = useState('5');
  const [pendingColor, setPendingColor] = useState<BuilderColor>({ colorName: '', colorValue: '' });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [generateError, setGenerateError] = useState('');

  // ── Helpers ──────────────────────────────────────────────────────────────

  function addColor() {
    if (!pendingColor.colorName.trim()) { setGenerateError('أدخل اسم اللون أولاً'); return; }
    const exists = colors.some(
      (c) => c.colorName.trim().toLowerCase() === pendingColor.colorName.trim().toLowerCase()
    );
    if (exists) { setGenerateError('هذا اللون موجود بالفعل'); return; }
    setColors((prev) => [...prev, { colorName: pendingColor.colorName.trim(), colorValue: pendingColor.colorValue.trim() }]);
    setPendingColor({ colorName: '', colorValue: '' });
    setShowColorPicker(false);
    setGenerateError('');
  }

  function removeColor(index: number) {
    setColors((prev) => prev.filter((_, i) => i !== index));
  }

  function addSize(size: string) {
    const trimmed = size.trim();
    if (!trimmed) return;
    if (sizes.some((s) => s.toLowerCase() === trimmed.toLowerCase())) return;
    setSizes((prev) => [...prev, trimmed]);
    setSizeInput('');
  }

  function removeSize(index: number) {
    setSizes((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Generate ─────────────────────────────────────────────────────────────

  function generate() {
    setGenerateError('');
    if (colors.length === 0 && sizes.length === 0) {
      setGenerateError('أضف ألواناً أو مقاسات أولاً قبل التوليد');
      return;
    }
    // Build a key-set of existing active combos to skip duplicates
    const existingKeys = new Set(
      existingVariants
        .filter((v) => v.isActive)
        .map((v) => `${v.colorName.trim().toLowerCase()}||${v.size.trim().toLowerCase()}`)
    );
    // All skus (existing + form) to avoid collision
    const usedSkus = new Set(existingVariants.map((v) => v.sku.trim().toLowerCase()));

    // Color × size cartesian product (or color-only / size-only)
    const effectiveColors = colors.length > 0 ? colors : [{ colorName: '', colorValue: '' }];
    const effectiveSizes  = sizes.length  > 0 ? sizes  : [''];

    const newVariants: VariantState[] = [];
    for (const color of effectiveColors) {
      for (const size of effectiveSizes) {
        const key = `${color.colorName.trim().toLowerCase()}||${size.trim().toLowerCase()}`;
        if (existingKeys.has(key)) continue; // skip combo that already exists

        const sku = generateSku(productSlug || 'product', color.colorName, size, usedSkus);
        usedSkus.add(sku.toLowerCase());

        newVariants.push({
          sku,
          colorName:        color.colorName,
          colorValue:       color.colorValue,
          size,
          price:            defaultPrice,
          compareAtPrice:   defaultCompare,
          quantity:         '0',
          lowStockThreshold: defaultThreshold,
          isActive:         true,
        });
      }
    }

    if (newVariants.length === 0) {
      setGenerateError('جميع هذه التركيبات موجودة بالفعل. غيّر الألوان أو المقاسات لإضافة خيارات جديدة.');
      return;
    }
    onGenerate(newVariants);
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const wouldGenerate = Math.max(colors.length, 1) * Math.max(sizes.length, 1);

  return (
    <div className="variantBuilder">
      <p className="adminMuted variantBuilderNote">
        كل لون + مقاس يتم حفظه كخيار مستقل حتى يتم تتبع المخزون والطلبات بدقة.
      </p>

      {generateError && (
        <div className="adminAlert isError" style={{ marginBottom: 12 }}>{generateError}</div>
      )}

      {/* ── Colors ── */}
      <div className="vbSection">
        <div className="vbSectionHead">
          <strong>ألوان المنتج</strong>
          <button
            type="button"
            className="adminBtn adminBtnGhost adminBtnSm"
            onClick={() => setShowColorPicker((v) => !v)}
          >
            {showColorPicker ? 'إغلاق' : '+ إضافة لون'}
          </button>
        </div>

        {showColorPicker && (
          <div className="vbColorPickerWrap">
            <ColorSelector
              colorName={pendingColor.colorName}
              colorValue={pendingColor.colorValue}
              onChange={(v: ColorValue) => setPendingColor(v)}
            />
            <button type="button" className="adminBtn adminBtnPrimary adminBtnSm" onClick={addColor}>
              إضافة اللون
            </button>
          </div>
        )}

        {colors.length > 0 ? (
          <div className="vbColorList">
            {colors.map((color, idx) => (
              <div key={idx} className="vbColorChip">
                {color.colorValue && (
                  <span className="colorPreviewCircle sm" style={{ background: color.colorValue }} aria-hidden="true" />
                )}
                <span>{color.colorName}</span>
                <button
                  type="button"
                  className="vbChipRemove"
                  aria-label={`إزالة لون ${color.colorName}`}
                  onClick={() => removeColor(idx)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="adminMuted" style={{ fontSize: 13, margin: '6px 0 0' }}>لم تُضف ألوان — سيتم التوليد بدون فلتر لون.</p>
        )}
      </div>

      {/* ── Sizes ── */}
      <div className="vbSection">
        <div className="vbSectionHead">
          <strong>المقاسات</strong>
        </div>

        {/* Preset chips */}
        <div className="vbSizePresets">
          {SIZE_PRESETS.map((size) => (
            <button
              key={size}
              type="button"
              className={`vbSizePreset${sizes.some((s) => s.toLowerCase() === size.toLowerCase()) ? ' isAdded' : ''}`}
              onClick={() => addSize(size)}
            >
              {size}
            </button>
          ))}
        </div>

        {/* Custom size input */}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input
            value={sizeInput}
            onChange={(e) => setSizeInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSize(sizeInput); } }}
            placeholder="مقاس مخصص مثال: 42"
            className="adminInput"
            style={{ flex: 1 }}
          />
          <button type="button" className="adminBtn adminBtnGhost adminBtnSm" onClick={() => addSize(sizeInput)}>
            + إضافة
          </button>
        </div>

        {sizes.length > 0 ? (
          <div className="vbColorList" style={{ marginTop: 10 }}>
            {sizes.map((size, idx) => (
              <div key={idx} className="vbColorChip">
                <span>{size}</span>
                <button type="button" className="vbChipRemove" aria-label={`إزالة مقاس ${size}`} onClick={() => removeSize(idx)}>×</button>
              </div>
            ))}
          </div>
        ) : (
          <p className="adminMuted" style={{ fontSize: 13, margin: '8px 0 0' }}>لم تُضف مقاسات — سيتم التوليد بدون فلتر مقاس.</p>
        )}
      </div>

      {/* ── Defaults ── */}
      <div className="vbSection">
        <div className="vbSectionHead"><strong>القيم الافتراضية للخيارات الجديدة</strong></div>
        <div className="adminRepeatGrid">
          <div className="adminField">
            <label>السعر الافتراضي (₪)</label>
            <input type="number" min="0" step="0.01" value={defaultPrice} onChange={(e) => setDefaultPrice(e.target.value)} />
          </div>
          <div className="adminField">
            <label>السعر قبل الخصم (₪)</label>
            <input type="number" min="0" step="0.01" value={defaultCompare} onChange={(e) => setDefaultCompare(e.target.value)} />
          </div>
          <div className="adminField">
            <label>حد المخزون المنخفض</label>
            <input type="number" min="0" step="1" value={defaultThreshold} onChange={(e) => setDefaultThreshold(e.target.value)} />
          </div>
        </div>
      </div>

      {/* ── Generate button ── */}
      <div className="vbGenerateRow">
        <button type="button" className="adminBtn adminBtnPrimary" onClick={generate}>
          ⚡ توليد الخيارات
        </button>
        {(colors.length > 0 || sizes.length > 0) && (
          <span className="adminMuted" style={{ fontSize: 13 }}>
            سيتم توليد{' '}
            <strong>{wouldGenerate}</strong>{' '}
            خيار ({Math.max(colors.length, 1)} ألوان × {Math.max(sizes.length, 1)} مقاسات)
          </span>
        )}
      </div>
    </div>
  );
}
