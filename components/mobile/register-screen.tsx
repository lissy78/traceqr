'use client';

/**
 * =====================================================
 * Student Registration Screen Component
 * Multi-step registration form for new student accounts
 * Features form validation and step navigation
 * =====================================================
 */

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { eventBus } from '@/lib/events';
import type { StudentRegistrationData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeftIcon, ArrowRightIcon } from '@/components/icons';

// =====================================================
// PROPS INTERFACE
// =====================================================

interface RegisterScreenProps {
  /** Callback when registration is successful */
  onRegisterSuccess: () => void;
  /** Callback to go back to login */
  onBack: () => void;
}

// =====================================================
// CONSTANTS
// =====================================================

const ACADEMIC_PROGRAMS = [
  'Tecnologia en Desarrollo de Software',
  'Tecnologia en Sistemas',
  'Tecnologia en Electronica',
  'Tecnologia Ambiental',
  'Administracion de Empresas',
  'Contaduria Publica',
  'Ingenieria Industrial',
];

const CAMPUSES = [
  'Univalle Seccional Yumbo',
  'Univalle Cali',
  'Univalle Buga',
  'Univalle Palmira',
];

// =====================================================
// REGISTER SCREEN COMPONENT
// =====================================================

export function RegisterScreen({ onRegisterSuccess, onBack }: RegisterScreenProps) {
  // Current step (1: Personal data, 2: Access and privacy)
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<StudentRegistrationData>>({
    firstName: '',
    lastName: '',
    email: '',
    studentCode: '',
    academicProgram: '',
    campus: CAMPUSES[0],
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    allowGps: false,
  });

  /**
   * Update form field
   */
  const updateField = useCallback(<K extends keyof StudentRegistrationData>(
    field: K,
    value: StudentRegistrationData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  /**
   * Validate step 1 fields
   */
  const validateStep1 = useCallback((): boolean => {
    if (!formData.firstName?.trim()) {
      setError('El nombre es requerido');
      return false;
    }
    if (!formData.lastName?.trim()) {
      setError('El apellido es requerido');
      return false;
    }
    if (!formData.email?.includes('@') || !formData.email?.includes('.edu.co')) {
      setError('Debe ser un correo universitario oficial (.edu.co)');
      return false;
    }
    if (!formData.studentCode?.trim()) {
      setError('El codigo estudiantil es requerido');
      return false;
    }
    if (!formData.academicProgram) {
      setError('Selecciona un programa academico');
      return false;
    }
    return true;
  }, [formData]);

  /**
   * Validate step 2 fields
   */
  const validateStep2 = useCallback((): boolean => {
    if (!formData.password || formData.password.length < 8) {
      setError('La contrasena debe tener minimo 8 caracteres');
      return false;
    }
    if (!/[A-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      setError('La contrasena debe tener una mayuscula y un numero');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Las contrasenas no coinciden');
      return false;
    }
    if (!formData.acceptTerms) {
      setError('Debes aceptar los terminos de uso');
      return false;
    }
    return true;
  }, [formData]);

  /**
   * Handle next step
   */
  const handleNextStep = useCallback(() => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  }, [currentStep, validateStep1]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep2()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email!,
        password: formData.password!,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
            `${window.location.origin}/auth/callback`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            student_code: formData.studentCode,
            academic_program: formData.academicProgram,
            campus: formData.campus,
            role: 'student',
          },
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('Este correo ya esta registrado');
        } else {
          setError('Error al crear la cuenta. Intenta de nuevo.');
        }
        return;
      }

      eventBus.emit('ui:toast', {
        message: '¡Cuenta creada! Revisa tu correo para confirmar.',
        type: 'success',
        duration: 5000,
      });

      onRegisterSuccess();
    } catch (err) {
      setError('Error al conectar. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateStep2, onRegisterSuccess]);

  return (
    <div className="flex flex-col min-h-screen bg-background p-6 safe-top safe-bottom">
      {/* Header */}
      <header className="flex items-center justify-between py-4">
        <button
          onClick={currentStep === 1 ? onBack : () => setCurrentStep(1)}
          className="flex items-center text-primary font-medium"
        >
          <ArrowLeftIcon size={20} className="mr-1" />
          {currentStep === 1 ? 'Atras' : 'Atras'}
        </button>
        
        <span className="text-sm text-primary font-semibold uppercase tracking-wider">
          Nueva Cuenta · Estudiante
        </span>
      </header>

      {/* Step indicator */}
      <div className="py-4">
        <p className="text-sm text-muted-foreground">
          Paso {currentStep} de 3 — {currentStep === 1 ? 'Datos personales' : 'Acceso y privacidad'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        {currentStep === 1 ? (
          // Step 1: Personal Data
          <div className="space-y-5">
            {/* Name fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  placeholder="Lisa Maria"
                  value={formData.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  className="h-12 bg-muted border-0 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  placeholder="Meneses Garcia"
                  value={formData.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  className="h-12 bg-muted border-0 rounded-xl"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Correo institucional</Label>
              <Input
                id="email"
                type="email"
                placeholder="lisa@correounivalle.edu.co"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="h-12 bg-muted border-0 rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                Debe ser correo universitario oficial
              </p>
            </div>

            {/* Student code */}
            <div className="space-y-2">
              <Label htmlFor="studentCode">Codigo estudiantil</Label>
              <Input
                id="studentCode"
                placeholder="2180123"
                value={formData.studentCode}
                onChange={(e) => updateField('studentCode', e.target.value)}
                className="h-12 bg-muted border-0 rounded-xl"
              />
            </div>

            {/* Academic program */}
            <div className="space-y-2">
              <Label htmlFor="academicProgram">Programa academico</Label>
              <Select
                value={formData.academicProgram}
                onValueChange={(value) => updateField('academicProgram', value)}
              >
                <SelectTrigger className="h-12 bg-muted border-0 rounded-xl">
                  <SelectValue placeholder="Selecciona tu programa" />
                </SelectTrigger>
                <SelectContent>
                  {ACADEMIC_PROGRAMS.map((program) => (
                    <SelectItem key={program} value={program}>
                      {program}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Campus */}
            <div className="space-y-2">
              <Label htmlFor="campus">Sede</Label>
              <Select
                value={formData.campus}
                onValueChange={(value) => updateField('campus', value)}
              >
                <SelectTrigger className="h-12 bg-muted border-0 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CAMPUSES.map((campus) => (
                    <SelectItem key={campus} value={campus}>
                      {campus}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          // Step 2: Access and Privacy
          <div className="space-y-5">
            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Contrasena</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                className="h-12 bg-muted border-0 rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                Minimo 8 caracteres, una mayuscula y un numero
              </p>
            </div>

            {/* Confirm password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contrasena</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                className={cn(
                  'h-12 bg-muted border-0 rounded-xl',
                  formData.confirmPassword && formData.password !== formData.confirmPassword
                    && 'border-2 border-destructive'
                )}
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-destructive">Las contrasenas no coinciden</p>
              )}
            </div>

            {/* Privacy notice */}
            <div className="p-4 bg-success/10 rounded-xl space-y-2">
              <h3 className="font-semibold text-foreground">Tus datos estan protegidos</h3>
              <p className="text-sm text-muted-foreground">
                Tu correo no se comparte. Los escaneos se anonimizan en reportes. 
                Solo ves tus propios puntos y trazabilidad.
              </p>
            </div>

            {/* Terms checkbox */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="acceptTerms"
                checked={formData.acceptTerms}
                onCheckedChange={(checked) => updateField('acceptTerms', checked as boolean)}
              />
              <label htmlFor="acceptTerms" className="text-sm text-muted-foreground cursor-pointer">
                Acepto los{' '}
                <span className="text-primary underline">terminos de uso</span>
                {' '}y la{' '}
                <span className="text-primary underline">politica de privacidad</span>
                {' '}de TraceQR · Semillero RREDSI
              </label>
            </div>

            {/* GPS permission checkbox */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="allowGps"
                checked={formData.allowGps}
                onCheckedChange={(checked) => updateField('allowGps', checked as boolean)}
              />
              <label htmlFor="allowGps" className="text-sm text-muted-foreground cursor-pointer">
                Autorizo el uso de mi ubicacion GPS para registrar el punto de acopio (opcional)
              </label>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-auto pt-8 space-y-3">
          {currentStep === 1 ? (
            <Button
              type="button"
              onClick={handleNextStep}
              className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
            >
              Continuar
              <ArrowRightIcon size={20} className="ml-2" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
            >
              {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
