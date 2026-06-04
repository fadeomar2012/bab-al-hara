import { getAdminCategories, getParentCategoryOptions } from '@/features/admin/categories/category-admin.queries';
import { CategoryManager } from '@/components/admin/CategoryManager';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const [categories, parentOptions] = await Promise.all([getAdminCategories(), getParentCategoryOptions()]);

  return (
    <div>
      <div className="adminPageHeader">
        <div>
          <h1>Categories</h1>
          <p className="adminMuted">Organise the storefront catalog. Disable instead of deleting categories that still have products.</p>
        </div>
      </div>
      <CategoryManager categories={categories} parentOptions={parentOptions} />
    </div>
  );
}
