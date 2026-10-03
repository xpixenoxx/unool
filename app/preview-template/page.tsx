'use client';

import { IdentityTemplate } from '@/components/profile/templates/persona/IdentityTemplate';

export default function PreviewTemplatePage() {
  const dummyProfile = {
    name: 'Imandi Prasanna',
    role: 'Professional',
    headline: 'Building the next generation of web applications.',
    bio: 'Software engineer passionate about AI, minimal design, and building scalable products.',
    avatarUrl: '',
    links: [
      { id: '1', label: 'GitHub', url: 'https://github.com', icon: 'github', isVisible: true },
      { id: '2', label: 'LinkedIn', url: 'https://linkedin.com', icon: 'linkedin', isVisible: true },
    ],
    proofs: [
      { title: 'Projects', value: '50+' },
      { title: 'Clients', value: '12' },
    ]
  };

  return (
    <div className="min-h-screen bg-black flex justify-center items-center py-10">
      <div className="w-full max-w-md shadow-2xl rounded-3xl overflow-hidden ring-1 ring-white/10 relative">
        <IdentityTemplate templateId="lone" profile={dummyProfile} accentColor="#2C3480" />
      </div>
    </div>
  );
}
