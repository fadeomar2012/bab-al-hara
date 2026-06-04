'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function OrderFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') ?? '');

  useEffect(() => {
    setQ(searchParams.get('q') ?? '');
  }, [searchParams]);

  function update(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value && value !== 'ALL' && value !== 'all') params.set(key, value);
      else params.delete(key);
    }
    router.push(`/admin/orders?${params.toString()}`);
  }

  return (
    <form
      className="adminFilters"
      onSubmit={(event) => {
        event.preventDefault();
        update({ q });
      }}
    >
      <input className="adminInput" type="search" placeholder="Search order #, name or phone…" value={q} onChange={(event) => setQ(event.target.value)} aria-label="Search orders" />
      <select className="adminInput" value={searchParams.get('status') ?? 'ALL'} onChange={(event) => update({ status: event.target.value })} aria-label="Filter by status">
        <option value="ALL">All statuses</option>
        <option value="PENDING">Pending</option>
        <option value="CONFIRMED">Confirmed</option>
        <option value="PROCESSING">Processing</option>
        <option value="SHIPPED">Shipped</option>
        <option value="DELIVERED">Delivered</option>
        <option value="CANCELED">Canceled</option>
      </select>
      <select className="adminInput" value={searchParams.get('date') ?? 'all'} onChange={(event) => update({ date: event.target.value })} aria-label="Filter by date">
        <option value="all">All time</option>
        <option value="today">Today</option>
        <option value="7d">Last 7 days</option>
      </select>
    </form>
  );
}
