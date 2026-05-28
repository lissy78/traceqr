/**
 * @fileoverview Admin Layout Component
 * Provides navigation and structure for TraceQR admin panel
 * @module components/admin/admin-layout
 */

"use client"

import { useState, useCallback, type ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { appEventEmitter, AppEventType } from "@/lib/events"
import {
  TraceQRLogo,
  HomeIcon,
  UsersIcon,
  BuildingIcon,
  ChartIcon,
  SettingsIcon,
  LogoutIcon,
  BellIcon,
  MenuIcon,
  AlertIcon,
} from "@/components/icons"

// =====================================================
// TYPES
// =====================================================

interface AdminLayoutProps {
  /** Child components to render in main content area */
  children: ReactNode
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
  /** Optional badge count */
  badge?: number
}

// =====================================================
// NAVIGATION CONFIGURATION
// =====================================================

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: <HomeIcon className="size-5" /> },
  { label: "Usuarios", href: "/admin/usuarios", icon: <UsersIcon className="size-5" /> },
  { label: "Empresas", href: "/admin/empresas", icon: <BuildingIcon className="size-5" /> },
  { label: "Trazabilidad", href: "/admin/trazabilidad", icon: <ChartIcon className="size-5" />, badge: 3 },
  { label: "Reportes", href: "/admin/reportes", icon: <ChartIcon className="size-5" /> },
  { label: "Configuracion", href: "/admin/config", icon: <SettingsIcon className="size-5" /> },
]

// =====================================================
// NAV ITEM COMPONENT
// =====================================================

/**
 * NavItem - Individual navigation item for admin sidebar
 * @param {NavItemProps} props - Component props
 * @returns {JSX.Element} Navigation item
 */
function NavItem({ label, href, icon, isActive, badge }: NavItemProps): JSX.Element {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>
      {badge && badge > 0 && (
        <span className={cn(
          "flex size-5 items-center justify-center rounded-full text-xs font-semibold",
          isActive ? "bg-primary-foreground text-primary" : "bg-destructive text-destructive-foreground"
        )}>
          {badge}
        </span>
      )}
    </Link>
  )
}

// =====================================================
// MAIN COMPONENT
// =====================================================

/**
 * AdminLayout - Main layout wrapper for admin panel
 * Features dark sidebar, system alerts, and main content area
 * @param {AdminLayoutProps} props - Component props
 * @returns {JSX.Element} Admin panel layout
 */
export function AdminLayout({ children }: AdminLayoutProps): JSX.Element {
  // State for mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false)
  
  // Get current path for active state
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = useCallback(async (): Promise<void> => {
    const supabase = createClient()
    await supabase.auth.signOut()
    appEventEmitter.emit(AppEventType.USER_LOGOUT, undefined)
    router.replace("/admin/login")
    router.refresh()
  }, [router])

  /**
   * Toggles mobile menu visibility
   */
  const toggleMobileMenu = useCallback((): void => {
    setIsMobileMenuOpen((prev) => !prev)
  }, [])

  return (
    <div className="min-h-screen bg-muted/30">
      {/* ==================== SIDEBAR (Desktop) ==================== */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 bg-slate-900 lg:block">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
            <TraceQRLogo className="size-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-white">TraceQR</span>
            <span className="text-xs text-slate-400">Panel de Admin</span>
          </div>
        </div>

        {/* System Status */}
        <div className="mx-4 my-4 rounded-lg bg-green-500/10 px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="size-2 animate-pulse rounded-full bg-green-500" />
            <span className="text-xs font-medium text-green-400">Sistema activo</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              isActive={pathname === item.href}
            />
          ))}
        </nav>

        {/* Admin Info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-700 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              DM
            </div>
            <div>
              <p className="text-sm font-medium text-white">TraceQR Admin</p>
              <p className="text-xs text-slate-400">admin@traceqr.co</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <LogoutIcon className="size-5" />
            <span>Cerrar sesion</span>
          </button>
        </div>
      </aside>

      {/* ==================== MOBILE HEADER ==================== */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-slate-900 px-4 lg:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMobileMenu}
            className="rounded-lg p-2 text-white hover:bg-slate-800"
            aria-label="Toggle menu"
          >
            <MenuIcon className="size-6" />
          </button>
          <TraceQRLogo className="size-6 text-primary" />
          <span className="font-semibold text-white">Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative rounded-lg p-2 text-white hover:bg-slate-800">
            <AlertIcon className="size-5 text-amber-500" />
          </button>
          <button className="relative rounded-lg p-2 text-white hover:bg-slate-800">
            <BellIcon className="size-5" />
            <span className="absolute right-1 top-1 size-2 rounded-full bg-destructive" />
          </button>
        </div>
      </header>

      {/* ==================== MOBILE MENU OVERLAY ==================== */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={toggleMobileMenu}
        >
          <aside
            className="absolute inset-y-0 left-0 w-64 bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-16 items-center gap-3 px-6">
              <TraceQRLogo className="size-8 text-primary" />
              <span className="font-semibold text-white">TraceQR Admin</span>
            </div>
            <nav className="flex flex-col gap-1 px-3">
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
            <p className="text-sm font-medium text-foreground">
              {new Date().toLocaleDateString("es-CO", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <p className="text-xs text-muted-foreground">TraceQR Admin</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Alerts Button */}
            <button className="relative flex items-center gap-2 rounded-lg bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-200">
              <AlertIcon className="size-4" />
              <span>3 alertas</span>
            </button>
            {/* Notifications */}
            <button className="relative rounded-lg p-2 hover:bg-muted">
              <BellIcon className="size-5" />
              <span className="absolute right-1 top-1 size-2 rounded-full bg-destructive" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
