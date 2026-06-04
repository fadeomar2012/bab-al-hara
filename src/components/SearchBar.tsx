'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconSearch } from './Icons';

export function SearchBar({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed) router.push(`/category/new-in?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form className={`searchBar ${compact ? 'compact' : ''}`} onSubmit={onSubmit} role="search">
      <IconSearch size={18} />
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحثي عن شنط، عطور، هدايا..." />
      <button type="submit">بحث</button>
    </form>
  );
}
