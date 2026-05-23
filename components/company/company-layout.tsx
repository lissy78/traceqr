/**
 * @fileoverview Company Portal Layout Component
 * Provides navigation and structure for company/producer portal
 * @module components/company/company-layout
 */

"use client"

import { useState, useCallback, type ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  TraceQRLogo,
  HomeIcon,
  ChartIcon,
  ReportIcon,
  SettingsIcon,
  LogoutIcon,
  BellIcon,
  MenuIcon,
} from "@/components/icons"
import { appEventEmitter, AppEventType } from "@/lib/events"

// =====================================================
// TYPES
// =====================================================

interface CompanyLayoutProps {
  /** Child components to render in the main content area */
  children: ReactNode
  /** Company name to display in header */
  companyName?: string
  /** Company prefix (e.g., "UVY001") */
  companyPrefix?: string
}

interface NavItemProps {
  /** Navigation item label */
  label: string
  /** Route path */
  href: string
  /** Icon component */
  icon: ReactNode
  /** Whether item is currently active */
  isActive: boolean
}

// =====================================================
// NAVIGATION CONFIGURATION
// =====================================================

const NAV_ITEMS = [
  { label: "Inicio", href: "/empresa", icon: <HomeIcon className="size-5" /> },
  { label: "Trazabilidad", href: "/empresa/trazabilidad", icon: <ChartIcon className="size-5" /> },
  { label: "Reportes", href: "/empresa/reportes", icon: <ReportIcon className="size-5" /> },
  { label: "Ajustes", href: "/empresa/ajustes", icon: <SettingsIcon className="size-5" /> },
]

// =====================================================
// NAV ITEM COMPONENT
// =====================================================

/**
 * NavItem - Individual navigation item
 * @param {NavItemProps} props - Component props
 * @returns {JSX.Element} Navigation item
 */
function NavItem({ label, href, icon, isActive }: NavItemProps): JSX.Element {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}

// =====================================================
// MAIN COMPONENT
// =====================================================

/**
 * CompanyLayout - Main layout wrapper for company portal
 * Features sidebar navigation, header with notifications, and main content area
 * @param {CompanyLayoutProps} props - Component props
 * @returns {JSX.Element} Company portal layout
 */
export function CompanyLayout({
  children,
  companyName = "AguaYumbo S.A.S.",
  companyPrefix = "UVY001",
}: CompanyLayoutProps): JSX.Element {
  // State for mobile menu visibility
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false)
  
  // Get current path for active state
  const pathname = usePathname()

  /**
   * Handles logout action
   * Emits logout event and redirects to login
   */
  const handleLogout = useCallback((): void => {
    appEventEmitter.emit(AppEventType.USER_LOGOUT, undefined)
    // Redirect handled by event listener
  }, [])

  /**
   * Toggles mobile menu visibility
   */
  const toggleMobileMenu = useCallback((): void => {
    setIsMobileMenuOpen((prev) => !prev)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* ==================== SIDEBAR (Desktop) ==================== */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r border-border bg-card lg:block">
        {/* Logo and Company Info */}
        <div className="flex h-16 items-center gap-3 border-b border-border px-6">
          <TraceQRLogo className="size-8 text-primary" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">TraceQR</span>
            <span className="text-xs text-muted-foreground">Portal Empresa</span>
          </div>
        </div>

        {/* Company Badge */}
        <div className="border-b border-border p-4">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground">Empresa</p>
            <p className="font-semibold text-foreground">{companyName}</p>
            <p className="text-xs text-primary">Prefijo: {companyPrefix}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-4">
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              isActive={pathname === item.href}
            />
          ))}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogoutIcon className="size-5" />
            <span>Cerrar sesion</span>
          </button>
        </div>
      </aside>

      {/* ==================== MOBILE HEADER ==================== */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMobileMenu}
            className="rounded-lg p-2 hover:bg-muted"
            aria-label="Toggle menu"
          >
            <MenuIcon className="size-6" />
          </button>
          <TraceQRLogo className="size-6 text-primary" />
        </div>
        <button className="relative rounded-lg p-2 hover:bg-muted">
          <BellIcon className="size-6" />
          <span className="absolute right-1 top-1 size-2 rounded-full bg-primary" />
        </button>
      </header>

      {/* ==================== MOBILE MENU OVERLAY ==================== */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={toggleMobileMenu}
        >
          <aside
            className="absolute inset-y-0 left-0 w-64 bg-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Same content as desktop sidebar */}
            <div className="flex h-16 items-center gap-3 border-b border-border px-6">
              <TraceQRLogo className="size-8 text-primary" />
              <span className="font-semibold">TraceQR</span>
            </div>
            <nav className="flex flex-col gap-1 p-4">
              {NAV_ITEMS.map((item) => (
                <NavItem
                  key={item.href}
                  {...item}
                  isActive={pathname === item.href}
                />
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* ==================== MAIN CONTENT ==================== */}
      <main className="min-h-screen pt-16 lg:ml-64 lg:pt-0">
        {/* Desktop Header */}
        <header className="hidden h-16 items-center justify-between border-b border-border bg-card px-6 lg:flex">
          <div>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString("es-CO", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative rounded-lg p-2 hover:bg-muted">
              <BellIcon className="size-5" />
              <span className="absolute right-1 top-1 size-2 rounded-full bg-primary" />
            </button>
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">AY</span>
              </div>
              <span className="text-sm font-medium">{companyName}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
