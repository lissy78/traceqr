/**
 * @fileoverview Admin Dashboard Page
 * Main entry point for admin panel dashboard
 * @module app/admin/page
 */

import { AdminLayout } from "@/components/admin/admin-layout"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

/**
 * AdminDashboardPage - Main dashboard for admin panel
 * Displays real-time metrics, scans, alerts, and management tools
 * @returns {JSX.Element} Admin dashboard page
 */
export default function AdminDashboardPage(): JSX.Element {
  return (
    <AdminLayout>
      <AdminDashboard />
    </AdminLayout>
  )
}
