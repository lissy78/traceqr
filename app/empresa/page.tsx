/**
 * @fileoverview Company Dashboard Page
 * Displays KPIs, monthly reports, and traceability summary for companies
 * @module app/empresa/page
 */

import { CompanyLayout } from "@/components/company/company-layout"
import { CompanyDashboard } from "@/components/company/company-dashboard"
import { getCompanyDashboardData } from "@/lib/dashboard-data"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

/**
 * CompanyDashboardPage - Main dashboard for company portal
 * Shows KPIs, REP compliance metrics, and recent traceability
 * @returns {JSX.Element} Company dashboard page
 */
export default async function CompanyDashboardPage(): Promise<JSX.Element> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "company" && profile?.role !== "admin") {
    redirect("/admin/login")
  }

  const dashboardData = await getCompanyDashboardData(
    supabase,
    user.id,
    profile?.role === "admin",
  )

  if (!dashboardData) {
    redirect("/admin/login")
  }

  return (
    <CompanyLayout
      companyName={dashboardData.companyName}
      companyPrefix={dashboardData.companyPrefix}
    >
      <CompanyDashboard data={dashboardData} />
    </CompanyLayout>
  )
}
