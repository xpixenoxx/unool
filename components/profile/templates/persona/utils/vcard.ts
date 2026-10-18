/* ============================================================
   VCARD GENERATOR — RFC 6350 compliant
   Generates vCard from ClubTemplateData
   ============================================================ */

import type { ClubTemplateData } from '../adaptClub';

export function generateVCard(data: ClubTemplateData): string {
  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:4.0',
    `FN:${escapeVCardValue(data.name)}`,
    `N:${escapeVCardValue(data.name)};;;;`,
    `ORG:${escapeVCardValue('The Club')}`,
    `TITLE:${escapeVCardValue(data.handle)}`,
  ];

  if (data.email) {
    lines.push(`EMAIL;TYPE=WORK,PREF:${escapeVCardValue(data.email)}`);
  }

  if (data.location) {
    lines.push(`ADR;TYPE=WORK:;;${escapeVCardValue(data.location)};;;;`);
  }

  if (data.calendlyUrl) {
    lines.push(`URL;TYPE=CALENDLY:${escapeVCardValue(data.calendlyUrl)}`);
  }

  // Add social links
  data.socialLinks.forEach((link, index) => {
    lines.push(`URL;TYPE=${escapeVCardValue(link.platform).toUpperCase()}:${escapeVCardValue(link.url)}`);
  });

  // Add note with bio/manifesto
  const note = [data.bio, data.manifesto].filter(Boolean).join('\n\n');
  if (note) {
    lines.push(`NOTE:${escapeVCardValue(note)}`);
  }

  lines.push('END:VCARD');

  return lines.join('\r\n');
}

function escapeVCardValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}