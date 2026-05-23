'use client';

/**
 * =====================================================
 * TraceQR Mobile App Main Component
 * Orchestrates all mobile screens and navigation
 * Handles authentication state and data fetching
 * =====================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { eventBus, useEvent } from '@/lib/events';
import type { 
  User, 
  MobileNavTab, 
  Reward, 
  RedemptionWithDetails,
  ScanWithDetails,
  PlasticType,
  UserDashboardStats,
} from '@/lib/types';

// Import all mobile screens
import { MobileLayout } from './mobile-layout';
import { SplashScreen } from './splash-screen';
import { LoginScreen } from './login-screen';
import { RegisterScreen } from './register-screen';
import { DashboardScreen } from './dashboard-screen';
import { ScannerScreen } from './scanner-screen';
import { RewardsScreen } from './rewards-screen';
import { ImpactScreen } from './impact-screen';

// =====================================================
// TYPES
// =====================================================

type AppScreen = 'splash' | 'login' | 'register' | 'main';

// =====================================================
// MOBILE APP COMPONENT
// =====================================================

export function MobileApp() {
  // App state
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('splash');
  const [activeTab, setActiveTab] = useState<MobileNavTab>('inicio');
  const [isLoading, setIsLoading] = useState(true);

  // User state
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserDashboardStats | null>(null);

  // Rewards state
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptionHistory, setRedemptionHistory] = useState<RedemptionWithDetails[]>([]);

  // Impact state
  const [recentScans, setRecentScans] = useState<ScanWithDetails[]>([]);
  const [plasticBreakdown, setPlasticBreakdown] = useState<Record<PlasticType, number>>({
    PET: 0,
    HDPE: 0,
    PP: 0,
    LDPE: 0,
    PS: 0,
    OTHER: 0,
  });

  /**
   * Check authentication state on mount
   */
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Fetch user profile
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userData) {
          setUser(mapUserData(userData));
          setStats(mapUserStats(userData));
          setCurrentScreen('main');
        }
      }
      
      setIsLoading(false);
    };

    // Show splash for minimum 2 seconds
    const timer = setTimeout(() => {
      checkAuth();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  /**
   * Fetch rewards data
   */
  const fetchRewards = useCallback(async () => {
    const supabase = createClient();
    
    const { data } = await supabase
      .from('rewards')
      .select('*')
      .eq('is_active', true)
      .order('points_cost', { ascending: true });

    if (data) {
      setRewards(data.map(mapRewardData));
    }
  }, []);

  /**
   * Fetch user's redemption history
   */
  const fetchRedemptionHistory = useCallback(async () => {
    if (!user?.id) return;
    
    const supabase = createClient();
    
    const { data } = await supabase
      .from('redemptions')
      .select(`
        *,
        reward:reward_id (*)
      `)
      .eq('user_id', user.id)
      .order('redeemed_at', { ascending: false })
      .limit(10);

    if (data) {
      setRedemptionHistory(data.map(mapRedemptionData));
    }
  }, [user?.id]);

  /**
   * Fetch user's recent scans
   */
  const fetchRecentScans = useCallback(async () => {
    if (!user?.id) return;
    
    const supabase = createClient();
    
    const { data } = await supabase
      .from('scans')
      .select(`
        *,
        qr_code:qr_code_id (
          *,
          product:product_id (
            *,
            company:company_id (*)
          )
        )
      `)
      .eq('user_id', user.id)
      .order('scanned_at', { ascending: false })
      .limit(10);

    if (data) {
      setRecentScans(data.map(mapScanData));
      
      // Calculate plastic breakdown
      const breakdown: Record<PlasticType, number> = {
        PET: 0, HDPE: 0, PP: 0, LDPE: 0, PS: 0, OTHER: 0,
      };
      
      data.forEach((scan: { qr_code?: { product?: { plastic_type?: PlasticType } } }) => {
        const type = scan.qr_code?.product?.plastic_type as PlasticType;
        if (type && breakdown[type] !== undefined) {
          breakdown[type]++;
        }
      });
      
      setPlasticBreakdown(breakdown);
    }
  }, [user?.id]);

  /**
   * Refresh user data after changes
   */
  const refreshUserData = useCallback(async () => {
    if (!user?.id) return;
    
    const supabase = createClient();
    
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userData) {
      setUser(mapUserData(userData));
      setStats(mapUserStats(userData));
    }
  }, [user?.id]);

  // Fetch data when user is authenticated
  useEffect(() => {
    if (user?.id && currentScreen === 'main') {
      fetchRewards();
      fetchRedemptionHistory();
      fetchRecentScans();
    }
  }, [user?.id, currentScreen, fetchRewards, fetchRedemptionHistory, fetchRecentScans]);

  // Listen for points changes to refresh data
  useEvent('points:earned', () => {
    refreshUserData();
    fetchRecentScans();
  });

  useEvent('points:spent', () => {
    refreshUserData();
    fetchRedemptionHistory();
  });

  /**
   * Handle splash screen completion
   */
  const handleSplashComplete = useCallback(() => {
    if (!user) {
      setCurrentScreen('login');
    }
  }, [user]);

  /**
   * Handle successful login
   */
  const handleLoginSuccess = useCallback(async () => {
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (authUser) {
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userData) {
        setUser(mapUserData(userData));
        setStats(mapUserStats(userData));
      }
    }
    
    setCurrentScreen('main');
    setActiveTab('inicio');
  }, []);

  /**
   * Handle registration success
   */
  const handleRegisterSuccess = useCallback(() => {
    setCurrentScreen('login');
    eventBus.emit('ui:toast', {
      message: 'Revisa tu correo para confirmar tu cuenta',
      type: 'info',
      duration: 5000,
    });
  }, []);

  /**
   * Handle logout
   */
  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    
    setUser(null);
    setStats(null);
    setCurrentScreen('login');
    
    eventBus.emit('auth:logout', undefined);
  }, []);

  /**
   * Handle tab change
   */
  const handleTabChange = useCallback((tab: MobileNavTab) => {
    setActiveTab(tab);
  }, []);

  // Loading state
  if (isLoading) {
    return <SplashScreen onStart={() => {}} />;
  }

  // Render current screen
  switch (currentScreen) {
    case 'splash':
      return <SplashScreen onStart={handleSplashComplete} />;
    
    case 'login':
      return (
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onRegister={() => setCurrentScreen('register')}
          onForgotPassword={() => {
            eventBus.emit('ui:toast', {
              message: 'Funcionalidad proximamente disponible',
              type: 'info',
            });
          }}
        />
      );
    
    case 'register':
      return (
        <RegisterScreen
          onRegisterSuccess={handleRegisterSuccess}
          onBack={() => setCurrentScreen('login')}
        />
      );
    
    case 'main':
      // Handle scanner separately (full screen without nav)
      if (activeTab === 'escanear' && user) {
        return (
          <ScannerScreen
            userId={user.id}
            onBack={() => setActiveTab('inicio')}
          />
        );
      }

      return (
        <MobileLayout
          activeTab={activeTab}
          onTabChange={handleTabChange}
          hideNavigation={activeTab === 'escanear'}
        >
          {activeTab === 'inicio' && (
            <DashboardScreen
              user={user}
              stats={stats}
              isLoading={false}
            />
          )}
          
          {activeTab === 'canjear' && (
            <RewardsScreen
              user={user}
              rewards={rewards}
              redemptionHistory={redemptionHistory}
              onRedemptionComplete={() => {
                refreshUserData();
                fetchRedemptionHistory();
                fetchRewards();
              }}
              isLoading={false}
            />
          )}
          
          {activeTab === 'impacto' && (
            <ImpactScreen
              user={user}
              recentScans={recentScans}
              plasticBreakdown={plasticBreakdown}
              isLoading={false}
            />
          )}
          
          {activeTab === 'perfil' && (
            <ProfileSection user={user} onLogout={handleLogout} />
          )}
        </MobileLayout>
      );
    
    default:
      return null;
  }
}

// =====================================================
// PROFILE SECTION (Simple for now)
// =====================================================

interface ProfileSectionProps {
  user: User | null;
  onLogout: () => void;
}

function ProfileSection({ user, onLogout }: ProfileSectionProps) {
  return (
    <div className="p-4 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Mi Perfil</h1>
      </header>

      <div className="flex flex-col items-center py-8">
        <div className="flex items-center justify-center w-20 h-20 bg-primary/20 rounded-full mb-4">
          <span className="text-2xl font-bold text-primary">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </span>
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          {user?.firstName} {user?.lastName}
        </h2>
        <p className="text-muted-foreground">{user?.email}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {user?.academicProgram}
        </p>
      </div>

      <div className="space-y-3">
        <ProfileItem label="Codigo estudiantil" value={user?.studentCode || '-'} />
        <ProfileItem label="Sede" value={user?.campus || '-'} />
        <ProfileItem label="Nivel" value={user?.level || 'Verde Activo'} />
        <ProfileItem label="Puntos totales" value={`${user?.greenPoints || 0} pts`} />
      </div>

      <button
        onClick={onLogout}
        className="w-full py-3 text-destructive font-medium hover:bg-destructive/10 rounded-xl transition-colors"
      >
        Cerrar sesion
      </button>
    </div>
  );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-3 border-b border-border">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

// =====================================================
// DATA MAPPING FUNCTIONS
// =====================================================

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapUserData(data: any): User {
  return {
    id: data.id,
    email: data.email,
    firstName: data.first_name,
    lastName: data.last_name,
    studentCode: data.student_code,
    academicProgram: data.academic_program,
    campus: data.campus,
    greenPoints: data.green_points || 0,
    level: data.level || 'Verde Activo',
    totalScans: data.total_scans || 0,
    totalRedemptions: data.total_redemptions || 0,
    kgRecycled: parseFloat(data.kg_recycled) || 0,
    role: data.role || 'student',
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapUserStats(data: any): UserDashboardStats {
  const points = data.green_points || 0;
  return {
    greenPoints: points,
    totalScans: data.total_scans || 0,
    totalRedemptions: data.total_redemptions || 0,
    kgRecycled: parseFloat(data.kg_recycled) || 0,
    level: data.level || 'Verde Activo',
    nextLevelPoints: points < 500 ? 500 : points < 1500 ? 1500 : 3000,
  };
}

function mapRewardData(data: any): Reward {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    pointsCost: data.points_cost,
    stock: data.stock,
    imageUrl: data.image_url,
    isActive: data.is_active,
    createdAt: data.created_at,
  };
}

function mapRedemptionData(data: any): RedemptionWithDetails {
  return {
    id: data.id,
    userId: data.user_id,
    rewardId: data.reward_id,
    pointsSpent: data.points_spent,
    redeemedAt: data.redeemed_at,
    reward: data.reward ? mapRewardData(data.reward) : null as any,
  };
}

function mapScanData(data: any): ScanWithDetails {
  return {
    id: data.id,
    userId: data.user_id,
    qrCodeId: data.qr_code_id,
    collectionPoint: data.collection_point,
    pointsEarned: data.points_earned,
    scannedAt: data.scanned_at,
    qrCode: data.qr_code ? {
      id: data.qr_code.id,
      productId: data.qr_code.product_id,
      code: data.qr_code.code,
      status: data.qr_code.status,
      scannedAt: data.qr_code.scanned_at,
      collectedAt: data.qr_code.collected_at,
      recycledAt: data.qr_code.recycled_at,
      createdAt: data.qr_code.created_at,
      product: data.qr_code.product,
      company: data.qr_code.product?.company,
    } : null as any,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
