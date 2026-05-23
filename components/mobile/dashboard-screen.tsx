'use client';

/**
 * =====================================================
 * Dashboard Screen Component
 * Main home screen showing user stats, points, and summary
 * Features greeting, points display, and quick stats
 * =====================================================
 */

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { User, UserDashboardStats } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ScanIcon, 
  GiftIcon, 
  RecycleIcon, 
  StarIcon 
} from '@/components/icons';

// =====================================================
// PROPS INTERFACE
// =====================================================

interface DashboardScreenProps {
  /** Current user data */
  user: User | null;
  /** User statistics */
  stats: UserDashboardStats | null;
  /** Loading state */
  isLoading?: boolean;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get greeting based on current time
 * @returns Appropriate greeting string
 */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos dias';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

/**
 * Calculate points needed for next level
 * @param currentPoints - User's current points
 * @returns Points needed for next level
 */
function getNextLevelPoints(currentPoints: number): number {
  if (currentPoints < 500) return 500;
  if (currentPoints < 1500) return 1500;
  return 3000;
}

/**
 * Get user level based on points
 * @param points - User's points
 * @returns User level string
 */
function getUserLevel(points: number): string {
  if (points >= 1500) return 'Verde Embajador';
  if (points >= 500) return 'Verde Lider';
  return 'Verde Activo';
}

// =====================================================
// DASHBOARD SCREEN COMPONENT
// =====================================================

export function DashboardScreen({ user, stats, isLoading }: DashboardScreenProps) {
  // Calculate derived values
  const greeting = useMemo(() => getGreeting(), []);
  const userName = user?.firstName || 'Usuario';
  const greenPoints = stats?.greenPoints ?? user?.greenPoints ?? 0;
  const level = getUserLevel(greenPoints);
  const nextLevelPoints = getNextLevelPoints(greenPoints);
  const progressPercent = Math.min((greenPoints / nextLevelPoints) * 100, 100);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 pb-8 space-y-6 animate-fade-in">
      {/* Header Section */}
      <header className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">
            {greeting} <span className="text-lg">✨</span>
          </p>
          <h1 className="text-2xl font-bold text-foreground mt-1">
            {userName} {user?.lastName?.[0]}.
          </h1>
        </div>
        
        {/* User Avatar */}
        <div className="flex items-center justify-center w-12 h-12 bg-primary/20 rounded-full">
          <span className="text-lg font-bold text-primary">
            {userName[0]}{user?.lastName?.[0] || ''}
          </span>
        </div>
      </header>

      {/* Points Card */}
      <Card className="bg-primary text-primary-foreground overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col">
            {/* Points Display */}
            <div className="text-center">
              <p className="text-5xl font-bold">{greenPoints}</p>
              <p className="text-sm opacity-90 mt-1 uppercase tracking-wide">
                Puntos Verdes Disponibles
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-xs opacity-80 mb-2">
                <span>{level}</span>
                <span>{nextLevelPoints} → Siguiente nivel</span>
              </div>
              <div className="h-2 bg-primary-foreground/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-foreground rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Section */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4 uppercase tracking-wide">
          Resumen
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Total Scans Card */}
          <StatCard
            icon={<ScanIcon size={24} />}
            value={stats?.totalScans ?? user?.totalScans ?? 0}
            label="Escaneos totales"
            iconBgColor="bg-info/20"
            iconColor="text-info"
          />

          {/* Total Redemptions Card */}
          <StatCard
            icon={<GiftIcon size={24} />}
            value={stats?.totalRedemptions ?? user?.totalRedemptions ?? 0}
            label="Canjes realizados"
            iconBgColor="bg-warning/20"
            iconColor="text-warning"
          />

          {/* Kg Recycled Card */}
          <StatCard
            icon={<RecycleIcon size={24} />}
            value={`${(stats?.kgRecycled ?? user?.kgRecycled ?? 0).toFixed(1)} kg`}
            label="Plastico reciclado"
            iconBgColor="bg-success/20"
            iconColor="text-success"
          />

          {/* Level Card */}
          <StatCard
            icon={<StarIcon size={24} filled />}
            value={level.split(' ')[1]}
            label="Nivel actual"
            iconBgColor="bg-accent"
            iconColor="text-accent-foreground"
          />
        </div>
      </section>
    </div>
  );
}

// =====================================================
// STAT CARD COMPONENT
// =====================================================

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  iconBgColor: string;
  iconColor: string;
}

function StatCard({ icon, value, label, iconBgColor, iconColor }: StatCardProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 flex flex-col items-center text-center">
        <div className={cn(
          'flex items-center justify-center w-12 h-12 rounded-xl mb-3',
          iconBgColor, iconColor
        )}>
          {icon}
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}
