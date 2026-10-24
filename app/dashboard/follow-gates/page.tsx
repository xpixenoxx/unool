import { redirect } from 'next/navigation';

export default async function FollowGatesRedirectPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = searchParams ? await searchParams : {};
  const params = new URLSearchParams();
  for (const [key, val] of Object.entries(resolved || {})) {
    if (Array.isArray(val)) {
      for (const v of val) params.append(key, v);
    } else if (typeof val === 'string') {
      params.append(key, val);
    }
  }
  const query = params.toString();
  redirect(`/dashboard/unlock-gates${query ? `?${query}` : ''}`);
}
