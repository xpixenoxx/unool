import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminJwt } from '@/lib/auth/admin-jwt';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';
import AdminDashboardClient from './AdminDashboardClient';

export const dynamic = 'force-dynamic';

/**
 * Verify the admin session on the server side.
 * Redirects to /admin/login if the session is missing or invalid.
 */
async function verifyAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;

  if (!token) {
    redirect('/admin/login');
  }

  const payload = verifyAdminJwt(token);
  if (!payload) {
    redirect('/admin/login');
  }

  return payload;
}

async function getAdminData() {
  const [analytics, workspaces, users, plans] = await Promise.all([
    adminRepository.getAnalyticsSummary(),
    adminRepository.listWorkspaces({ page: 1, pageSize: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
    adminRepository.listAllUsers({ page: 1, pageSize: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
    adminRepository.listPlans(),
  ]);
  return { analytics, workspaces, users, plans };
}

export default async function AdminPage() {
  // Verify admin session before rendering any data
  await verifyAdminSession();

  return (
    <AdminDashboardClient initialData={await getAdminData()} />
  );
}
