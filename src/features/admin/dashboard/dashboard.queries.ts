import 'server-only';
import type { OrderStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { variantStockState } from '@/features/admin/shared/admin-format';
import { decimalToNumber } from '@/features/orders/order.mappers';

export type DashboardOverview = {
  totalProducts: number;
  activeProducts: number;
  draftProducts: number;
  archivedProducts: number;
  totalCategories: number;
  activeCategories: number;
  totalVariants: number;
  outOfStockVariants: number;
  lowStockVariants: number;
  activeBanners: number;
  pendingOrders: number;
  inProgressOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  canceledOrders: number;
  todayOrders: number;
  todayOrderValue: number;
};

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const [
    totalProducts,
    activeProducts,
    draftProducts,
    archivedProducts,
    totalCategories,
    activeCategories,
    activeBanners,
    activeVariants,
    orderGroups,
    todayOrders,
    todayAgg
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: 'ACTIVE' } }),
    prisma.product.count({ where: { status: 'DRAFT' } }),
    prisma.product.count({ where: { status: 'ARCHIVED' } }),
    prisma.category.count(),
    prisma.category.count({ where: { isActive: true } }),
    prisma.banner.count({ where: { isActive: true } }),
    prisma.productVariant.findMany({ where: { isActive: true }, select: { quantity: true, lowStockThreshold: true } }),
    prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.order.count({ where: { createdAt: { gte: startOfToday() } } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: startOfToday() }, status: { not: 'CANCELED' } } })
  ]);

  let outOfStockVariants = 0;
  let lowStockVariants = 0;
  for (const variant of activeVariants) {
    const state = variantStockState(variant.quantity, variant.lowStockThreshold);
    if (state === 'out-of-stock') outOfStockVariants += 1;
    else if (state === 'low-stock') lowStockVariants += 1;
  }

  const orderCountByStatus = (status: OrderStatus) => orderGroups.find((group) => group.status === status)?._count._all ?? 0;

  return {
    totalProducts,
    activeProducts,
    draftProducts,
    archivedProducts,
    totalCategories,
    activeCategories,
    totalVariants: activeVariants.length,
    outOfStockVariants,
    lowStockVariants,
    activeBanners,
    pendingOrders: orderCountByStatus('PENDING'),
    inProgressOrders: orderCountByStatus('CONFIRMED') + orderCountByStatus('PROCESSING'),
    shippedOrders: orderCountByStatus('SHIPPED'),
    deliveredOrders: orderCountByStatus('DELIVERED'),
    canceledOrders: orderCountByStatus('CANCELED'),
    todayOrders,
    todayOrderValue: decimalToNumber(todayAgg._sum.total)
  };
}
