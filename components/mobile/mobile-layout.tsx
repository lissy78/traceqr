'use client';

/**
 * =====================================================
 * Mobile App Layout Component
 * Provides the shell structure for the mobile PWA
 * Includes bottom navigation and safe area handling
 * =====================================================
 */

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useEvent, useEmit } from '@/lib/events';
import type { MobileNavTab } from '@/lib/types';
import {
  HomeIcon,
  ScanIcon,
  GiftIcon,
  LeafIcon,
  UserIcon,
} from '@/components/icons';

// =====================================================
// NAVIGATION CONFIGURATION
// =====================================================

/** Navigation items for mobile bottom bar */
const NAV_ITEMS: { id: MobileNavTab; label: string; Icon: typeof HomeIcon }[] = [
  { id: 'inicio', label: 'Inicio', Icon: HomeIcon },
  { id: 'escanear', label: 'Escanear', Icon: ScanIcon },
  { id: 'canjear', label: 'Canjear', Icon: GiftIcon },
  { id: 'impacto', label: 'Impacto', Icon: LeafIcon },
  { id: 'perfil', label: 'Perfil', Icon: UserIcon },
];

// =====================================================
// PROPS INTERFACE
// =====================================================

interface MobileLayoutProps {
  /** Content to render in the main area */
  children: React.ReactNode;
  /** Currently active navigation tab */
  activeTab: MobileNavTab;
  /** Callback when navigation tab changes */
  onTabChange: (tab: MobileNavTab) => void;
  /** Hide bottom navigation (e.g., during scanning) */
  hideNavigation?: boolean;
}

// =====================================================
// MOBILE LAYOUT COMPONENT
// =====================================================

export function MobileLayout({
  children,
  activeTab,
  onTabChange,
  hideNavigation = false,
}: MobileLayoutProps) {
  // Emit navigation change event
  const emitNavChange = useEmit('nav:change');

  /**
   * Handle navigation tab press
   * Emits event and calls parent callback
   */
  const handleTabPress = useCallback(
    (tab: MobileNavTab) => {
      emitNavChange({ tab });
      onTabChange(tab);
    },
    [emitNavChange, onTabChange]
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Main content area with safe area padding */}
      <main 
        className={cn(
          'flex-1 overflow-y-auto no-scrollbar safe-top',
          !hideNavigation && 'pb-20' // Space for bottom nav
        )}
      >
        {children}
      </main>

      {/* Bottom Navigation Bar */}
      {!hideNavigation && (
        <nav 
          className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-bottom z-50"
          role="navigation"
          aria-label="Navegacion principal"
        >
          <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
            {NAV_ITEMS.map(({ id, label, Icon }) => {
              const isActive = activeTab === id;
              const isScanner = id === 'escanear';

              return (
                <button
                  key={id}
                  onClick={() => handleTabPress(id)}
                  className={cn(
                    'flex flex-col items-center justify-center flex-1 h-full',
                    'transition-colors duration-200',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    isActive 
                      ? 'text-primary' 
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={label}
                >
                  {/* Scanner button has special styling */}
                  {isScanner ? (
                    <div 
                      className={cn(
                        'flex items-center justify-center w-14 h-14 -mt-6',
                        'rounded-full bg-primary text-primary-foreground',
                        'shadow-lg transition-transform duration-200',
                        isActive && 'scale-110'
                      )}
                    >
                      <Icon size={28} />
                    </div>
                  ) : (
                    <>
                      <Icon 
                        size={24} 
                        className={cn(
                          'transition-transform duration-200',
                          isActive && 'scale-110'
                        )} 
                      />
                      <span className="text-xs mt-1 font-medium">{label}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

// =====================================================
// MOBILE HEADER COMPONENT
// =====================================================

interface MobileHeaderProps {
  /** Title to display */
  title?: string;
  /** Show back button */
  showBack?: boolean;
  /** Back button callback */
  onBack?: () => void;
  /** Right side action content */
  rightAction?: React.ReactNode;
  /** Make header transparent */
  transparent?: boolean;
}

export function MobileHeader({
  title,
  showBack = false,
  onBack,
  rightAction,
  transparent = false,
}: MobileHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 safe-top',
        'flex items-center justify-between h-14 px-4',
        transparent 
          ? 'bg-transparent' 
          : 'bg-card/80 backdrop-blur-md border-b border-border'
      )}
    >
      {/* Left side - Back button or spacer */}
      <div className="w-10">
        {showBack && (
          <button
            onClick={onBack}
            className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Volver"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Center - Title */}
      {title && (
        <h1 className="text-lg font-semibold text-foreground truncate">
          {title}
        </h1>
      )}

      {/* Right side - Action or spacer */}
      <div className="w-10 flex justify-end">
        {rightAction}
      </div>
    </header>
  );
}

// =====================================================
// MOBILE PAGE WRAPPER
// =====================================================

interface MobilePageProps {
  children: React.ReactNode;
  className?: string;
}

export function MobilePage({ children, className }: MobilePageProps) {
  return (
    <div className={cn('flex flex-col min-h-full', className)}>
      {children}
    </div>
  );
}
