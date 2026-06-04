import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAdminOrderById } from '@/features/admin/orders/order-admin.queries';
import { STATUS_LABEL } from '@/features/admin/orders/order-admin.validation';
import { formatCurrency, formatDateTime } from '@/features/admin/shared/admin-format';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { OrderStatusActions } from '@/components/admin/OrderStatusActions';
import { OrderOperations } from '@/components/admin/OrderOperations';
import { OrderNotesForm } from '@/components/admin/OrderNotesForm';

export const dynamic = 'force-dynamic';

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getAdminOrderById(id);
  if (!order) notFound();

  const summaryText = [
    `Order ${order.orderNumber} (${STATUS_LABEL[order.status]})`,
    `${order.customerName} · ${order.customerPhone}`,
    `${order.city} · ${order.area} · ${order.address}`,
    ...order.items.map((item) => `- ${item.productName} ×${item.quantity} = ${formatCurrency(item.total)}`),
    `Total (COD): ${formatCurrency(order.total)}`
  ].join('\n');

  return (
    <div>
      <div className="adminPageHeader">
        <div>
          <h1>{order.orderNumber}</h1>
          <p className="adminMuted">Placed {formatDateTime(order.createdAt)} · <OrderStatusBadge status={order.status} /></p>
        </div>
        <Link href="/admin/orders" className="adminBtn adminBtnGhost">← Back</Link>
      </div>

      <div className="adminCard">
        <div className="adminCardHeader"><h2>Operations</h2></div>
        <OrderOperations
          orderId={order.id}
          isPacked={order.isPacked}
          invoicePrintCount={order.invoicePrintCount}
          packingSlipPrintCount={order.packingSlipPrintCount}
          summaryText={summaryText}
        />
      </div>

      <div className="adminCard">
        <div className="adminCardHeader"><h2>Update status</h2></div>
        <OrderStatusActions orderId={order.id} status={order.status} />
      </div>

      <div className="adminCard">
        <div className="adminCardHeader"><h2>Notes</h2></div>
        <OrderNotesForm
          orderId={order.id}
          internalNote={order.internalNote}
          packagingNote={order.packagingNote}
          deliveryNote={order.deliveryNote}
        />
      </div>

      <div className="adminCard">
        <div className="adminCardHeader"><h2>Customer & delivery</h2></div>
        <div className="adminFormGrid two">
          <div className="adminField"><span className="adminFieldLabel">Name</span><div>{order.customerName}</div></div>
          <div className="adminField"><span className="adminFieldLabel">Phone</span><div>{order.customerPhone}</div></div>
          <div className="adminField"><span className="adminFieldLabel">City</span><div>{order.city}</div></div>
          <div className="adminField"><span className="adminFieldLabel">Area</span><div>{order.area}</div></div>
          <div className="adminField spanTwo"><span className="adminFieldLabel">Address</span><div>{order.address}</div></div>
          {order.notes && <div className="adminField spanTwo"><span className="adminFieldLabel">Customer notes</span><div>{order.notes}</div></div>}
          {order.cancelReason && <div className="adminField spanTwo"><span className="adminFieldLabel">Cancel reason</span><div>{order.cancelReason}</div></div>}
        </div>
      </div>

      <div className="adminCard">
        <div className="adminCardHeader"><h2>Items</h2></div>
        <div className="adminTableWrap">
          <table className="adminTable" style={{ minWidth: 520 }}>
            <thead>
              <tr><th>Product</th><th>Variant</th><th>Qty</th><th>Unit</th><th>Total</th></tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="adminCellMain">
                      <img className="adminThumb" src={item.image ?? '/mock-products/gift-box.svg'} alt={item.productName} />
                      <div><strong>{item.productName}</strong><small>{item.sku ?? '—'}</small></div>
                    </div>
                  </td>
                  <td>{[item.colorName, item.size].filter(Boolean).join(' · ') || '—'}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.unitPrice)}</td>
                  <td>{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="summaryDivider" style={{ margin: '14px 0' }} />
        <div className="adminTotalsRow"><span>Subtotal</span><strong>{formatCurrency(order.subtotal)}</strong></div>
        <div className="adminTotalsRow"><span>Delivery</span><strong>{order.deliveryFee === 0 ? 'Free' : formatCurrency(order.deliveryFee)}</strong></div>
        {order.discount > 0 && <div className="adminTotalsRow"><span>Discount</span><strong>−{formatCurrency(order.discount)}</strong></div>}
        <div className="adminTotalsRow grand"><span>Total (COD)</span><strong>{formatCurrency(order.total)}</strong></div>
      </div>

      <div className="adminCard">
        <div className="adminCardHeader"><h2>Status timeline</h2></div>
        <ol className="adminTimeline">
          {order.statusHistory.map((entry) => (
            <li key={entry.id}>
              <span className="adminTimelineDot" />
              <div>
                <strong>{entry.fromStatus ? `${STATUS_LABEL[entry.fromStatus]} → ` : ''}{STATUS_LABEL[entry.toStatus]}</strong>
                <div className="adminMuted" style={{ fontSize: 12 }}>{formatDateTime(entry.createdAt)}{entry.note ? ` · ${entry.note}` : ''}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {order.inventoryLogs.length > 0 && (
        <div className="adminCard">
          <div className="adminCardHeader"><h2>Inventory log</h2></div>
          <div className="adminCardList">
            {order.inventoryLogs.map((log) => (
              <div key={log.id} className="adminRecordMeta">
                <span><b>{log.type}</b></span>
                <span>{log.quantityChange > 0 ? `+${log.quantityChange}` : log.quantityChange}</span>
                <span className="adminMuted">{formatDateTime(log.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
