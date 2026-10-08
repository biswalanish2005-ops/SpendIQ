import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { MobileNav } from './MobileNav';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-textPrimary flex">
      {/* Accessible Skip Link for keyboard & screen reader navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:font-medium focus:text-xs focus:rounded-lg focus:shadow-elevated focus:outline-none focus:ring-2 focus:ring-ai"
      >
        Skip to main content
      </a>

      {/* Desktop Left Sidebar Rail */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Mobile Drawer */}
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
        />

        <main
          id="main-content"
          tabIndex={-1}
          role="main"
          className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200 outline-none"
        >
          {children}
        </main>
      </div>
    </div>
  );
};
