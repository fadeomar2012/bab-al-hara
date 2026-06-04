'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { markOrderPrintedAction } from '@/features/admin/orders/order-operations.actions';
import type { PrintType } from '@/features/admin/orders/order-operations.validation';

/** Print toolbar shown on screen only (hidden in print via .noPrint). */
export function PrintTrigger({ orderId, type, backHref }: { orderId: string; type: PrintType; backHref: string }) {
  const [pending, startTransition] = useTransition();

  function print() {
    startTransition(async () => {
      await markOrderPrintedAction(orderId, type);
      window.print();
    });
  }

  return (
    <div className="printToolbar noPrint">
      <Link href={backHref} className="adminBtn adminBtnGhost">← Back to order</Link>
      <button type="button" className="adminBtn adminBtnPrimary" onClick={print} disabled={pending}>
        {pending ? 'Preparing…' : 'Print'}
      </button>
    </div>
  );
}
