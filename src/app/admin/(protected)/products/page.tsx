import Link from 'next/link';
import type { ProductStatus } from '@prisma/client';
import {
  getAdminProducts,
  getCategoryOptions,
  type AdminProductListItem,
  type AdminProductSort,
  type AdminProductStockFilter
} from '@/features/admin/products/product-admin.queries';
import { formatCurrency, formatDateTime, STOCK_STATE_LABEL } from '@/features/admin/shared/admin-format';
import { ProductFilters } from '@/components/admin/ProductFilters';
import { ProductRowActions } from '@/components/admin/ProductRowActions';

export const dynamic = 'force-dynamic';

const STATUS_CLASS: Record<ProductStatus, string> = {
  ACTIVE: 'isActive',
  DRAFT: 'isDraft',
  ARCHIVED: 'isArchived'
};

function StockBadge({ item }: { item: AdminProductListItem }) {
  const cls = item.stockState === 'in-stock' ? 'stockIn' : item.stockState === 'low-stock' ? 'stockLow' : 'stockOut';
  return <span className={`adminBadge ${cls}`}>{item.totalStock} · {STOCK_STATE_LABEL[item.stockState]}</span>;
}

function Flags({ item }: { item: AdminProductListItem }) {
  const flags = [item.isFeatured && 'Featured', item.isNewArrival && 'New', item.isBestSeller && 'Best'].filter(Boolean) as string[];
  if (!flags.length) return <span className="adminMuted">—</span>;
  return (
    <span className="adminFlagDot">
      {flags.map((flag) => (
        <span key={flag} className="adminFlagPill">{flag}</span>
      ))}
    </span>
  );
}

type SearchParams = Promise<{ q?: string; status?: string; category?: string; stock?: string; sort?: string }>;

export default async function AdminProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const [products, categories] = await Promise.all([
    getAdminProducts({
      q: sp.q,
      status: (sp.status as ProductStatus | 'ALL') ?? 'ALL',
      categoryId: sp.category ?? 'ALL',
      stock: (sp.stock as AdminProductStockFilter) ?? 'all',
      sort: (sp.sort as AdminProductSort) ?? 'updated'
    }),
    getCategoryOptions()
  ]);

  return (
    <div>
      <div className="adminPageHeader">
        <div>
          <h1>Products</h1>
          <p className="adminMuted">{products.length} product{products.length === 1 ? '' : 's'} shown.</p>
        </div>
        <Link href="/admin/products/new" className="adminBtn adminBtnPrimary">+ Add product</Link>
      </div>

      <ProductFilters categories={categories} />

      {products.length === 0 ? (
        <div className="adminEmptyState">No products match these filters.</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="adminCard adminOnlyDesktop" style={{ padding: 0 }}>
            <div className="adminTableWrap">
              <table className="adminTable">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Price</th>
                    <th>Variants</th>
                    <th>Stock</th>
                    <th>Flags</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="adminCellMain">
                          <img className="adminThumb" src={item.image ?? '/mock-products/gift-box.svg'} alt={item.name} />
                          <div>
                            <strong>{item.name}</strong>
                            <small>{item.slug}</small>
                          </div>
                        </div>
                      </td>
                      <td>{item.categoryName}</td>
                      <td><span className={`adminBadge ${STATUS_CLASS[item.status]}`}>{item.status}</span></td>
                      <td>{formatCurrency(item.basePrice)}</td>
                      <td>{item.variantCount}</td>
                      <td><StockBadge item={item} /></td>
                      <td><Flags item={item} /></td>
                      <td className="adminMuted">{formatDateTime(item.updatedAt)}</td>
                      <td><ProductRowActions id={item.id} slug={item.slug} status={item.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="adminCardList adminOnlyMobile">
            {products.map((item) => (
              <div key={item.id} className="adminRecordCard">
                <div className="adminRecordTop">
                  <img className="adminThumb" src={item.image ?? '/mock-products/gift-box.svg'} alt={item.name} />
                  <div style={{ minWidth: 0 }}>
                    <strong>{item.name}</strong>
                    <div className="adminMuted" style={{ fontSize: 12 }}>{item.slug}</div>
                  </div>
                </div>
                <div className="adminRecordMeta">
                  <span><b>{item.categoryName}</b></span>
                  <span><span className={`adminBadge ${STATUS_CLASS[item.status]}`}>{item.status}</span></span>
                  <span><b>{formatCurrency(item.basePrice)}</b></span>
                  <span>{item.variantCount} variant{item.variantCount === 1 ? '' : 's'}</span>
                </div>
                <div className="adminRecordMeta">
                  <StockBadge item={item} />
                  <Flags item={item} />
                </div>
                <ProductRowActions id={item.id} slug={item.slug} status={item.status} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
