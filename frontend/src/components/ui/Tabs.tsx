import React from 'react';
import { cn } from '../../lib/utils';

export interface TabItem<T = string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps<T = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  variant?: 'pill' | 'underline';
  className?: string;
}

export function Tabs<T extends string | number>({
  tabs,
  activeTab,
  onChange,
  variant = 'pill',
  className,
}: TabsProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-1',
        variant === 'pill' && 'p-1 rounded-lg bg-surface border border-border',
        variant === 'underline' && 'border-b border-border gap-4',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={String(tab.id)}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 text-xs font-medium transition-all duration-150 focus:outline-none select-none',
              variant === 'pill' && [
                'px-3 py-1.5 rounded-md',
                isActive
                  ? 'bg-cardElevated text-textPrimary shadow-sm border border-borderLight font-semibold'
                  : 'text-textSecondary hover:text-textPrimary hover:bg-card/50',
              ],
              variant === 'underline' && [
                'pb-2.5 px-1 relative',
                isActive
                  ? 'text-primary font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
                  : 'text-textSecondary hover:text-textPrimary',
              ]
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.2 rounded-full font-mono',
                  isActive ? 'bg-primary/20 text-primary' : 'bg-surface text-textMuted'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
