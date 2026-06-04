'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type CategoryOption = { id: string; name: string };

export function ProductFilters({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') ?? '');

  // Keep the local search box in sync if the URL changes externally.
  useEffect(() => {
    setQ(searchParams.get('q') ?? '');
  }, [searchParams]);

  function update(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value && value !== 'ALL' && value !== 'all') params.set(key, value);
      else params.delete(key);
    }
    router.push(`/admin/products?${params.toString()}`);
  }

  return (
    <form
      className="adminFilters"
      onSubmit={(event) => {
        event.preventDefault();
        update({ q });
      }}
    >
      <input
        className="adminInput"
        type="search"
        placeholder="Search name, slug or SKU…"
        value={q}
        onChange={(event) => setQ(event.target.value)}
        aria-label="Search products"
      />
      <select className="adminInput" value={searchParams.get('status') ?? 'ALL'} onChange={(event) => update({ status: event.target.value })} aria-label="Filter by status">
        <option value="ALL">All statuses</option>
        <option value="ACTIVE">Active</option>
        <option value="DRAFT">Draft</option>
        <option value="ARCHIVED">Archived</option>
      </select>
      <select className="adminInput" value={searchParams.get('category') ?? 'ALL'} onChange={(event) => update({ category: event.target.value })} aria-label="Filter by category">
        <option value="ALL">All categories</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <select className="adminInput" value={searchParams.get('stock') ?? 'all'} onChange={(event) => update({ stock: event.target.value })} aria-label="Filter by stock">
        <option value="all">All stock</option>
        <option value="in-stock">In stock</option>
        <option value="low-stock">Low stock</option>
        <option value="out-of-stock">Out of stock</option>
      </select>
      <select className="adminInput" value={searchParams.get('sort') ?? 'updated'} onChange={(event) => update({ sort: event.target.value })} aria-label="Sort products">
        <option value="updated">Recently updated</option>
        <option value="newest">Newest</option>
        <option value="name">Name (A–Z)</option>
        <option value="stock-asc">Stock (low → high)</option>
      </select>
    </form>
  );
}
