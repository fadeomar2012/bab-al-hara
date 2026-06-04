import Link from 'next/link';
import type { CatalogBanner } from '@/features/catalog/catalog.types';

export function PromoBanner({ banner }: { banner?: CatalogBanner }) {
  return (
    <section className="promoBanner">
      <div className="promoCopy">
        <span>{banner?.eyebrow ?? 'Cash on delivery · Offers'}</span>
        <strong>{banner?.title ?? 'خصومات دافئة + توصيل مجاني للطلبات فوق ₪150'}</strong>
        <p>{banner?.subtitle ?? 'اختاري القطع، أكملي الطلب بسرعة، والدفع عند الاستلام بدون بوابة دفع حالياً.'}</p>
      </div>
      <Link href={banner?.href ?? '/category/sale'}>{banner?.ctaLabel ?? 'تسوّقي العروض'}</Link>
    </section>
  );
}
