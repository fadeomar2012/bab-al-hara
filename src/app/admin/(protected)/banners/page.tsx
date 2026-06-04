import { getAdminBanners } from '@/features/admin/banners/banner-admin.queries';
import { BannerManager } from '@/components/admin/BannerManager';

export const dynamic = 'force-dynamic';

export default async function AdminBannersPage() {
  const banners = await getAdminBanners();

  return (
    <div>
      <div className="adminPageHeader">
        <div>
          <h1>Banners</h1>
          <p className="adminMuted">Home and category banners. Use image URLs — uploads come later.</p>
        </div>
      </div>
      <BannerManager banners={banners} />
    </div>
  );
}
