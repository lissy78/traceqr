/**
 * @fileoverview Company Dashboard Component
 * Displays KPIs, monthly reports, plastic type breakdown, and traceability
 * @module components/company/company-dashboard
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import {
  PackageIcon,
  LeafIcon,
  WaterIcon,
  ChartIcon,
  CheckCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@/components/icons"
import { appEventEmitter, AppEventType } from "@/lib/events"
import type { CompanyStats, PlasticType, TraceabilityEvent } from "@/lib/types"

// =====================================================
// MOCK DATA (Replace with Supabase queries)
// =====================================================

const MOCK_COMPANY_STATS: CompanyStats = {
  totalScans: 8420,
  totalKgTracked: 421,
  closureRate: 84.2,
  qrGenerated: 10000,
  scansChange: 12,
  kgChange: 8,
  closureChange: 3,
}

const MOCK_PLASTIC_BREAKDOWN: Array<{ type: PlasticType; count: number; percentage: number }> = [
  { type: "PET", count: 31, percentage: 72 },
  { type: "HDPE", count: 10, percentage: 23 },
  { type: "PP", count: 2, percentage: 5 },
]

const MOCK_TRACEABILITY: TraceabilityEvent[] = [
  {
    id: "1",
    qrCode: "UVY001-PET500",
    event: "scanned",
    location: "Bloque A - Planta de acopio confirmada",
    timestamp: new Date().toISOString(),
  },
  {
    id: "2",
    qrCode: "UVY001-HDPE1L",
    event: "collected",
    location: "Cafeteria central",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "3",
    qrCode: "UVY002-PET1L",
    event: "recycled",
    location: "Bloque C - Zona industrial",
    timestamp: new Date(Date.now() - 172800000).toISOString(),
  },
]

// =====================================================
// HELPER COMPONENTS
// =====================================================

/**
 * KPICard - Displays a single KPI metric with change indicator
 */
interface KPICardProps {
  /** Title of the KPI */
  title: string
  /** Main value to display */
  value: string | number
  /** Unit suffix (e.g., "kg", "%") */
  unit?: string
  /** Percentage change from previous period */
  change?: number
  /** Icon to display */
  icon: React.ReactNode
  /** Background color class */
  bgColor?: string
}

function KPICard({
  title,
  value,
  unit = "",
  change,
  icon,
  bgColor = "bg-primary/10",
}: KPICardProps): JSX.Element {
  const isPositive = change && change > 0
  const isNegative = change && change < 0

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {typeof value === "number" ? value.toLocaleString() : value}
            {unit && <span className="ml-1 text-lg font-normal text-muted-foreground">{unit}</span>}
          </p>
          {change !== undefined && (
            <div
              className={cn(
                "mt-2 flex items-center gap-1 text-sm",
                isPositive && "text-green-600",
                isNegative && "text-red-600",
                !isPositive && !isNegative && "text-muted-foreground"
              )}
            >
              {isPositive && <ArrowUpIcon className="size-4" />}
              {isNegative && <ArrowDownIcon className="size-4" />}
              <span>
                {isPositive && "+"}
                {change}% vs. mes anterior
              </span>
            </div>
          )}
        </div>
        <div className={cn("rounded-lg p-3", bgColor)}>{icon}</div>
      </div>
    </div>
  )
}

/**
 * PlasticBreakdownBar - Visual bar showing plastic type distribution
 */
interface PlasticBreakdownBarProps {
  type: PlasticType
  count: number
  percentage: number
}

function PlasticBreakdownBar({ type, count, percentage }: PlasticBreakdownBarProps): JSX.Element {
  // Color mapping for plastic types
  const colorMap: Record<PlasticType, string> = {
    PET: "bg-primary",
    HDPE: "bg-chart-2",
    PP: "bg-chart-3",
    LDPE: "bg-chart-4",
    PS: "bg-chart-5",
    OTHER: "bg-muted-foreground",
  }

  return (
    <div className="flex items-center gap-4">
      <span className="w-12 text-sm font-medium text-foreground">{type}</span>
      <div className="flex-1">
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all", colorMap[type])}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <span className="w-8 text-right text-sm font-semibold text-foreground">{count}</span>
    </div>
  )
}

/**
 * TraceabilityItem - Single item in traceability feed
 */
interface TraceabilityItemProps {
  event: TraceabilityEvent
}

function TraceabilityItem({ event }: TraceabilityItemProps): JSX.Element {
  // Status color and label mapping
  const statusConfig: Record<string, { color: string; label: string }> = {
    scanned: { color: "bg-blue-500", label: "escaneado" },
    collected: { color: "bg-yellow-500", label: "acopiado" },
    recycled: { color: "bg-green-500", label: "reciclado" },
  }

  const config = statusConfig[event.event] || { color: "bg-muted", label: event.event }
  const timeAgo = getTimeAgo(new Date(event.timestamp))

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card/50 p-4">
      <div className={cn("mt-1 size-2 rounded-full", config.color)} />
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">
          {event.qrCode} - {config.label}
        </p>
        <p className="text-xs text-muted-foreground">{event.location}</p>
      </div>
      <span className="text-xs text-muted-foreground">{timeAgo}</span>
    </div>
  )
}

/**
 * Formats a date as relative time (e.g., "Hoy", "Ayer", "20 may")
 */
function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Hoy"
  if (diffDays === 1) return "Ayer"
  return date.toLocaleDateString("es-CO", { day: "numeric", month: "short" })
}

// =====================================================
// MAIN COMPONENT
// =====================================================

/**
 * CompanyDashboard - Main dashboard view for company portal
 * Displays KPIs, plastic breakdown, traceability feed, and REP report
 * @returns {JSX.Element} Company dashboard
 */
export function CompanyDashboard(): JSX.Element {
  // State for dashboard data
  const [stats, setStats] = useState<CompanyStats>(MOCK_COMPANY_STATS)
  const [plasticBreakdown] = useState(MOCK_PLASTIC_BREAKDOWN)
  const [traceability] = useState(MOCK_TRACEABILITY)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  /**
   * Fetches dashboard data from Supabase
   * TODO: Replace with actual Supabase query
   */
  const fetchDashboardData = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))
      // Data would come from Supabase here
      setStats(MOCK_COMPANY_STATS)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch data on mount
  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Listen for scan events to refresh data
  useEffect(() => {
    const handleScan = (): void => {
      fetchDashboardData()
    }

    appEventEmitter.on(AppEventType.QR_SCANNED, handleScan)
    return () => {
      appEventEmitter.off(AppEventType.QR_SCANNED, handleScan)
    }
  }, [fetchDashboardData])

  return (
    <div className="space-y-6">
      {/* ==================== HEADER ==================== */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Panel de Control</h1>
        <p className="text-muted-foreground">
          Resumen de trazabilidad y metricas de cumplimiento REP
        </p>
      </div>

      {/* ==================== KPI CARDS ==================== */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Escaneos totales"
          value={stats.totalScans}
          change={stats.scansChange}
          icon={<PackageIcon className="size-6 text-primary" />}
          bgColor="bg-primary/10"
        />
        <KPICard
          title="Plastico rastreado"
          value={stats.totalKgTracked}
          unit="kg"
          change={stats.kgChange}
          icon={<LeafIcon className="size-6 text-green-600" />}
          bgColor="bg-green-100"
        />
        <KPICard
          title="Tasa de cierre"
          value={stats.closureRate}
          unit="%"
          change={stats.closureChange}
          icon={<CheckCircleIcon className="size-6 text-amber-600" />}
          bgColor="bg-amber-100"
        />
        <KPICard
          title="QR generados"
          value={stats.qrGenerated}
          icon={<ChartIcon className="size-6 text-blue-600" />}
          bgColor="bg-blue-100"
        />
      </div>

      {/* ==================== MIDDLE SECTION ==================== */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Plastic Type Breakdown */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Por tipo de plastico</h2>
          <div className="space-y-4">
            {plasticBreakdown.map((item) => (
              <PlasticBreakdownBar key={item.type} {...item} />
            ))}
          </div>
        </div>

        {/* REP Monthly Report */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Reporte REP - {new Date().toLocaleDateString("es-CO", { month: "long", year: "numeric" }).toUpperCase()}
            </h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Periodo</span>
              <span className="font-medium">01/05 - 31/05/2026</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Escaneos</span>
              <span className="font-medium">{stats.totalScans.toLocaleString()} unidades</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kg estimados</span>
              <span className="font-medium">{stats.totalKgTracked}.00 kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tasa de cierre</span>
              <span className="font-medium text-green-600">{stats.closureRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estado MADS</span>
              <span className="font-medium text-primary">Listo para enviar</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== TRACEABILITY FEED ==================== */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Trazabilidad reciente</h2>
          <button className="text-sm font-medium text-primary hover:underline">
            Ver todos
          </button>
        </div>
        <div className="space-y-3">
          {traceability.map((event) => (
            <TraceabilityItem key={event.id} event={event} />
          ))}
        </div>
      </div>

      {/* ==================== ENVIRONMENTAL IMPACT ==================== */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-gradient-to-br from-green-50 to-green-100 p-6 dark:from-green-950/20 dark:to-green-900/20">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-white p-3 shadow-sm">
              <LeafIcon className="size-8 text-green-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-green-700 dark:text-green-400">315 kg</p>
              <p className="text-sm text-green-600 dark:text-green-500">
                CO<sub>2</sub> Reducido
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-gradient-to-br from-blue-50 to-blue-100 p-6 dark:from-blue-950/20 dark:to-blue-900/20">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-white p-3 shadow-sm">
              <WaterIcon className="size-8 text-blue-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">17,200 L</p>
              <p className="text-sm text-blue-600 dark:text-blue-500">Agua Ahorrada</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
