import { notFound } from 'next/navigation';
import { CategoryStrip } from '@/components/CategoryStrip';
import { ProductGrid } from '@/components/ProductGrid';
import { getProductsByCategorySlug } from '@/features/catalog/catalog.queries';
import { normalizeCatalogFilters } from '@/features/catalog/catalog.filters';

export const dynamic = 'force-dynamic';

type CategoryPageSearchParams = {
  q?: string;
  sort?: string;
  availability?: string;
  minPrice?: string;
  maxPrice?: string;
};

export default async function CategoryPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<CategoryPageSearchParams>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const filters = normalizeCatalogFilters(resolvedSearchParams);
  const result = await getProductsByCategorySlug(slug, filters);

  if (!result) notFound();

  const query = filters.q ?? '';

  return (
    <div className="categoryPage">
      <section className="categoryHero">
        <span className="eyebrow">Bab Al Hara Category</span>
        <h1>{query ? `نتائج البحث: ${query}` : result.category.name}</h1>
        <p>{query ? 'منتجات مطابقة من كتالوج باب الحارة الحقيقي.' : result.category.description}</p>
      </section>
      <CategoryStrip categories={result.categories} activeSlug={slug} />
      <form className="utilityRow filterRow" action={`/category/${slug}`}>
        <input name="q" defaultValue={query} placeholder="بحث داخل التصنيف" aria-label="بحث داخل التصنيف" />
        <select name="sort" defaultValue={filters.sort ?? 'newest'} aria-label="ترتيب المنتجات">
          <option value="newest">الأحدث</option>
          <option value="best-sellers">الأكثر مبيعاً</option>
          <option value="price-asc">السعر: الأقل أولاً</option>
          <option value="price-desc">السعر: الأعلى أولاً</option>
        </select>
        <select name="availability" defaultValue={filters.availability ?? 'all'} aria-label="التوفر">
          <option value="all">كل المنتجات</option>
          <option value="in-stock">المتوفر فقط</option>
        </select>
        <button type="submit">تطبيق</button>
        <span>{result.total} منتج</span>
      </form>
      <ProductGrid products={result.products} />
    </div>
  );
}
