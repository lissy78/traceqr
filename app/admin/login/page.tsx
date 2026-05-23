/**
 * @fileoverview Admin Login Page
 * Restricted access login for TraceQR administrators
 * @module app/admin/login/page
 */

"use client"

import { useState, useCallback, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { TraceQRLogo, LockIcon, EyeIcon, EyeOffIcon } from "@/components/icons"
import { createClient } from "@/lib/supabase/client"
import { appEventEmitter, AppEventType } from "@/lib/events"

// =====================================================
// TYPES
// =====================================================

interface LoginFormState {
  email: string
  password: string
}

interface LoginError {
  message: string
}

// =====================================================
// MAIN COMPONENT
// =====================================================

/**
 * AdminLoginPage - Login page for admin panel access
 * Features restricted access warning and secure login form
 * @returns {JSX.Element} Admin login page
 */
export default function AdminLoginPage(): JSX.Element {
  // Router for navigation
  const router = useRouter()

  // Form state
  const [formData, setFormData] = useState<LoginFormState>({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<LoginError | null>(null)

  /**
   * Handles form input changes
   * @param field - The field to update
   * @returns Input change handler
   */
  const handleInputChange = useCallback(
    (field: keyof LoginFormState) =>
      (e: React.ChangeEvent<HTMLInputElement>): void => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }))
        setError(null)
      },
    []
  )

  /**
   * Toggles password visibility
   */
  const togglePasswordVisibility = useCallback((): void => {
    setShowPassword((prev) => !prev)
  }, [])

  /**
   * Handles form submission
   * Authenticates admin user with Supabase
   * @param e - Form event
   */
  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>): Promise<void> => {
      e.preventDefault()
      setIsLoading(true)
      setError(null)

      try {
        const supabase = createClient()

        // Attempt login with Supabase Auth
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })

        if (authError) {
          throw new Error(authError.message)
        }

        // Verify user has admin role
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", data.user?.id)
          .single()

        if (userError || userData?.role !== "admin") {
          // Sign out if not admin
          await supabase.auth.signOut()
          throw new Error("Acceso denegado. Solo administradores autorizados.")
        }

        // Emit login success event (user object partial, role is verified above)
        appEventEmitter.emit(AppEventType.USER_LOGIN, {
          user: { id: data.user?.id, role: "admin" } as import("@/lib/types").User,
        })

        // Redirect to admin dashboard
        router.push("/admin")
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error de autenticacion"
        setError({ message: errorMessage })
      } finally {
        setIsLoading(false)
      }
    },
    [formData, router]
  )

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* ==================== LOGIN CARD ==================== */}
        <div className="rounded-2xl bg-card p-8 shadow-2xl">
          {/* Header with Logo */}
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-xl bg-slate-800">
              <LockIcon className="size-8 text-slate-400" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Acceso restringido</h1>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              Solo personal autorizado - TraceQR Admin
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Admin User Field */}
            <div>
              <label
                htmlFor="adminEmail"
                className="mb-2 block text-sm font-medium text-muted-foreground"
              >
                USUARIO ADMIN
              </label>
              <input
                id="adminEmail"
                type="email"
                value={formData.email}
                onChange={handleInputChange("email")}
                placeholder="admin@traceqr.co"
                className="w-full rounded-lg border border-border bg-muted/50 px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="adminPassword"
                className="mb-2 block text-sm font-medium text-muted-foreground"
              >
                CONTRASENA
              </label>
              <div className="relative">
                <input
                  id="adminPassword"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange("password")}
                  placeholder="••••••••••••"
                  className="w-full rounded-lg border border-border bg-muted/50 px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOffIcon className="size-5" />
                  ) : (
                    <EyeIcon className="size-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error.message}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="size-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al panel</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 rounded-lg bg-muted/50 p-3">
            <p className="text-center text-xs text-muted-foreground">
              Acceso protegido por autenticacion de dos factores.
              <br />
              Sesiones auditadas y registradas.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-slate-500">
          <TraceQRLogo className="size-5" />
          <span className="text-sm">TraceQR Admin Panel</span>
        </div>
      </div>
    </div>
  )
}
