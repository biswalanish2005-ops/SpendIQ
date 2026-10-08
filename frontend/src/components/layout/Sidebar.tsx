import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAVIGATION_ITEMS, type NavItem } from '../../constants/navigation';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { Tooltip } from '../ui/Tooltip';
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
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
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

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
}) => {
  const renderNavIcon = (iconName: string, active: boolean) => {
    const IconComponent = ICON_MAP[iconName] || LayoutDashboard;
    return (
      <IconComponent
        size={18}
        className={cn(
          'shrink-0 transition-colors',
          active ? 'text-primary' : 'text-textSecondary group-hover:text-textPrimary'
        )}
      />
    );
  };

  const renderNavItem = (item: NavItem) => {
    const content = (
      <NavLink
        key={item.id}
        to={item.path}
        className={({ isActive }) =>
          cn(
            'group relative flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
            isActive
              ? 'bg-cardElevated text-textPrimary shadow-sm border border-borderLight'
              : 'text-textSecondary hover:text-textPrimary hover:bg-surface/70',
            isCollapsed && 'justify-center px-2'
          )
        }
      >
        {({ isActive }) => (
          <>
            {renderNavIcon(item.iconName, isActive)}
            {!isCollapsed && (
              <span className="truncate flex-1">{item.label}</span>
            )}
            {!isCollapsed && item.badge && (
              <Badge variant={item.badgeVariant || 'default'} size="sm">
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </NavLink>
    );

    if (isCollapsed) {
      return (
        <Tooltip key={item.id} content={item.label} position="right">
          {content}
        </Tooltip>
      );
    }

    return content;
  };

  const coreItems = NAVIGATION_ITEMS.filter((i) => i.section === 'core');
  const intelligenceItems = NAVIGATION_ITEMS.filter((i) => i.section === 'intelligence');
  const managementItems = NAVIGATION_ITEMS.filter((i) => i.section === 'management');

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r border-border bg-surface transition-all duration-200 z-30 select-none',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 text-primary">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-textPrimary">
                Spend<span className="text-primary font-black">IQ</span>
              </div>
              <div className="text-[10px] text-ai font-mono -mt-0.5">
                FINANCIAL AI
              </div>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-lg bg-primary/15 border border-primary/30 text-primary">
            <ShieldCheck size={18} />
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'p-1.5 rounded-lg text-textMuted hover:text-textPrimary hover:bg-card transition-colors',
            isCollapsed && 'hidden'
          )}
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* Navigation Groups */}
      <nav aria-label="Main Navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Core Section */}
        <div>
          {!isCollapsed && (
            <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-textMuted uppercase">
              Financial Core
            </div>
          )}
          <div className="space-y-1">{coreItems.map(renderNavItem)}</div>
        </div>

        {/* Intelligence Section */}
        <div>
          {!isCollapsed && (
            <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-ai uppercase flex items-center justify-between">
              <span>AI & Forecasting</span>
              <Sparkles size={11} className="text-ai" />
            </div>
          )}
          <div className="space-y-1">{intelligenceItems.map(renderNavItem)}</div>
        </div>

        {/* Management Section */}
        <div>
          {!isCollapsed && (
            <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-textMuted uppercase">
              System
            </div>
          )}
          <div className="space-y-1">{managementItems.map(renderNavItem)}</div>
        </div>
      </nav>

      {/* Collapse Toggle Footer */}
      <div className="p-3 border-t border-border flex items-center justify-center">
        <button
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!isCollapsed}
          className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-card text-xs font-medium transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ai"
        >
          {isCollapsed ? (
            <ChevronRight size={16} />
          ) : (
            <>
              <ChevronLeft size={16} />
              <span>Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
