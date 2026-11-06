// Valid sections in Unool Dashboard
export const VALID_DASHBOARD_SECTIONS = [
  'overview',
  'studio',
  'flightplan',
  'signal',
  'automation',
  'unlock-gates',
  'referrals',
  'profile',
  'billing',
  'settings',
] as const;

export type DashboardSection = (typeof VALID_DASHBOARD_SECTIONS)[number];

export function normalizeSectionName(raw: string): DashboardSection {
  const clean = raw.toLowerCase().trim().replace(/^\/dashboard\/?/, '');
  if (!clean || clean === 'overview') return 'overview';
  if (clean.startsWith('studio')) return 'studio';
  if (clean.startsWith('flightplan') || clean.startsWith('flight-plan') || clean.startsWith('schedule')) return 'flightplan';
  if (clean.startsWith('signal') || clean.startsWith('publish')) return 'signal';
  if (clean.startsWith('automation')) return 'automation';
  if (clean.startsWith('unlock-gates') || clean.startsWith('follow-gates') || clean.startsWith('gates')) return 'unlock-gates';
  if (clean.startsWith('referral')) return 'referrals';
  if (clean.startsWith('profile')) return 'profile';
  if (clean.startsWith('billing')) return 'billing';
  if (clean.startsWith('setting')) return 'settings';
  if (clean.startsWith('composer')) return 'studio';
  return 'overview';
}

