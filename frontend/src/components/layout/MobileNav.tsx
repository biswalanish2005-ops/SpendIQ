import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { NAVIGATION_ITEMS } from '../../constants/navigation';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import {
  LayoutDashboard,
  BarChart3,
  Receipt,
  PiggyBank,
  TrendingUp,
  BrainCircuit,
  Sparkles,
  Bot,
  AlertTriangle,
  UploadCloud,
  Settings,
  X,
  ShieldCheck,
} from 'lucide-react';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  BarChart3,
  Receipt,
  PiggyBank,
  TrendingUp,
  BrainCircuit,
  Sparkles,
  Bot,
  AlertTriangle,
  UploadCloud,
  Settings,
};

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation"
      className="fixed inset-0 z-50 md:hidden"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-4/5 max-w-xs bg-surface border-r border-border shadow-elevated p-4 flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 text-primary">
                <ShieldCheck size={18} />
              </div>
              <div className="font-bold text-sm tracking-tight text-textPrimary">
                Spend<span className="text-primary font-black">IQ</span>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close navigation menu"
              className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-textMuted hover:text-textPrimary hover:bg-card focus:outline-none focus-visible:ring-1 focus-visible:ring-ai"
            >
              <X size={20} />
            </button>
          </div>

          {/* Nav List */}
          <nav aria-label="Mobile Navigation Links" className="space-y-1.5 overflow-y-auto max-h-[75vh]">
            {NAVIGATION_ITEMS.map((item) => {
              const IconComponent = ICON_MAP[item.iconName] || LayoutDashboard;
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between px-3.5 py-3 rounded-lg text-xs font-medium transition-colors min-h-[44px] focus:outline-none focus-visible:ring-1 focus-visible:ring-ai',
                      isActive
                        ? 'bg-cardElevated text-primary border border-borderLight font-semibold'
                        : 'text-textSecondary hover:text-textPrimary hover:bg-card/60'
                    )
                  }
                >
                  <div className="flex items-center gap-3">
                    <IconComponent size={18} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <Badge variant={item.badgeVariant || 'default'} size="sm">
                      {item.badge}
                    </Badge>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-border text-[11px] text-textMuted text-center">
          AI Financial Intelligence Platform
        </div>
      </div>
    </div>
  );
};
