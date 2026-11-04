import React from 'react';

// Route-level loading skeleton for the homepage
// Shown by Next.js while the page is streaming
export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav skeleton */}
      <div className="h-16 border-b border-gray-100 animate-pulse bg-gray-50" />
      {/* Hero skeleton */}
      <div className="max-w-6xl mx-auto px-4 py-24 space-y-6">
        <div className="h-12 bg-gray-100 rounded-lg animate-pulse w-3/4 mx-auto" />
        <div className="h-6 bg-gray-100 rounded animate-pulse w-1/2 mx-auto" />
        <div className="h-12 bg-gray-100 rounded-lg animate-pulse w-40 mx-auto" />
      </div>
    </div>
  );
}

