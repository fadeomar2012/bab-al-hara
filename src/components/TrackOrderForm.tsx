'use client';

import { FormEvent, useState } from 'react';
import { trackOrderAction } from '@/features/orders/order.actions';
import type { OrderView } from '@/features/orders/order.types';
import { STATUS_LABEL_AR } from '@/features/admin/orders/order-admin.validation';

const STATUS_STEPS: { key: OrderView['status']; label: string }[] = [
  { key: 'PENDING', label: 'بانتظار التأكيد' },
  { key: 'CONFIRMED', label: 'تم التأكيد' },
  { key: 'PROCESSING', label: 'قيد التجهيز' },
  { key: 'SHIPPED', label: 'تم الشحن' },
  { key: 'DELIVERED', label: 'تم التسليم' }
];

export function TrackOrderForm({ initialOrderNumber = '' }: { initialOrderNumber?: string }) {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderView | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    setOrder(null);
    const result = await trackOrderAction({ orderNumber, phone });
    setLoading(false);
    if (result.ok) setOrder(result.order);
    else setError(result.error);
  }

  const activeIndex = order ? STATUS_STEPS.findIndex((step) => step.key === order.status) : -1;
  const isCanceled = order?.status === 'CANCELED';

  return (
    <div className="trackOrderWrap">
      <form className="formCard" onSubmit={onSubmit} noValidate>
        <h2>تتبع طلبك</h2>
        <p className="checkoutTrustText">أدخلي رقم الطلب ورقم الجوال المستخدم عند الطلب.</p>
        <div className="formGrid">
          <label>
            رقم الطلب
            <input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} required placeholder="BAH-20260604-0001" />
          </label>
          <label>
            رقم الجوال
            <input value={phone} onChange={(e) => setPhone(e.target.value)} required inputMode="tel" placeholder="05xxxxxxxx" />
          </label>
        </div>
        {error && <div className="stockNotice" role="alert" style={{ marginTop: 12 }}>{error}</div>}
        <button type="submit" className="primaryButton fullWidth" disabled={loading} style={{ marginTop: 14 }}>
          {loading ? 'جاري البحث...' : 'تتبع الطلب'}
        </button>
      </form>

      {order && (
        <div className="formCard" style={{ marginTop: 16 }}>
          <div className="orderBadgeRow">
            <span className="orderNumberPill">رقم الطلب: <strong>{order.orderNumber}</strong></span>
            <span className={`orderStatusBadge status-${order.status}`}>{STATUS_LABEL_AR[order.status]}</span>
          </div>

          {isCanceled ? (
            <div className="stockNotice" style={{ marginTop: 12 }}>تم إلغاء هذا الطلب.</div>
          ) : (
            <ol className="orderTimeline">
              {STATUS_STEPS.map((step, index) => (
                <li key={step.key} className={index <= activeIndex ? 'done' : ''}>
                  <span className="orderTimelineDot" />
                  {step.label}
                </li>
              ))}
            </ol>
          )}

          <div className="summaryDivider" />
          {order.items.map((item) => (
            <div className="miniOrderItem" key={item.id}>
              <img src={item.image ?? '/mock-products/gift-box.svg'} alt={item.productName} />
              <div>
                <strong>{item.productName}</strong>
                <span>× {item.quantity}{item.size ? ` · ${item.size}` : ''}</span>
              </div>
              <b>₪{item.total}</b>
            </div>
          ))}
          <div className="summaryTotal"><span>الإجمالي (كاش عند الاستلام)</span><strong>₪{order.total}</strong></div>
        </div>
      )}
    </div>
  );
}
