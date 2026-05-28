/**
 * @fileoverview Admin Dashboard Page
 * Main entry point for admin panel dashboard
 * @module app/admin/page
 */

import { AdminLayout } from "@/components/admin/admin-layout"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { getAdminDashboardData } from "@/lib/dashboard-data"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

/**
 * AdminDashboardPage - Main dashboard for admin panel
 * Displays real-time metrics, scans, alerts, and management tools
 * @returns {JSX.Element} Admin dashboard page
 */
export default async function AdminDashboardPage(): Promise<JSX.Element> {
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

  if (profile?.role !== "admin") {
    redirect("/admin/login")
  }

  const dashboardData = await getAdminDashboardData(supabase)

  return (
    <AdminLayout>
      <AdminDashboard data={dashboardData} />
    </AdminLayout>
  )
}
