import React from 'react';
import type { TemplateProps } from '@/components/profile/templates/types';
import { getTemplateById } from '@/components/profile/templates/registry';

// A dynamic template that adjusts its vibe based on the selected identity template ID.
// This serves as the structural foundation while individual bespoke templates are fleshed out.
export function IdentityTemplate({ profile, accentColor, templateId }: TemplateProps & { templateId: string }) {
  const meta = getTemplateById(templateId);
  const isDark = ['lone', 'the-studio', 'the-machine', 'the-visionary', 'the-voice'].includes(templateId);
  const isEditorial = ['lover', 'rebellion', 'the-studio', 'the-aesthete', 'the-voice'].includes(templateId);
  const isBold = ['energy', 'rebellion', 'vision', 'the-machine', 'the-hustler'].includes(templateId);

  const containerBg = isDark ? '#121212' : '#FAFAFA';
  const textColor = isDark ? '#EDEDED' : '#111111';
  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';

  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center justify-start p-8 transition-colors duration-500"
      style={{ 
        backgroundColor: containerBg, 
        color: textColor,
        fontFamily: isEditorial ? 'Georgia, serif' : isBold ? 'Impact, sans-serif' : 'var(--font-sans)'
      }}
    >
      <div className="w-full max-w-2xl mt-12 mb-8 text-center space-y-6">
        <div 
          className="w-32 h-32 mx-auto rounded-full bg-cover bg-center shadow-2xl"
          style={{ 
            backgroundImage: `url(${profile.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + profile.subdomain})`,
            border: `4px solid ${accentColor || '#333'}`,
            borderRadius: isBold ? '16px' : '9999px'
          }}
        />
        
        <div>
          <h1 
            className="text-4xl md:text-5xl tracking-tight"
            style={{ fontWeight: isBold ? 800 : isEditorial ? 400 : 600 }}
          >
            {profile.name || 'Your Name'}
          </h1>
          <p className="text-xl mt-3 opacity-80 font-medium">
            {profile.headline || 'Your unique identity headline'}
          </p>
        </div>

        {profile.bio && (
          <p className="text-base max-w-lg mx-auto opacity-70 leading-relaxed">
            {profile.bio}
          </p>
        )}
      </div>

      <div className="w-full max-w-xl space-y-4 mt-8">
        {profile.links?.map((link: any, i: number) => (
          <a
            key={i}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full p-4 transform transition-all hover:-translate-y-1 hover:shadow-lg"
            style={{
              backgroundColor: cardBg,
              color: textColor,
              border: `1px solid ${isDark ? '#333' : '#EAEAEA'}`,
              borderRadius: isEditorial ? '0px' : isBold ? '4px' : '12px',
              borderLeft: isBold ? `4px solid ${accentColor}` : undefined
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-lg">{link.label}</span>
              <span style={{ color: accentColor }}>→</span>
            </div>
          </a>
        ))}
      </div>
      
      <div className="mt-16 text-center opacity-40 text-sm">
        <p>Identity: {meta?.name || templateId}</p>
      </div>
    </div>
  );
}
