import Link from 'next/link';

export function CartSummary({
  subtotal,
  deliveryFee,
  total,
  checkout = true
}: {
  subtotal: number;
  deliveryFee: number;
  total: number;
  checkout?: boolean;
}) {
  return (
    <aside className="cartSummary">
      <h2>ملخص الطلب</h2>
      <div className="summaryLine"><span>المجموع الفرعي</span><strong>₪{subtotal}</strong></div>
      <div className="summaryLine"><span>التوصيل</span><strong>{deliveryFee === 0 ? 'مجاني' : `₪${deliveryFee}`}</strong></div>
      <div className="summaryDivider" />
      <div className="summaryTotal"><span>الإجمالي</span><strong>₪{total}</strong></div>
      <p>الدفع المتاح حالياً: كاش عند الاستلام.</p>
      {checkout ? <Link href="/checkout" className="primaryButton fullWidth">إتمام الطلب</Link> : null}
    </aside>
  );
}
