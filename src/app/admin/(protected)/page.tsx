import Link from 'next/link';
import { getDashboardOverview } from '@/features/admin/dashboard/dashboard.queries';

export const dynamic = 'force-dynamic';

type Stat = { label: string; value: number; tone?: 'warn' | 'danger' };

export default async function AdminDashboardPage() {
  const overview = await getDashboardOverview();

  const productStats: Stat[] = [
    { label: 'إجمالي المنتجات', value: overview.totalProducts },
    { label: 'نشط', value: overview.activeProducts },
    { label: 'مسودة', value: overview.draftProducts },
    { label: 'مؤرشف', value: overview.archivedProducts },
    { label: 'التصنيفات', value: overview.totalCategories },
    { label: 'بنرات فعّالة', value: overview.activeBanners }
  ];

  const stockStats: Stat[] = [
    { label: 'خيارات نشطة', value: overview.totalVariants },
    { label: 'مخزون منخفض', value: overview.lowStockVariants, tone: 'warn' },
    { label: 'نفد المخزون', value: overview.outOfStockVariants, tone: 'danger' }
  ];

  const orderStats: Stat[] = [
    { label: 'بانتظار التأكيد', value: overview.pendingOrders, tone: 'warn' },
    { label: 'مؤكد / قيد التجهيز', value: overview.inProgressOrders },
    { label: 'تم الشحن', value: overview.shippedOrders },
    { label: 'تم التسليم', value: overview.deliveredOrders },
    { label: 'ملغي', value: overview.canceledOrders, tone: 'danger' },
    { label: 'طلبات اليوم', value: overview.todayOrders }
  ];

  const quickLinks = [
    { href: '/admin/orders', label: 'إدارة الطلبات' },
    { href: '/admin/products/new', label: '+ إضافة منتج' },
    { href: '/admin/products', label: 'إدارة المنتجات' },
    { href: '/admin/inventory', label: 'إدارة المخزون' },
    { href: '/admin/categories', label: 'إدارة التصنيفات' },
    { href: '/admin/banners', label: 'إدارة البنرات' }
  ];

  return (
    <div>
      <div className="adminPageHeader">
        <div>
          <h1>لوحة التحكم</h1>
          <p className="adminMuted">نظرة عامة على كتالوج باب الحارة.</p>
        </div>
        <Link href="/admin/products/new" className="adminBtn adminBtnPrimary">+ إضافة منتج</Link>
      </div>

      <div className="adminCard">
        <div className="adminCardHeader">
          <h2>الكتالوج</h2>
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
          <h2>الطلبات</h2>
          <Link href="/admin/orders" className="adminBtn adminBtnGhost adminBtnSm">فتح الطلبات</Link>
        </div>
        <div className="adminStatGrid">
          {orderStats.map((stat) => (
            <div key={stat.label} className={`adminStat${stat.tone ? ` ${stat.tone}` : ''}`}>
              <div className="adminStatValue">{stat.value}</div>
              <div className="adminStatLabel">{stat.label}</div>
            </div>
          ))}
        </div>
        <p className="adminMuted" style={{ marginTop: 10 }}>قيمة طلبات اليوم (عدا الملغاة): <strong>₪{overview.todayOrderValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</strong></p>
      </div>

      <div className="adminCard">
        <div className="adminCardHeader">
          <h2>حالة المخزون</h2>
          <Link href="/admin/inventory" className="adminBtn adminBtnGhost adminBtnSm">فتح المخزون</Link>
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
          <h2>إجراءات سريعة</h2>
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
