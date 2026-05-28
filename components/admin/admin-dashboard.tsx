/**
 * @fileoverview Admin Dashboard Component
 * Real-time overview of TraceQR platform metrics and activity
 * @module components/admin/admin-dashboard
 */

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  UsersIcon,
  PackageIcon,
  BuildingIcon,
  ChartIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertIcon,
  ArrowUpIcon,
} from "@/components/icons"
import { appEventEmitter, AppEventType } from "@/lib/events"
import type { AdminDashboardData } from "@/lib/dashboard-data"

interface StatCardProps {
  title: string
  value: string | number
  change?: string
  icon: React.ReactNode
  bgColor: string
  textColor: string
}

function StatCard({ title, value, change, icon, bgColor, textColor }: StatCardProps): JSX.Element {
  return (
    <div className={cn("rounded-xl p-5", bgColor)}>
      <div className="flex items-start justify-between">
        <div>
          <p className={cn("text-3xl font-bold", textColor)}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          <p className="mt-1 text-sm text-foreground/70">{title}</p>
          {change && (
            <p className="mt-2 flex items-center gap-1 text-xs text-green-600">
              <ArrowUpIcon className="size-3" />
              {change}
            </p>
          )}
        </div>
        <div className="rounded-lg bg-white/80 p-2">{icon}</div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: "valid" | "duplicate" | "invalid" }): JSX.Element {
  const config = {
    valid: { bg: "bg-green-100", text: "text-green-700", icon: <CheckCircleIcon className="size-3" />, label: "Valido" },
    duplicate: { bg: "bg-amber-100", text: "text-amber-700", icon: <AlertIcon className="size-3" />, label: "Duplicado" },
    invalid: { bg: "bg-red-100", text: "text-red-700", icon: <XCircleIcon className="size-3" />, label: "Rechazado" },
  }[status]

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", config.bg, config.text)}>
      {config.icon}
      {config.label}
    </span>
  )
}

function LevelBadge({ level }: { level: string }): JSX.Element {
  const colors: Record<string, string> = {
    Embajador: "bg-purple-100 text-purple-700",
    Lider: "bg-blue-100 text-blue-700",
    Activo: "bg-green-100 text-green-700",
  }

  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", colors[level] || "bg-muted text-muted-foreground")}>
      {level}
    </span>
  )
}

export function AdminDashboard({ data }: { data: AdminDashboardData }): JSX.Element {
  const router = useRouter()
  const { stats, recentScans, alerts, topUsers, companies } = data

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
        <h1 className="text-2xl font-bold text-foreground">Panel de control</h1>
        <p className="text-muted-foreground">Monitorea y gestiona el impacto global</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Usuarios Activos"
          value={stats.activeUsers}
          change={`+${stats.usersChange} esta semana`}
          icon={<UsersIcon className="size-6 text-pink-600" />}
          bgColor="bg-pink-100"
          textColor="text-pink-700"
        />
        <StatCard
          title="Escaneos hoy"
          value={stats.scansToday}
          change={`+${stats.scansChange}% vs. ayer`}
          icon={<PackageIcon className="size-6 text-amber-600" />}
          bgColor="bg-amber-100"
          textColor="text-amber-700"
        />
        <StatCard
          title="Empresas registradas"
          value={stats.registeredCompanies}
          change={`+${stats.companiesThisMonth} este mes`}
          icon={<BuildingIcon className="size-6 text-blue-600" />}
          bgColor="bg-blue-100"
          textColor="text-blue-700"
        />
        <StatCard
          title="Tasa cierre global"
          value={`${stats.globalClosureRate}%`}
          change={`+${stats.closureChange}pp`}
          icon={<ChartIcon className="size-6 text-green-600" />}
          bgColor="bg-green-100"
          textColor="text-green-700"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-semibold text-foreground">Escaneos recientes</h2>
            <button className="text-sm text-primary hover:underline">Ver todos</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Codigo QR</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Empresa</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Punto acopio</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                </tr>
              </thead>
              <tbody>
                {recentScans.length > 0 ? recentScans.map((scan) => (
                  <tr key={scan.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{scan.qrCode}</td>
                    <td className="px-4 py-3">{scan.company}</td>
                    <td className="px-4 py-3 text-muted-foreground">{scan.collectionPoint}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={scan.status} />
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td className="px-4 py-6 text-center text-muted-foreground" colSpan={4}>
                      Sin escaneos registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <h2 className="font-semibold text-foreground">Alertas del sistema</h2>
          </div>
          <div className="divide-y divide-border">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 px-4 py-3">
                <div className={cn(
                  "mt-0.5 size-2 rounded-full",
                  alert.type === "warning" && "bg-amber-500",
                  alert.type === "error" && "bg-red-500",
                  alert.type === "info" && "bg-green-500",
                )} />
                <p className="text-sm text-foreground">{alert.message}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-border p-4">
            <h3 className="mb-3 text-sm font-medium text-foreground">Acciones rapidas</h3>
            <div className="space-y-2">
              <button className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Generar reporte REP mensual
              </button>
              <button className="w-full rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
                Aprobar empresa pendiente
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-semibold text-foreground">Top usuarios</h2>
            <button className="text-sm text-primary hover:underline">Ver ranking completo</button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">#</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Usuario</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Escaneos</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Pts. totales</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Nivel</th>
              </tr>
            </thead>
            <tbody>
              {topUsers.length > 0 ? topUsers.map((user) => (
                <tr key={user.rank} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{user.rank}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.campus}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">{user.scans}</td>
                  <td className="px-4 py-3 text-right font-semibold text-primary">{user.points.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <LevelBadge level={user.level} />
                  </td>
                </tr>
              )) : (
                <tr>
                  <td className="px-4 py-6 text-center text-muted-foreground" colSpan={5}>
                    Sin usuarios para ranking
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-semibold text-foreground">Empresas registradas</h2>
            <button className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Aprobar nueva
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Empresa</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Prefijo</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">QR gen.</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody>
              {companies.length > 0 ? companies.map((company) => (
                <tr key={`${company.prefix}-${company.nit}`} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{company.name}</p>
                      <p className="text-xs text-muted-foreground">NIT {company.nit}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-primary">{company.prefix}</td>
                  <td className="px-4 py-3 text-right">{company.qrGenerated.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      company.status === "active" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700",
                    )}>
                      {company.status === "active" ? "Activo" : "Pendiente"}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td className="px-4 py-6 text-center text-muted-foreground" colSpan={4}>
                    Sin empresas registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
