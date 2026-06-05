import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/features/admin/auth/admin-auth';
import { LoginForm } from '@/components/admin/LoginForm';
import { BrandLogo } from '@/components/BrandLogo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'تسجيل الدخول · باب الحارة'
};

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect('/admin');

  return (
    <div className="adminRoot" dir="rtl">
      <div className="adminLoginShell">
        <div className="adminLoginCard">
          <BrandLogo variant="full" subtitle="لوحة الإدارة" style={{ justifyContent: 'center', marginBottom: 16 }} />
          <h1>إدارة باب الحارة</h1>
          <p className="adminMuted">سجّل الدخول لإدارة كتالوج باب الحارة.</p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
