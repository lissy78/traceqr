"use client"

import { useState, useCallback, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface LoginFormState {
  email: string
  password: string
}

export default function AdminLoginPage(): JSX.Element {
  const router = useRouter()

  const [formData, setFormData] = useState<LoginFormState>({
    email: "",
    password: "",
  })

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleInputChange = useCallback(
    (field: keyof LoginFormState) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({
          ...prev,
          [field]: e.target.value,
        }))
        setError("")
      },
    []
  )

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const supabase = createClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) throw error

      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single()

      if (userData?.role !== "admin") {
        await supabase.auth.signOut()
        throw new Error("Acceso restringido")
      }

      router.push("/admin")
    } catch (err: any) {
      setError(err.message || "Error de autenticación")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-6 relative overflow-hidden">
      
      {/* Fondo decorativo */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.15),transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(99,102,241,0.12),transparent_35%)]" />

      <section className="relative w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl p-8">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-400/20">
              <ShieldCheck className="h-10 w-10 text-cyan-400" />
            </div>

            <h1 className="text-3xl font-bold text-white">
              TraceQR Admin
            </h1>

            <p className="text-slate-400 mt-2 text-sm">
              Acceso seguro al panel administrativo
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Correo administrativo
              </label>

              <input
                type="email"
                value={formData.email}
                onChange={handleInputChange("email")}
                placeholder="admin@traceqr.co"
                className="w-full rounded-xl bg-slate-900/70 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Contraseña
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange("password")}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-slate-900/70 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-slate-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold py-3 transition-all disabled:opacity-50"
            >
              {isLoading ? "Verificando..." : "Ingresar al panel"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-slate-500">
            Seguridad empresarial • Sesiones auditadas
          </div>
        </div>
      </section>
    </main>
  )
}
