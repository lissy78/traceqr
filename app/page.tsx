/**
 * @fileoverview Main entry page for TraceQR PWA
 * Renders the mobile app interface for recycling traceability
 * @module app/page
 */

import { MobileApp } from "@/components/mobile/mobile-app"

/**
 * HomePage component - Entry point for TraceQR mobile PWA
 * Renders the main mobile application with all screens
 * @returns {JSX.Element} The mobile app component
 */
export default function HomePage(): JSX.Element {
  return <MobileApp />
}
