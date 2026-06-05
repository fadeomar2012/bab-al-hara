'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { setOrderPackedAction } from '@/features/admin/orders/order-operations.actions';

export function OrderOperations({
  orderId,
  isPacked,
  invoicePrintCount,
  packingSlipPrintCount,
  summaryText
}: {
  orderId: string;
  isPacked: boolean;
  invoicePrintCount: number;
  packingSlipPrintCount: number;
  summaryText: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  function togglePacked() {
    startTransition(async () => {
      await setOrderPackedAction(orderId, !isPacked);
      router.refresh();
    });
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div>
      <div className="adminBtnRow">
        <Link href={`/admin/orders/${orderId}/invoice`} className="adminBtn adminBtnPrimary">🧾 طباعة الفاتورة</Link>
        <Link href={`/admin/orders/${orderId}/packing-slip`} className="adminBtn">📦 طباعة قائمة التغليف</Link>
        <button type="button" className="adminBtn adminBtnGhost" onClick={copySummary}>{copied ? 'تم النسخ!' : 'نسخ الملخص'}</button>
        <button type="button" className={`adminBtn ${isPacked ? 'adminBtnGhost' : 'adminBtnPrimary'}`} onClick={togglePacked} disabled={pending}>
          {isPacked ? 'تحديد كغير مُغلَّف' : 'تحديد كمُغلَّف'}
        </button>
      </div>
      <p className="adminMuted" style={{ marginTop: 10 }}>
        {isPacked ? 'مُغلَّف ✓ · ' : ''}طُبعت الفاتورة {invoicePrintCount}× · طُبعت قائمة التغليف {packingSlipPrintCount}×
      </p>
    </div>
  );
}
