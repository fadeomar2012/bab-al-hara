import Link from 'next/link';
import type { CatalogBanner } from '@/features/catalog/catalog.types';

export function HeroBanner({ banner }: { banner?: CatalogBanner }) {
  const href = banner?.href ?? '/category/new-in';
  const title = banner?.title ?? 'إطلالتك تبدأ من باب الحارة';
  const subtitle = banner?.subtitle ?? 'شنط، عطور، مكياج وإكسسوارات مختارة بذوق دافئ وبالدفع عند الاستلام.';
  const eyebrow = banner?.eyebrow ?? 'Bab Al Hara Boutique Market';
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
          <span>ستايل بوتيك</span>
        </div>
      </div>

      <div className="heroCollage" aria-hidden="true">
        <div className="heroGlow" />
        <div className="logoMedallion">باب<br />الحارة</div>
        <div className="collageTile collageLarge">
          <img src={banner?.imageUrl ?? '/mock-products/bag-camel.svg'} alt="" />
          <span>اختيارات بوتيك</span>
        </div>
        <div className="collageTile collageSmallOne">
          <img src="/mock-products/perfume-gold.svg" alt="" />
          <span>عطور</span>
        </div>
        <div className="collageTile collageSmallTwo">
          <img src="/mock-products/sunglasses.svg" alt="" />
          <span>إكسسوارات</span>
        </div>
        <div className="collageTile collageSmallThree">
          <img src="/mock-products/gift-box.svg" alt="" />
          <span>Gift Box</span>
        </div>
      </div>
    </section>
  );
}
