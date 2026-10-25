'use client';

import React from 'react';
import { studioToast } from '@/components/dashboard/StudioToast';

const C39: Record<string, string> = {
  '0': 'nnnwwnwnn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnnn',
  '4': 'nnnwwnnnw', '5': 'wnnwwnnnn', '6': 'nnwwwnnnn', '7': 'nnnwnnwnw',
  '8': 'wnnwnnwnn', '9': 'nnwwnnwnn', 'A': 'wnnnnwnnw', 'B': 'nnwnnwnnw',
  'C': 'wnwnnwnnn', 'D': 'nnnnwwnnw', 'E': 'wnnnwwnnn', 'F': 'nnwnwwnnn',
  'G': 'nnnnnwwnw', 'H': 'wnnnnwwnn', 'I': 'nnwnnwwnn', 'J': 'nnnnwwwnn',
  'K': 'wnnnnnnww', 'L': 'nnwnnnnww', 'M': 'wnwnnnnwn', 'N': 'nnnnwnnww',
  'O': 'wnnnwnnwn', 'P': 'nnwnwnnwn', 'Q': 'nnnnnnwww', 'R': 'wnnnnnwwn',
  'S': 'nnwnnnwwn', 'T': 'nnnnwnwwn', 'U': 'wwnnnnnnw', 'V': 'nwwnnnnnw',
  'W': 'wwwnnnnnn', 'X': 'nwnnwnnnw', 'Y': 'wwnnwnnnn', 'Z': 'nwwnwnnnn',
  '-': 'nwnnnnwnw', '*': 'nwnnwnwnn',
};

function renderBarcode(code: string) {
  let x = 0;
  const rects: Array<{ x: number; w: number }> = [];
  const safeCode = ('*' + code.toUpperCase() + '*').replace(/[^0-9A-Z\-*]/g, '-');

  for (const ch of safeCode) {
    const pt = C39[ch] || C39['-'];
    for (let k = 0; k < 9; k++) {
      const w = pt[k] === 'w' ? 3 : 1;
      if (k % 2 === 0) {
        rects.push({ x, w });
      }
      x += w;
    }
    x += 1;
  }
  return { totalWidth: x, rects };
}

interface BarcodeTicketProps {
  code: string;
  note?: string;
  className?: string;
}

export function BarcodeTicket({ code, note = 'Tap to copy', className }: BarcodeTicketProps) {
  const { totalWidth, rects } = React.useMemo(() => renderBarcode(code), [code]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(code).then(() => {
          studioToast.success(`Ticket ID ${code} copied to clipboard`);
        });
      } else {
        studioToast.info(`Ticket ID: ${code}`);
      }
    } catch {
      studioToast.info(`Ticket ID: ${code}`);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`fp-bcw ${className || ''}`}
      title="Copy ticket ID"
      aria-label={`Ticket ID ${code}. Tap to copy.`}
    >
      <svg viewBox={`0 0 ${totalWidth} 40`} preserveAspectRatio="none" aria-hidden="true">
        {rects.map((r, i) => (
          <rect key={i} x={r.x} y={0} width={r.w} height={40} fill="currentColor" />
        ))}
      </svg>
      <div className="cap">
        <b>{code}</b>
        <span>{note}</span>
      </div>
    </button>
  );
}

export default BarcodeTicket;
