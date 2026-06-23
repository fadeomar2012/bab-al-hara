import Link from 'next/link';
import type { CatalogBanner } from '@/features/catalog/catalog.types';
import { BANNER_IMAGE, getCloudinaryTransformedUrl } from '@/lib/cloudinary-image';
import { brand } from '@/lib/brand';

export function HeroBanner({ banner }: { banner?: CatalogBanner }) {
  const href = banner?.href ?? '/category/new-in';
  const title = banner?.title ?? 'جمالك يبدأ من سعد سنتر';
  const subtitle = banner?.subtitle ?? 'مستحضرات تجميل، عطور، عناية وإكسسوارات مختارة بعناية مع لمسات خاصة لتجهيز العرائس.';
  const eyebrow = banner?.eyebrow ?? 'Saad Center Beauty & Bridal';
  const ctaLabel = banner?.ctaLabel ?? 'تسوّقي الآن';

  return (
    <section className="heroBanner">
      <div className="heroCopy">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <div className="heroActions">
          <Link href={href} className="primaryButton">{ctaLabel}</Link>
          <Link href="/category/sale" className="ghostButton">شاهدي العروض</Link>
        </div>
        <div className="heroTrustRow" aria-label="مميزات التسوق">
          <span>دفع عند الاستلام</span>
          <span>منتجات مختارة</span>
          <span>تجهيز عرائس</span>
        </div>
      </div>

      <div className="heroCollage" aria-hidden="true">
        <div className="heroGlow" />
        <div className="logoMedallion">
          <img src={brand.logo.iconBadge} alt="" width={72} height={72} style={{ objectFit: 'contain' }} />
        </div>
        <div className="collageTile collageLarge">
          <img src={getCloudinaryTransformedUrl(banner?.imageUrl ?? '/mock-products/bag-camel.svg', BANNER_IMAGE)} alt="" />
          <span>اختيارات سعد سنتر</span>
        </div>
        <div className="collageTile collageSmallOne">
          <img src="https://images.pexels.com/photos/31823739/pexels-photo-31823739.jpeg?auto=compress&cs=tinysrgb&w=600" alt="" />
          <span>عطور</span>
        </div>
        <div className="collageTile collageSmallTwo">
          <img src="https://images.pexels.com/photos/28973056/pexels-photo-28973056.jpeg?auto=compress&cs=tinysrgb&w=600" alt="" />
          <span>إكسسوارات</span>
        </div>
        <div className="collageTile collageSmallThree">
          <img src="https://images.pexels.com/photos/30999236/pexels-photo-30999236.jpeg?auto=compress&cs=tinysrgb&w=600" alt="" />
          <span>Gift Box</span>
        </div>
      </div>
    </section>
  );
}
