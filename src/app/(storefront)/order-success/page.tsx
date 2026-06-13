import Link from 'next/link';
import { getOrderByNumber } from '@/features/orders/order.queries';
import { maskPhone } from '@/features/orders/order.mappers';
import { ORDER_STATUS_LABEL_AR } from '@/features/orders/order-status.labels';

export const dynamic = 'force-dynamic';

export default async function OrderSuccessPage({ searchParams }: { searchParams?: Promise<{ order?: string }> }) {
  const resolved = searchParams ? await searchParams : {};
  const orderNumber = resolved.order ?? '';
  const order = orderNumber ? await getOrderByNumber(orderNumber) : null;

  if (!order) {
    return (
      <div className="successPage">
        <div className="successCard">
          <div className="successIcon">!</div>
          <span className="eyebrow">Order</span>
          <h1>لم نجد هذا الطلب</h1>
          <p>تأكدي من رقم الطلب أو تابعي طلبك من صفحة التتبع.</p>
          <div className="heroActions center">
            <Link href="/" className="primaryButton">العودة للرئيسية</Link>
            <Link href="/track-order" className="ghostButton">تتبع الطلب</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="plainPage">
      <div className="successCard orderSuccessCard">
        <div className="successIcon">✓</div>
        <span className="eyebrow">Order received</span>
        <h1>تم استلام طلبك</h1>
        <p>سنتواصل معك لتأكيد الطلب قبل التجهيز. طريقة الدفع: <strong>كاش عند الاستلام</strong>.</p>
        <div className="orderBadgeRow">
          <span className="orderNumberPill">رقم الطلب: <strong>{order.orderNumber}</strong></span>
          <span className={`orderStatusBadge status-${order.status}`}>{ORDER_STATUS_LABEL_AR[order.status]}</span>
        </div>
        <p className="localOrderHint">تم حفظ هذا الطلب على هذا الجهاز لتسهيل تتبعه لاحقاً. يمكنك إخفاؤه من صفحة تتبع الطلب.</p>
      </div>

      <div className="formCard">
        <h2>تفاصيل التوصيل</h2>
        <div className="orderInfoGrid">
          <div><span>الاسم</span><strong>{order.customerName}</strong></div>
          <div><span>الجوال</span><strong>{maskPhone(order.customerPhone)}</strong></div>
          <div><span>المحافظة</span><strong>{order.city}</strong></div>
          <div><span>المنطقة</span><strong>{order.area}</strong></div>
          <div className="spanTwo"><span>العنوان</span><strong>{order.address}</strong></div>
        </div>
      </div>

      <div className="formCard">
        <h2>منتجاتك</h2>
        {order.items.map((item) => (
          <div className="miniOrderItem" key={item.id}>
            <img src={item.image ?? '/mock-products/gift-box.svg'} alt={item.productName} />
            <div>
              <strong>{item.productName}</strong>
              <span>
                × {item.quantity}
                {item.colorName ? ` · ${item.colorName}` : ''}
                {item.size ? ` · ${item.size}` : ''}
              </span>
            </div>
            <b>₪{item.total}</b>
          </div>
        ))}
        <div className="summaryDivider" />
        <div className="summaryLine"><span>المجموع الفرعي</span><strong>₪{order.subtotal}</strong></div>
        <div className="summaryLine"><span>التوصيل</span><strong>{order.deliveryFee === 0 ? 'مجاني' : `₪${order.deliveryFee}`}</strong></div>
        {order.discount > 0 && <div className="summaryLine"><span>الخصم</span><strong>−₪{order.discount}</strong></div>}
        <div className="summaryTotal"><span>الإجمالي</span><strong>₪{order.total}</strong></div>
      </div>

      <div className="heroActions center">
        <Link href="/" className="primaryButton">العودة للرئيسية</Link>
        <Link href={`/track-order?order=${encodeURIComponent(order.orderNumber)}`} className="ghostButton">تتبع الطلب</Link>
        <Link href="/category/new-in" className="ghostButton">تسوقي المزيد</Link>
      </div>
    </div>
  );
}
