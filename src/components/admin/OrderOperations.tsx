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
        <Link href={`/admin/orders/${orderId}/invoice`} className="adminBtn adminBtnPrimary">🧾 Print invoice</Link>
        <Link href={`/admin/orders/${orderId}/packing-slip`} className="adminBtn">📦 Print packing slip</Link>
        <button type="button" className="adminBtn adminBtnGhost" onClick={copySummary}>{copied ? 'Copied!' : 'Copy summary'}</button>
        <button type="button" className={`adminBtn ${isPacked ? 'adminBtnGhost' : 'adminBtnPrimary'}`} onClick={togglePacked} disabled={pending}>
          {isPacked ? 'Mark not packed' : 'Mark packed'}
        </button>
      </div>
      <p className="adminMuted" style={{ marginTop: 10 }}>
        {isPacked ? 'Packed ✓ · ' : ''}Invoice printed {invoicePrintCount}× · Packing slip printed {packingSlipPrintCount}×
      </p>
    </div>
  );
}
