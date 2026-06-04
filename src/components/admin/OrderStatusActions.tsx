'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { OrderStatus } from '@prisma/client';
import { updateOrderStatusAction } from '@/features/admin/orders/order-admin.actions';
import { ALLOWED_TRANSITIONS, STATUS_LABEL } from '@/features/admin/orders/order-admin.validation';

export function OrderStatusActions({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const nextStatuses = ALLOWED_TRANSITIONS[status] ?? [];

  function run(next: OrderStatus) {
    setError(null);
    let note: string | undefined;
    if (next === 'CANCELED') {
      const confirmed = window.confirm('Cancel this order? Stock will be restored to inventory.');
      if (!confirmed) return;
      note = window.prompt('Optional cancel reason:') ?? undefined;
    }
    startTransition(async () => {
      const result = await updateOrderStatusAction(orderId, next, note);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  }

  if (nextStatuses.length === 0) {
    return <p className="adminMuted">No further status changes available for this order.</p>;
  }

  return (
    <div>
      <div className="adminBtnRow">
        {nextStatuses.map((next) => (
          <button
            key={next}
            type="button"
            className={`adminBtn ${next === 'CANCELED' ? 'adminBtnDanger' : 'adminBtnPrimary'}`}
            disabled={pending}
            onClick={() => run(next)}
          >
            {next === 'CANCELED' ? 'Cancel order' : `Mark ${STATUS_LABEL[next]}`}
          </button>
        ))}
      </div>
      {error && <div className="adminAlert isError" style={{ marginTop: 10 }}>{error}</div>}
    </div>
  );
}
