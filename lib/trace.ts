'use client';

import React, { createContext, useContext, useState, ReactNode, ReactElement } from 'react';

interface TraceContextValue {
  traceId: string;
}

const TraceContext = createContext<TraceContextValue | null>(null);

export function TraceProvider({ children }: { children: ReactNode }): ReactElement {
  const [traceId] = useState(() => `trace-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
  return React.createElement(TraceContext.Provider, { value: { traceId } }, children);
}

export function useTraceId(): string {
  const context = useContext(TraceContext);
  if (!context) {
    // Fallback for components outside provider
    return `trace-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
  return context.traceId;
}