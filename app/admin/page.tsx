import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';
import { requireAdmin } from '@/lib/auth/admin';
import { NextRequest, NextResponse } from 'next/server';
import AdminDashboardClient from './AdminDashboardClient';

export const dynamic = 'force-dynamic';

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
  // In a real app, you'd check admin auth here
  // For now we'll render the client component with fetched data
  return (
    <AdminDashboardClient initialData={await getAdminData()} />
  );
}