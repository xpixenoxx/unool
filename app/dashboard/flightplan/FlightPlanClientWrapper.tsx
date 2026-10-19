'use client';

import { useEffect } from 'react';
import { FlightPlanClient } from '@/components/flightplan';

interface FlightPlanClientWrapperProps {
  userId: string;
  workspaceId: string;
}

function FlightPlanThemeWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Force dark theme for Flight Plan - add data-theme to html element
    document.documentElement.setAttribute('data-theme', 'dark');
    // Also ensure body has the correct background
    document.body.style.backgroundColor = '#0D0C0A';
    document.body.style.color = '#F5F2EB';

    return () => {
      // Cleanup: remove theme attribute when leaving Flight Plan
      document.documentElement.removeAttribute('data-theme');
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    };
  }, []);

  return <>{children}</>;
}

export function FlightPlanClientWrapper({ userId, workspaceId }: FlightPlanClientWrapperProps) {
  return (
    <FlightPlanThemeWrapper>
      <FlightPlanClient userId={userId} workspaceId={workspaceId} />
    </FlightPlanThemeWrapper>
  );
}