import Link from 'next/link';
import type { OrderStatus } from '@prisma/client';
import { getAdminOrders, type AdminOrderDateFilter } from '@/features/admin/orders/order-admin.queries';
import { formatCurrency, formatDateTime } from '@/features/admin/shared/admin-format';
import { OrderFilters } from '@/components/admin/OrderFilters';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ q?: string; status?: string; date?: string }>;

export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const orders = await getAdminOrders({
    q: sp.q,
    status: (sp.status as OrderStatus | 'ALL') ?? 'ALL',
    date: (sp.date as AdminOrderDateFilter) ?? 'all'
  });

  const exportQuery = new URLSearchParams();
  if (sp.q) exportQuery.set('q', sp.q);
  if (sp.status) exportQuery.set('status', sp.status);
  if (sp.date) exportQuery.set('date', sp.date);
  const exportHref = `/admin/orders/export${exportQuery.toString() ? `?${exportQuery.toString()}` : ''}`;

  return (
    <div>
      <div className="adminPageHeader">
        <div>
          <h1>Orders</h1>
          <p className="adminMuted">{orders.length} order{orders.length === 1 ? '' : 's'} shown · COD only.</p>
        </div>
        <a href={exportHref} className="adminBtn adminBtnGhost" download>⬇ Export CSV</a>
      </div>

      <OrderFilters />

      {orders.length === 0 ? (
        <div className="adminEmptyState">No orders match these filters.</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="adminCard adminOnlyDesktop" style={{ padding: 0 }}>
            <div className="adminTableWrap">
              <table className="adminTable">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Placed</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td><strong>{order.orderNumber}</strong>{order.status === 'PENDING' && <span className="adminNewPill">NEW</span>}</td>
                      <td>
                        <div className="adminCellMain">
                          <div>
                            <strong>{order.customerName}</strong>
                            <small>{order.customerPhone}</small>
                          </div>
                        </div>
                      </td>
                      <td>{order.city} · {order.area}</td>
                      <td><OrderStatusBadge status={order.status} /></td>
                      <td>{order.itemCount}</td>
                      <td>{formatCurrency(order.total)}</td>
                      <td className="adminMuted">{formatDateTime(order.createdAt)}</td>
                      <td><Link href={`/admin/orders/${order.id}`} className="adminBtn adminBtnSm">View</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="adminCardList adminOnlyMobile">
            {orders.map((order) => (
              <Link href={`/admin/orders/${order.id}`} key={order.id} className="adminRecordCard" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="adminRecordTop">
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <strong>{order.orderNumber}</strong>{order.status === 'PENDING' && <span className="adminNewPill">NEW</span>}
                    <div className="adminMuted" style={{ fontSize: 12 }}>{order.customerName} · {order.customerPhone}</div>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>
                <div className="adminRecordMeta">
                  <span>{order.city} · {order.area}</span>
                  <span>{order.itemCount} item{order.itemCount === 1 ? '' : 's'}</span>
                  <span><b>{formatCurrency(order.total)}</b></span>
                  <span>{formatDateTime(order.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
