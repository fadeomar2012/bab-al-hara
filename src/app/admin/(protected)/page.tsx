import Link from 'next/link';
import { getDashboardOverview } from '@/features/admin/dashboard/dashboard.queries';

export const dynamic = 'force-dynamic';

type Stat = { label: string; value: number; tone?: 'warn' | 'danger' };

export default async function AdminDashboardPage() {
  const overview = await getDashboardOverview();

  const productStats: Stat[] = [
    { label: 'Total products', value: overview.totalProducts },
    { label: 'Active', value: overview.activeProducts },
    { label: 'Draft', value: overview.draftProducts },
    { label: 'Archived', value: overview.archivedProducts },
    { label: 'Categories', value: overview.totalCategories },
    { label: 'Active banners', value: overview.activeBanners }
  ];

  const stockStats: Stat[] = [
    { label: 'Active variants', value: overview.totalVariants },
    { label: 'Low stock', value: overview.lowStockVariants, tone: 'warn' },
    { label: 'Out of stock', value: overview.outOfStockVariants, tone: 'danger' }
  ];

  const orderStats: Stat[] = [
    { label: 'Pending', value: overview.pendingOrders, tone: 'warn' },
    { label: 'Confirmed / processing', value: overview.inProgressOrders },
    { label: 'Shipped', value: overview.shippedOrders },
    { label: 'Delivered', value: overview.deliveredOrders },
    { label: 'Canceled', value: overview.canceledOrders, tone: 'danger' },
    { label: 'Orders today', value: overview.todayOrders }
  ];

  const quickLinks = [
    { href: '/admin/orders', label: 'Manage orders' },
    { href: '/admin/products/new', label: '+ Add product' },
    { href: '/admin/products', label: 'Manage products' },
    { href: '/admin/inventory', label: 'Manage inventory' },
    { href: '/admin/categories', label: 'Manage categories' },
    { href: '/admin/banners', label: 'Manage banners' }
  ];

  return (
    <div>
      <div className="adminPageHeader">
        <div>
          <h1>Dashboard</h1>
          <p className="adminMuted">Catalog overview for Bab Al Hara.</p>
        </div>
        <Link href="/admin/products/new" className="adminBtn adminBtnPrimary">+ Add product</Link>
      </div>

      <div className="adminCard">
        <div className="adminCardHeader">
          <h2>Catalog</h2>
        </div>
        <div className="adminStatGrid">
          {productStats.map((stat) => (
            <div key={stat.label} className={`adminStat${stat.tone ? ` ${stat.tone}` : ''}`}>
              <div className="adminStatValue">{stat.value}</div>
              <div className="adminStatLabel">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="adminCard">
        <div className="adminCardHeader">
          <h2>Orders</h2>
          <Link href="/admin/orders" className="adminBtn adminBtnGhost adminBtnSm">Open orders</Link>
        </div>
        <div className="adminStatGrid">
          {orderStats.map((stat) => (
            <div key={stat.label} className={`adminStat${stat.tone ? ` ${stat.tone}` : ''}`}>
              <div className="adminStatValue">{stat.value}</div>
              <div className="adminStatLabel">{stat.label}</div>
            </div>
          ))}
        </div>
        <p className="adminMuted" style={{ marginTop: 10 }}>Today&apos;s order value (excl. canceled): <strong>₪{overview.todayOrderValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</strong></p>
      </div>

      <div className="adminCard">
        <div className="adminCardHeader">
          <h2>Stock health</h2>
          <Link href="/admin/inventory" className="adminBtn adminBtnGhost adminBtnSm">Open inventory</Link>
        </div>
        <div className="adminStatGrid">
          {stockStats.map((stat) => (
            <div key={stat.label} className={`adminStat${stat.tone ? ` ${stat.tone}` : ''}`}>
              <div className="adminStatValue">{stat.value}</div>
              <div className="adminStatLabel">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="adminCard">
        <div className="adminCardHeader">
          <h2>Quick actions</h2>
        </div>
        <div className="adminQuickGrid">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href} className="adminQuickLink">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
