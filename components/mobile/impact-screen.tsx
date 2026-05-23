'use client';

/**
 * =====================================================
 * Impact Screen Component
 * Shows user's environmental impact metrics
 * Features plastic breakdown, traceability, and stats
 * =====================================================
 */

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { User, ScanWithDetails, PlasticType } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { 
  LeafIcon, 
  RecycleIcon, 
  WaterIcon, 
  Co2Icon,
  PackageIcon,
} from '@/components/icons';

// =====================================================
// PROPS INTERFACE
// =====================================================

interface ImpactScreenProps {
  /** Current user data */
  user: User | null;
  /** Recent scans for traceability */
  recentScans: ScanWithDetails[];
  /** Plastic breakdown by type */
  plasticBreakdown: Record<PlasticType, number>;
  /** Loading state */
  isLoading?: boolean;
}

// =====================================================
// ENVIRONMENTAL CALCULATIONS
// Average values for impact calculations
// =====================================================

const IMPACT_FACTORS = {
  /** kg CO2 saved per kg of PET recycled */
  co2PerKg: 1.5,
  /** Liters of water saved per kg of plastic recycled */
  waterPerKg: 400,
};

// =====================================================
// IMPACT SCREEN COMPONENT
// =====================================================

export function ImpactScreen({
  user,
  recentScans,
  plasticBreakdown,
  isLoading,
}: ImpactScreenProps) {
  // Calculate environmental impact
  const impact = useMemo(() => {
    const totalKg = user?.kgRecycled ?? 0;
    return {
      containers: user?.totalScans ?? 0,
      co2Avoided: (totalKg * IMPACT_FACTORS.co2PerKg).toFixed(1),
      waterSaved: Math.round(totalKg * IMPACT_FACTORS.waterPerKg),
    };
  }, [user]);

  // Calculate plastic breakdown percentages
  const plasticStats = useMemo(() => {
    const total = Object.values(plasticBreakdown).reduce((a, b) => a + b, 0);
    return Object.entries(plasticBreakdown)
      .filter(([, count]) => count > 0)
      .map(([type, count]) => ({
        type: type as PlasticType,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [plasticBreakdown]);

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
      {/* Header */}
      <header className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-success/20 rounded-xl">
          <LeafIcon size={24} className="text-success" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mi Impacto</h1>
          <p className="text-sm text-muted-foreground">
            Tu huella verde en Yumbo
          </p>
        </div>
      </header>

      {/* Impact Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <ImpactCard
          value={impact.containers}
          label="Envases rastreados"
          icon={<PackageIcon size={20} />}
          color="text-info"
          bgColor="bg-info/10"
        />
        <ImpactCard
          value={`${impact.co2Avoided}`}
          sublabel="kg CO₂"
          label="evitado"
          icon={<Co2Icon size={20} />}
          color="text-warning"
          bgColor="bg-warning/10"
        />
        <ImpactCard
          value={impact.waterSaved}
          sublabel="L"
          label="agua protegidos"
          icon={<WaterIcon size={20} />}
          color="text-primary"
          bgColor="bg-primary/10"
        />
      </div>

      {/* Plastic Breakdown Section */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          Por Tipo de Plastico
        </h2>
        
        <Card>
          <CardContent className="p-4 space-y-4">
            {plasticStats.length > 0 ? (
              plasticStats.map(({ type, count, percentage }) => (
                <PlasticBar
                  key={type}
                  type={type}
                  count={count}
                  percentage={percentage}
                />
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Aun no has escaneado envases
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Recent Traceability Section */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          Trazabilidad Reciente
        </h2>
        
        {recentScans.length > 0 ? (
          <div className="space-y-3">
            {recentScans.slice(0, 5).map((scan) => (
              <TraceabilityItem key={scan.id} scan={scan} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center">
              <RecycleIcon size={32} className="mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                Escanea tu primer envase para ver la trazabilidad
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

// =====================================================
// IMPACT CARD COMPONENT
// =====================================================

interface ImpactCardProps {
  value: string | number;
  sublabel?: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

function ImpactCard({ value, sublabel, label, icon, color, bgColor }: ImpactCardProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-3 flex flex-col items-center text-center">
        <div className={cn(
          'flex items-center justify-center w-10 h-10 rounded-xl mb-2',
          bgColor, color
        )}>
          {icon}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-foreground">{value}</span>
          {sublabel && (
            <span className="text-xs text-muted-foreground">{sublabel}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{label}</p>
      </CardContent>
    </Card>
  );
}

// =====================================================
// PLASTIC BAR COMPONENT
// =====================================================

interface PlasticBarProps {
  type: PlasticType;
  count: number;
  percentage: number;
}

const PLASTIC_COLORS: Record<PlasticType, string> = {
  PET: 'bg-success',
  HDPE: 'bg-info',
  PP: 'bg-warning',
  LDPE: 'bg-accent',
  PS: 'bg-destructive',
  OTHER: 'bg-muted-foreground',
};

function PlasticBar({ type, count, percentage }: PlasticBarProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-12 text-xs font-medium text-muted-foreground">{type}</span>
      <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn('h-full rounded-full transition-all duration-500', PLASTIC_COLORS[type])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-8 text-sm font-semibold text-foreground text-right">{count}</span>
    </div>
  );
}

// =====================================================
// TRACEABILITY ITEM COMPONENT
// =====================================================

interface TraceabilityItemProps {
  scan: ScanWithDetails;
}

function TraceabilityItem({ scan }: TraceabilityItemProps) {
  const code = scan.qrCode?.code || 'QR-XXX';
  const company = scan.qrCode?.company?.businessName || 'Empresa';
  const collectionPoint = scan.collectionPoint || 'Punto de acopio';
  const status = getStatusFromScan(scan);
  const date = new Date(scan.scannedAt).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <StatusDot status={status} />
            <div>
              <p className="font-medium text-foreground text-sm">
                {code} - {status}
              </p>
              <p className="text-xs text-muted-foreground">
                {collectionPoint}
              </p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">{date}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// =====================================================
// STATUS DOT COMPONENT
// =====================================================

interface StatusDotProps {
  status: string;
}

function StatusDot({ status }: StatusDotProps) {
  const colors: Record<string, string> = {
    escaneado: 'bg-info',
    'en acopio': 'bg-warning',
    reciclado: 'bg-success',
  };

  return (
    <div className={cn(
      'w-2.5 h-2.5 rounded-full mt-1.5',
      colors[status.toLowerCase()] || 'bg-muted'
    )} />
  );
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function getStatusFromScan(scan: ScanWithDetails): string {
  const qrStatus = scan.qrCode?.status;
  if (qrStatus === 'recycled') return 'reciclado';
  if (qrStatus === 'collected') return 'en acopio';
  return 'escaneado';
}
