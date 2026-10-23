import BillingClient from './BillingClient';

export const metadata = {
  title: 'Billing – Unool',
  description: 'Manage your Unool subscription, upgrade your plan, and view payment history.',
};

export default function BillingPage() {
  return <BillingClient />;
}
