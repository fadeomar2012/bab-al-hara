'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CartSummary } from './CartSummary';
import { EmptyState } from './EmptyState';
import { useCart } from './CartProvider';
import { createCodOrderAction } from '@/features/orders/order.actions';
import { saveRecentOrder } from '@/features/orders/recent-orders.client';
import type { OrderStockError } from '@/features/orders/order.types';

const governorates = ['غزة', 'شمال غزة', 'دير البلح', 'خانيونس', 'رفح', 'الضفة الغربية', 'القدس'];
const SHIPPING_KEY = 'bab-al-hara-shipping';

type ShippingFields = { name: string; phone: string; city: string; area: string; address: string; notes: string };

const EMPTY_FIELDS: ShippingFields = { name: '', phone: '', city: '', area: '', address: '', notes: '' };

export function CheckoutForm() {
  const router = useRouter();
  const { lines, subtotal, deliveryFee, total, clearCart } = useCart();

  const [fields, setFields] = useState<ShippingFields>(EMPTY_FIELDS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [stockErrors, setStockErrors] = useState<OrderStockError[]>([]);

  // Pre-fill shipping details from a previous order.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SHIPPING_KEY);
      if (stored) setFields({ ...EMPTY_FIELDS, ...JSON.parse(stored) });
    } catch {
      /* ignore */
    }
  }, []);

  function set<K extends keyof ShippingFields>(key: K, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    setStockErrors([]);

    const result = await createCodOrderAction({
      fullName: fields.name,
      phone: fields.phone,
      city: fields.city,
      area: fields.area,
      address: fields.address,
      notes: fields.notes || undefined,
      lines: lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity }))
    });

    if (result.ok) {
      try {
        window.localStorage.setItem(SHIPPING_KEY, JSON.stringify(fields));
      } catch {
        /* ignore */
      }
      saveRecentOrder({
        orderNumber: result.orderNumber,
        phone: fields.phone,
        customerName: fields.name,
        city: fields.city,
        area: fields.area,
        total: result.total,
        createdAt: new Date().toISOString()
      });
      clearCart();
      router.push(`/order-success?order=${encodeURIComponent(result.orderNumber)}`);
      return;
    }

    setSubmitting(false);
    setError(result.error);
    if (result.fieldErrors) setFieldErrors(result.fieldErrors);
    if (result.stockErrors) setStockErrors(result.stockErrors);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (!lines.length) {
    return <EmptyState title="لا يوجد طلب لإتمامه" description="أضيفي منتجات للسلة ثم ارجعي للدفع عند الاستلام." actionHref="/" actionLabel="تصفّح المنتجات" />;
  }

  return (
    <div className="checkoutLayout">
      <form className="checkoutForm" onSubmit={onSubmit} noValidate>
        {error && (
          <div className="stockNotice" role="alert">
            {error}
            {stockErrors.length > 0 && (
              <ul style={{ margin: '8px 0 0', paddingInlineStart: 18 }}>
                {stockErrors.map((item) => (
                  <li key={item.variantId}>
                    {item.productName} — {item.available > 0 ? `المتاح: ${item.available}` : 'غير متوفر حالياً'}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <section className="formCard">
          <span className="eyebrow">Cash on delivery</span>
          <h2>معلومات التوصيل</h2>
          <p className="checkoutTrustText">الدفع عند الاستلام فقط — سنتواصل معك لتأكيد الطلب قبل التجهيز.</p>
          <div className="formGrid">
            <label>
              الاسم الكامل
              <input name="name" value={fields.name} onChange={(e) => set('name', e.target.value)} required placeholder="مثال: سارة أحمد" />
              {fieldErrors.fullName && <small className="fieldError">{fieldErrors.fullName}</small>}
            </label>
            <label>
              رقم الجوال
              <input name="phone" value={fields.phone} onChange={(e) => set('phone', e.target.value)} required inputMode="tel" placeholder="05xxxxxxxx" />
              {fieldErrors.phone && <small className="fieldError">{fieldErrors.phone}</small>}
            </label>
            <label>
              المحافظة
              <select name="city" value={fields.city} onChange={(e) => set('city', e.target.value)} required>
                <option value="" disabled>اختاري المحافظة</option>
                {governorates.map((city) => <option value={city} key={city}>{city}</option>)}
              </select>
              {fieldErrors.city && <small className="fieldError">{fieldErrors.city}</small>}
            </label>
            <label>
              المنطقة / الحي
              <input name="area" value={fields.area} onChange={(e) => set('area', e.target.value)} required placeholder="اسم المنطقة" />
              {fieldErrors.area && <small className="fieldError">{fieldErrors.area}</small>}
            </label>
            <label className="spanTwo">
              العنوان التفصيلي
              <textarea name="address" value={fields.address} onChange={(e) => set('address', e.target.value)} required placeholder="شارع، علامة مميزة، قرب..." />
              {fieldErrors.address && <small className="fieldError">{fieldErrors.address}</small>}
            </label>
            <label className="spanTwo">
              ملاحظات اختيارية
              <textarea name="notes" value={fields.notes} onChange={(e) => set('notes', e.target.value)} placeholder="وقت مناسب للتواصل، لون بديل، ملاحظات للهدية..." />
            </label>
          </div>
        </section>

        <section className="formCard paymentCard">
          <h2>طريقة الدفع</h2>
          <label className="radioCard">
            <input type="radio" name="payment" checked readOnly />
            <span>
              <strong>كاش عند الاستلام</strong>
              <small>لا يوجد دفع إلكتروني حالياً. التأكيد يتم عبر التواصل معك.</small>
            </span>
          </label>
        </section>

        <button type="submit" className="primaryButton fullWidth checkoutSubmit" disabled={submitting}>
          {submitting ? 'جاري تأكيد الطلب...' : 'تأكيد الطلب'}
        </button>
      </form>

      <aside className="checkoutSide">
        <div className="miniOrderList">
          <h2>منتجاتك</h2>
          {lines.map((line) => (
            <div className="miniOrderItem" key={line.variantId}>
              <img src={line.image} alt={line.name} />
              <div>
                <strong>{line.name}</strong>
                <span>
                  × {line.quantity}
                  {line.selectedColorName ? ` · ${line.selectedColorName}` : ''}
                  {line.selectedSize ? ` · ${line.selectedSize}` : ''}
                </span>
              </div>
              <b>₪{line.unitPrice * line.quantity}</b>
            </div>
          ))}
        </div>
        <CartSummary subtotal={subtotal} deliveryFee={deliveryFee} total={total} checkout={false} />
        <p className="checkoutTrustText" style={{ marginTop: 12 }}>الإجمالي النهائي يتم احتسابه من قبل المتجر عند تأكيد الطلب.</p>
      </aside>
    </div>
  );
}
