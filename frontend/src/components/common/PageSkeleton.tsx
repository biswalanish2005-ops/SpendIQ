import React from 'react';

/**
 * Full-page loading skeleton shown while lazy-loaded page chunks are being fetched.
 * Renders a realistic shimmer layout matching the general page structure.
 */
export const PageSkeleton: React.FC = () => {
  return (
    <div
      className="min-h-screen w-full p-6 animate-pulse"
      role="status"
      aria-label="Loading page content"
      aria-busy="true"
    >
      {/* Page header skeleton */}
      <div className="mb-8 space-y-3">
        <div className="h-8 w-56 rounded-lg bg-elevated" />
        <div className="h-4 w-80 rounded bg-elevated opacity-60" />
      </div>

      {/* Metric cards row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-card border border-border p-5 space-y-3">
            <div className="h-3 w-20 rounded bg-elevated" />
            <div className="h-7 w-28 rounded bg-elevated" />
            <div className="h-3 w-16 rounded bg-elevated opacity-50" />
          </div>
        ))}
      </div>

      {/* Chart area skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
        <div className="lg:col-span-2 rounded-xl bg-card border border-border p-5">
          <div className="h-4 w-40 rounded bg-elevated mb-4" />
          <div className="h-64 rounded-lg bg-elevated opacity-40" />
        </div>
        <div className="rounded-xl bg-card border border-border p-5">
          <div className="h-4 w-32 rounded bg-elevated mb-4" />
          <div className="h-64 rounded-lg bg-elevated opacity-40" />
        </div>
      </div>

      {/* Table/list area skeleton */}
      <div className="rounded-xl bg-card border border-border p-5">
        <div className="h-4 w-36 rounded bg-elevated mb-5" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-9 w-9 rounded-full bg-elevated flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded bg-elevated" />
                <div className="h-3 w-20 rounded bg-elevated opacity-60" />
              </div>
              <div className="h-4 w-16 rounded bg-elevated" />
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only">Loading page content, please wait…</span>
    </div>
  );
};
