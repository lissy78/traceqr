import type { SupabaseClient } from "@supabase/supabase-js"
import type { AdminStats, CompanyStats, PlasticType, TraceabilityEvent } from "@/lib/types"

export interface AdminRecentScan {
  id: string
  qrCode: string
  company: string
  collectionPoint: string
  status: "valid" | "duplicate" | "invalid"
}

export interface AdminAlert {
  id: string
  type: "warning" | "error" | "info"
  message: string
}

export interface AdminTopUser {
  rank: number
  name: string
  campus: string
  scans: number
  points: number
  level: string
}

export interface AdminCompanyRow {
  name: string
  prefix: string
  nit: string
  qrGenerated: number
  status: "active" | "pending"
}

export interface AdminDashboardData {
  stats: AdminStats
  recentScans: AdminRecentScan[]
  alerts: AdminAlert[]
  topUsers: AdminTopUser[]
  companies: AdminCompanyRow[]
}

export interface CompanyDashboardData {
  companyName: string
  companyPrefix: string
  stats: CompanyStats
  plasticBreakdown: Array<{ type: PlasticType; count: number; percentage: number }>
  traceability: TraceabilityEvent[]
}

const EMPTY_ADMIN_STATS: AdminStats = {
  activeUsers: 0,
  usersChange: 0,
  scansToday: 0,
  scansChange: 0,
  registeredCompanies: 0,
  companiesThisMonth: 0,
  globalClosureRate: 0,
  closureChange: 0,
}

const EMPTY_COMPANY_STATS: CompanyStats = {
  totalScans: 0,
  totalKgTracked: 0,
  closureRate: 0,
  qrGenerated: 0,
  scansChange: 0,
  kgChange: 0,
  closureChange: 0,
}

function startOfDay(offsetDays = 0): string {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
}

function startOfMonth(): string {
  const date = new Date()
  date.setDate(1)
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
}

function maskName(firstName?: string | null, lastName?: string | null, email?: string | null): string {
  const base = `${firstName ?? ""}${lastName ?? ""}`.trim() || email || "Usuario"
  return `${base.slice(0, 2).toUpperCase()}***${base.slice(-2).toUpperCase()}`
}

function normalizeLevel(level?: string | null): string {
  if (!level) return "Activo"
  return level.replace("Verde ", "")
}

function scanStatus(status?: string | null): AdminRecentScan["status"] {
  if (!status || status === "active" || status === "scanned" || status === "collected" || status === "recycled") {
    return "valid"
  }
  if (status === "invalid") return "invalid"
  return "duplicate"
}

function traceEvent(status?: string | null): TraceabilityEvent["event"] {
  if (status === "collected" || status === "recycled" || status === "invalid") return status
  return "scanned"
}

export async function getAdminDashboardData(supabase: SupabaseClient): Promise<AdminDashboardData> {
  const today = startOfDay()
  const yesterday = startOfDay(-1)
  const month = startOfMonth()

  const [
    usersResult,
    newUsersResult,
    scansTodayResult,
    scansYesterdayResult,
    companiesResult,
    companiesThisMonthResult,
    qrTotalResult,
    qrRecycledResult,
    recentScansResult,
    topUsersResult,
    companyRowsResult,
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("users").select("*", { count: "exact", head: true }).gte("created_at", startOfDay(-7)),
    supabase.from("scans").select("*", { count: "exact", head: true }).gte("scanned_at", today),
    supabase.from("scans").select("*", { count: "exact", head: true }).gte("scanned_at", yesterday).lt("scanned_at", today),
    supabase.from("companies").select("*", { count: "exact", head: true }),
    supabase.from("companies").select("*", { count: "exact", head: true }).gte("created_at", month),
    supabase.from("qr_codes").select("*", { count: "exact", head: true }),
    supabase.from("qr_codes").select("*", { count: "exact", head: true }).eq("status", "recycled"),
    supabase
      .from("scans")
      .select(`
        id,
        collection_point,
        scanned_at,
        qr_code:qr_code_id (
          code,
          status,
          product:product_id (
            company:company_id (business_name)
          )
        )
      `)
      .order("scanned_at", { ascending: false })
      .limit(5),
    supabase
      .from("users")
      .select("id,email,first_name,last_name,campus,total_scans,green_points,level")
      .eq("role", "student")
      .order("green_points", { ascending: false })
      .limit(5),
    supabase
      .from("companies")
      .select("business_name,nit,dv,prefix,status,total_qr_generated,created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ])

  const scansToday = scansTodayResult.count ?? 0
  const scansYesterday = scansYesterdayResult.count ?? 0
  const totalQr = qrTotalResult.count ?? 0
  const recycledQr = qrRecycledResult.count ?? 0
  const globalClosureRate = totalQr > 0 ? Number(((recycledQr / totalQr) * 100).toFixed(1)) : 0
  const scansChange = scansYesterday > 0 ? Math.round(((scansToday - scansYesterday) / scansYesterday) * 100) : scansToday

  const recentScans = (recentScansResult.data ?? []).map((scan) => {
    const qrCode = Array.isArray(scan.qr_code) ? scan.qr_code[0] : scan.qr_code
    const product = Array.isArray(qrCode?.product) ? qrCode.product[0] : qrCode?.product
    const company = Array.isArray(product?.company) ? product.company[0] : product?.company

    return {
      id: scan.id,
      qrCode: qrCode?.code ?? "QR desconocido",
      company: company?.business_name ?? "Empresa",
      collectionPoint: scan.collection_point ?? "Sin punto",
      status: scanStatus(qrCode?.status),
    }
  })

  const alerts: AdminAlert[] = [
    {
      id: "scans-today",
      type: scansToday > 0 ? "info" : "warning",
      message: scansToday > 0 ? `${scansToday} escaneos registrados hoy` : "Aun no hay escaneos registrados hoy",
    },
    {
      id: "companies-month",
      type: (companiesThisMonthResult.count ?? 0) > 0 ? "info" : "warning",
      message: `${companiesThisMonthResult.count ?? 0} empresas nuevas este mes`,
    },
  ]

  const topUsers = (topUsersResult.data ?? []).map((user, index) => ({
    rank: index + 1,
    name: maskName(user.first_name, user.last_name, user.email),
    campus: user.campus ?? "Sin sede",
    scans: user.total_scans ?? 0,
    points: user.green_points ?? 0,
    level: normalizeLevel(user.level),
  }))

  const companies = (companyRowsResult.data ?? []).map((company) => ({
    name: company.business_name ?? "Empresa",
    prefix: company.prefix ?? "-",
    nit: `${company.nit ?? "-"}${company.dv ? `-${company.dv}` : ""}`,
    qrGenerated: company.total_qr_generated ?? 0,
    status: company.status === "active" ? "active" as const : "pending" as const,
  }))

  return {
    stats: {
      ...EMPTY_ADMIN_STATS,
      activeUsers: usersResult.count ?? 0,
      usersChange: newUsersResult.count ?? 0,
      scansToday,
      scansChange,
      registeredCompanies: companiesResult.count ?? 0,
      companiesThisMonth: companiesThisMonthResult.count ?? 0,
      globalClosureRate,
      closureChange: globalClosureRate,
    },
    recentScans,
    alerts,
    topUsers,
    companies,
  }
}

export async function getCompanyDashboardData(
  supabase: SupabaseClient,
  userId: string,
  allowAdminFallback = false,
): Promise<CompanyDashboardData | null> {
  let companyQuery = supabase
    .from("companies")
    .select("id,business_name,prefix,total_qr_generated,kg_tracked,closure_rate,user_id")
    .eq("user_id", userId)
    .maybeSingle()

  let { data: company } = await companyQuery

  if (!company && allowAdminFallback) {
    const fallback = await supabase
      .from("companies")
      .select("id,business_name,prefix,total_qr_generated,kg_tracked,closure_rate,user_id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle()
    company = fallback.data
  }

  if (!company) return null

  const { data: products } = await supabase
    .from("products")
    .select("id,plastic_type,weight_g,qr_count")
    .eq("company_id", company.id)

  const productIds = (products ?? []).map((product) => product.id)

  if (productIds.length === 0) {
    return {
      companyName: company.business_name ?? "Empresa",
      companyPrefix: company.prefix ?? "-",
      stats: {
        ...EMPTY_COMPANY_STATS,
        qrGenerated: company.total_qr_generated ?? 0,
        totalKgTracked: company.kg_tracked ?? 0,
        closureRate: company.closure_rate ?? 0,
      },
      plasticBreakdown: [],
      traceability: [],
    }
  }

  const { data: qrCodes } = await supabase
    .from("qr_codes")
    .select("id,code,status,product_id,scanned_at,collected_at,recycled_at")
    .in("product_id", productIds)

  const qrIds = (qrCodes ?? []).map((qr) => qr.id)
  const productById = new Map((products ?? []).map((product) => [product.id, product]))
  const qrById = new Map((qrCodes ?? []).map((qr) => [qr.id, qr]))

  const { data: scans } = qrIds.length
    ? await supabase
        .from("scans")
        .select("id,qr_code_id,collection_point,points_earned,scanned_at")
        .in("qr_code_id", qrIds)
        .order("scanned_at", { ascending: false })
        .limit(10)
    : { data: [] }

  const scannedQr = (qrCodes ?? []).filter((qr) => qr.status !== "active")
  const recycledQr = (qrCodes ?? []).filter((qr) => qr.status === "recycled")
  const totalKgTracked = scannedQr.reduce((total, qr) => {
    const product = productById.get(qr.product_id)
    return total + ((product?.weight_g ?? 0) / 1000)
  }, 0)
  const qrGenerated = company.total_qr_generated ?? (qrCodes?.length ?? 0)
  const closureRate = qrCodes?.length ? Number(((recycledQr.length / qrCodes.length) * 100).toFixed(1)) : 0

  const breakdownCounts = new Map<PlasticType, number>()
  scannedQr.forEach((qr) => {
    const product = productById.get(qr.product_id)
    const type = product?.plastic_type as PlasticType | undefined
    if (type) breakdownCounts.set(type, (breakdownCounts.get(type) ?? 0) + 1)
  })

  const maxBreakdown = Math.max(...Array.from(breakdownCounts.values()), 1)
  const plasticBreakdown = Array.from(breakdownCounts.entries()).map(([type, count]) => ({
    type,
    count,
    percentage: Math.round((count / maxBreakdown) * 100),
  }))

  const traceability = (scans ?? []).map((scan) => {
    const qr = qrById.get(scan.qr_code_id)
    return {
      id: scan.id,
      qrCode: qr?.code ?? "QR",
      event: traceEvent(qr?.status),
      location: scan.collection_point ?? "Punto de acopio",
      timestamp: scan.scanned_at,
    }
  })

  return {
    companyName: company.business_name ?? "Empresa",
    companyPrefix: company.prefix ?? "-",
    stats: {
      ...EMPTY_COMPANY_STATS,
      totalScans: scans?.length ?? 0,
      totalKgTracked: Number(totalKgTracked.toFixed(2)),
      closureRate: company.closure_rate ?? closureRate,
      qrGenerated,
      scansChange: scans?.length ?? 0,
      kgChange: Number(totalKgTracked.toFixed(2)),
      closureChange: company.closure_rate ?? closureRate,
    },
    plasticBreakdown,
    traceability,
  }
}
