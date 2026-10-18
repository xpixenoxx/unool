'use client';

import React from 'react';

/* ============================================================
   CLUB LIVE CLOCK — Real-time clock display
   ============================================================ */

interface LiveClockProps {
  format?: string;
  className?: string;
}

export function LiveClock({ format = 'HH:mm:ss', className = '' }: LiveClockProps) {
  const [time, setTime] = React.useState(() => new Date());

  React.useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatted = time.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: format.includes('ss') ? '2-digit' : undefined,
  });

  return <span className={className}>{formatted}</span>;
}