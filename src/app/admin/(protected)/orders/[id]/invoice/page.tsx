import { notFound } from 'next/navigation';
import { getOrderForPrint } from '@/features/admin/orders/order-print.queries';
import { PrintableInvoice } from '@/components/admin/PrintableInvoice';
import { PrintTrigger } from '@/components/admin/PrintTrigger';

export const dynamic = 'force-dynamic';

export default async function OrderInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getOrderForPrint(id);
  if (!data) notFound();

  return (
    <div className="printPage">
      <PrintTrigger orderId={id} type="invoice" backHref={`/admin/orders/${id}`} />
      <PrintableInvoice order={data.order} invoiceNumber={data.invoiceNumber} qrDataUrl={data.qrDataUrl} />
    </div>
  );
}
