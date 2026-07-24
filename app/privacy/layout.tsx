import { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Privacy Policy | Unool',
  description: 'Privacy Policy for Unool - How we collect, use, and protect your data.',
};

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return children;
}