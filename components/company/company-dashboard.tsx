/**
 * @fileoverview Company Dashboard Component
 * Displays KPIs, monthly reports, plastic type breakdown, and traceability
 * @module components/company/company-dashboard
 */

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
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
import type { CompanyDashboardData } from "@/lib/dashboard-data"
import type { PlasticType, TraceabilityEvent } from "@/lib/types"

interface KPICardProps {
  title: string
  value: string | number
  unit?: string
  change?: number
  icon: React.ReactNode
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
  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0

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
                !isPositive && !isNegative && "text-muted-foreground",
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

interface PlasticBreakdownBarProps {
  type: PlasticType
  count: number
  percentage: number
}

function PlasticBreakdownBar({ type, count, percentage }: PlasticBreakdownBarProps): JSX.Element {
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

function TraceabilityItem({ event }: { event: TraceabilityEvent }): JSX.Element {
  const statusConfig: Record<string, { color: string; label: string }> = {
    scanned: { color: "bg-blue-500", label: "escaneado" },
    collected: { color: "bg-yellow-500", label: "acopiado" },
    recycled: { color: "bg-green-500", label: "reciclado" },
    invalid: { color: "bg-red-500", label: "rechazado" },
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

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Hoy"
  if (diffDays === 1) return "Ayer"
  return date.toLocaleDateString("es-CO", { day: "numeric", month: "short" })
}

function currentPeriod(): string {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const format = (date: Date) => date.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit" })
  return `${format(firstDay)} - ${format(lastDay)}/${now.getFullYear()}`
}

export function CompanyDashboard({ data }: { data: CompanyDashboardData }): JSX.Element {
  const router = useRouter()
  const { stats, plasticBreakdown, traceability } = data
  const co2Reduced = Number((stats.totalKgTracked * 0.75).toFixed(1))
  const waterSaved = Math.round(stats.totalKgTracked * 40)

  useEffect(() => {
    const handleScan = (): void => {
      router.refresh()
    }

    appEventEmitter.on(AppEventType.QR_SCANNED, handleScan)
    return () => {
      appEventEmitter.off(AppEventType.QR_SCANNED, handleScan)
    }
  }, [router])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Panel de Control</h1>
        <p className="text-muted-foreground">
          Resumen de trazabilidad y metricas de cumplimiento REP
        </p>
      </div>

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

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Por tipo de plastico</h2>
          <div className="space-y-4">
            {plasticBreakdown.length > 0 ? plasticBreakdown.map((item) => (
              <PlasticBreakdownBar key={item.type} {...item} />
            )) : (
              <p className="text-sm text-muted-foreground">Aun no hay escaneos para graficar.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Reporte REP - {new Date().toLocaleDateString("es-CO", { month: "long", year: "numeric" }).toUpperCase()}
            </h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Periodo</span>
              <span className="font-medium">{currentPeriod()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Escaneos</span>
              <span className="font-medium">{stats.totalScans.toLocaleString()} unidades</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kg estimados</span>
              <span className="font-medium">{stats.totalKgTracked.toLocaleString()} kg</span>
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

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Trazabilidad reciente</h2>
          <button className="text-sm font-medium text-primary hover:underline">
            Ver todos
          </button>
        </div>
        <div className="space-y-3">
          {traceability.length > 0 ? traceability.map((event) => (
            <TraceabilityItem key={event.id} event={event} />
          )) : (
            <p className="text-sm text-muted-foreground">Aun no hay eventos de trazabilidad.</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-gradient-to-br from-green-50 to-green-100 p-6 dark:from-green-950/20 dark:to-green-900/20">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-white p-3 shadow-sm">
              <LeafIcon className="size-8 text-green-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-green-700 dark:text-green-400">{co2Reduced} kg</p>
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
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">{waterSaved.toLocaleString()} L</p>
              <p className="text-sm text-blue-600 dark:text-blue-500">Agua Ahorrada</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
