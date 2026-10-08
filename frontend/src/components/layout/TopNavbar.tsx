import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NAVIGATION_ITEMS } from '../../constants/navigation';
import { Button } from '../ui/Button';
import { GlobalFilterBar } from '../common/GlobalFilterBar';
import { Sparkles, AlertTriangle, Menu } from 'lucide-react';

interface TopNavbarProps {
  onOpenMobileNav: () => void;
  dateRange?: string;
  onDateRangeChange?: (range: string) => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onOpenMobileNav,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const currentItem = NAVIGATION_ITEMS.find((item) => item.path === location.pathname) || {
    label: 'Overview',
  };

  return (
    <header role="banner" className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 lg:px-8 border-b border-border bg-background/80 backdrop-blur-md">
      {/* Mobile Menu & Active Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          className="p-2 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-surface md:hidden focus:outline-none focus-visible:ring-1 focus-visible:ring-ai"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 className="text-base lg:text-lg font-bold tracking-tight text-textPrimary">
            {currentItem.label}
          </h1>
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-textMuted">
            <span>Portfolio</span>
            <span>/</span>
            <span className="text-textSecondary">{currentItem.label}</span>
          </div>
        </div>
      </div>

      {/* Global Context Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Synchronized Global Filter Bar */}
        <GlobalFilterBar isCompact={false} />

        {/* Anomaly Badge Shortcut */}
        <button
          onClick={() => navigate('/anomalies')}
          className="relative hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-surface hover:border-warning/40 text-xs text-textSecondary transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ai"
          title="Detected Anomalies"
          aria-label="View detected anomalies"
        >
          <AlertTriangle size={14} className="text-warning" />
          <span className="hidden md:inline">Anomalies</span>
          <span className="w-1.5 h-1.5 rounded-full bg-warning animate-ping" />
        </button>

        {/* Grounded AI Assistant Quick Action */}
        <Button
          variant="ai"
          size="sm"
          onClick={() => navigate('/assistant')}
          aria-label="Open AI Assistant"
          leftIcon={<Sparkles size={14} className="text-ai" />}
        >
          <span className="hidden sm:inline">Ask AI</span>
        </Button>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-mono text-xs font-semibold">
            JD
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-medium text-textPrimary leading-none">
              John Doe
            </div>
            <div className="text-[10px] text-textMuted leading-none mt-1">
              Active Member
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
