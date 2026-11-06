export const SECTION_METADATA: Record<string, { name: string; color: string; description: string }> = {
  overview:     { name: 'Overview',     color: '#3b82f6', description: 'Dashboard home & high-level stats' },
  studio:       { name: 'Studio',       color: '#8b5cf6', description: 'AI idea generator, post editor & content creation' },
  flightplan:   { name: 'Flight Plan',  color: '#f59e0b', description: 'Plan, schedule & calendar view' },
  signal:       { name: 'Signal',       color: '#ec4899', description: 'Publishing & cross-platform stream' },
  automation:   { name: 'Automation',   color: '#10b981', description: 'Instagram comment automation' },
  'unlock-gates': { name: 'Unlock Gates', color: '#6366f1', description: 'Follow-to-unlock content gates' },
  referrals:    { name: 'Referrals',    color: '#eab308', description: 'Referral ledger & rewards' },
  profile:      { name: 'Profile',      color: '#06b6d4', description: 'Public page builder & templates' },
  billing:      { name: 'Billing',      color: '#14b8a6', description: 'Subscriptions, plans & checkout' },
  settings:     { name: 'Settings',     color: '#64748b', description: 'Account & workspace configuration' },
};

export function formatSeconds(seconds: number, showSeconds: boolean = false): string {
  if (!seconds || seconds <= 0) return '0s';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (d > 0) {
    return showSeconds && s > 0 ? `${d}d ${h}h ${m}m ${s}s` : `${d}d ${h}h ${m}m`;
  }
  if (h > 0) {
    return showSeconds && s > 0 ? `${h}h ${m}m ${s}s` : `${h}h ${m}m`;
  }
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
