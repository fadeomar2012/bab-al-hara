import type { OrderStatus } from '@prisma/client';
import { STATUS_LABEL } from '@/features/admin/orders/order-admin.validation';

const STATUS_CLASS: Record<OrderStatus, string> = {
  PENDING: 'orderPending',
  CONFIRMED: 'orderConfirmed',
  PROCESSING: 'orderProcessing',
  SHIPPED: 'orderShipped',
  DELIVERED: 'orderDelivered',
  CANCELED: 'orderCanceled'
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`adminBadge ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>;
}
