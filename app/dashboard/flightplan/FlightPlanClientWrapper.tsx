'use client';

import { FlightPlanClient } from '@/components/flightplan';

interface FlightPlanClientWrapperProps {
  userId: string;
  workspaceId: string;
}

export function FlightPlanClientWrapper({ userId, workspaceId }: FlightPlanClientWrapperProps) {
  return <FlightPlanClient userId={userId} workspaceId={workspaceId} />;
}