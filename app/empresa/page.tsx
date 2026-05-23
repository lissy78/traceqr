/**
 * @fileoverview Company Dashboard Page
 * Displays KPIs, monthly reports, and traceability summary for companies
 * @module app/empresa/page
 */

import { CompanyLayout } from "@/components/company/company-layout"
import { CompanyDashboard } from "@/components/company/company-dashboard"

/**
 * CompanyDashboardPage - Main dashboard for company portal
 * Shows KPIs, REP compliance metrics, and recent traceability
 * @returns {JSX.Element} Company dashboard page
 */
export default function CompanyDashboardPage(): JSX.Element {
  return (
    <CompanyLayout>
      <CompanyDashboard />
    </CompanyLayout>
  )
}
