'use client';

/**
 * =====================================================
 * Login Screen Component
 * Authentication screen with email/password and Google OAuth
 * Features form validation and loading states
 * =====================================================
 */

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { eventBus } from '@/lib/events';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// =====================================================
// PROPS INTERFACE
// =====================================================

interface LoginScreenProps {
  /** Callback when login is successful */
  onLoginSuccess: () => void;
  /** Callback to navigate to registration */
  onRegister: () => void;
  /** Callback to navigate to forgot password */
  onForgotPassword: () => void;
}

// =====================================================
// LOGIN SCREEN COMPONENT
// =====================================================

export function LoginScreen({
  onLoginSuccess,
  onRegister,
  onForgotPassword,
}: LoginScreenProps) {
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle email/password login
   * Validates form and authenticates with Supabase
   */
  const handleEmailLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError('Credenciales incorrectas. Por favor intenta de nuevo.');
        return;
      }

      if (data.user) {
        // Emit login event for other components to react
        eventBus.emit('auth:login', { 
          user: {
            id: data.user.id,
            email: data.user.email || '',
            firstName: data.user.user_metadata?.first_name || null,
            lastName: data.user.user_metadata?.last_name || null,
            studentCode: null,
            academicProgram: null,
            campus: 'Univalle Seccional Yumbo',
            greenPoints: 0,
            level: 'Verde Activo',
            totalScans: 0,
            totalRedemptions: 0,
            kgRecycled: 0,
            role: 'student',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        });
        
        // Show success toast
        eventBus.emit('ui:toast', {
          message: 'Bienvenido de vuelta',
          type: 'success',
        });
        
        onLoginSuccess();
      }
    } catch (err) {
      setError('Error al conectar. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }, [email, password, onLoginSuccess]);

  /**
   * Handle Google OAuth login
   */
  const handleGoogleLogin = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
            `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        setError('Error al conectar con Google. Por favor intenta de nuevo.');
      }
    } catch (err) {
      setError('Error al conectar. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background p-6 safe-top safe-bottom">
      {/* Header */}
      <div className="pt-8 pb-6">
        <h1 className="text-3xl font-bold text-foreground">
          Bienvenida <span className="text-2xl">&#128075;</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Inicia sesion en tu cuenta
        </p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleEmailLogin} className="flex-1 flex flex-col">
        <div className="space-y-6">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Correo electronico
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="lisa@univalle.edu.co"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="h-12 bg-muted border-0 rounded-xl"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              Contrasena
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="h-12 bg-muted border-0 rounded-xl"
            />
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-sm text-primary hover:underline"
            >
              ¿Olvidaste tu contrasena?
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
          >
            {isLoading ? 'Iniciando sesion...' : 'Iniciar sesion'}
          </Button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-border" />
          <span className="text-sm text-muted-foreground">o continua con</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Google OAuth Button */}
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full h-14 text-lg font-medium rounded-xl border-2"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continuar con Google
        </Button>

        {/* Register Link */}
        <div className="mt-auto pt-8 text-center">
          <p className="text-muted-foreground">
            ¿No tienes cuenta?{' '}
            <button
              type="button"
              onClick={onRegister}
              className="text-primary font-semibold hover:underline"
            >
              Registrate aqui
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
