/**
 * =====================================================
 * TraceQR Type Definitions
 * Centralized TypeScript interfaces for the entire app
 * =====================================================
 */

// =====================================================
// USER TYPES
// =====================================================

/** User roles in the system */
export type UserRole = 'student' | 'company' | 'admin';

/** User level based on green points */
export type UserLevel = 'Verde Activo' | 'Verde Lider' | 'Verde Embajador';

/** User profile from public.users table */
export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  studentCode: string | null;
  academicProgram: string | null;
  campus: string;
  greenPoints: number;
  level: UserLevel;
  totalScans: number;
  totalRedemptions: number;
  kgRecycled: number;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

/** Data for student registration form */
export interface StudentRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  studentCode: string;
  academicProgram: string;
  campus: string;
  acceptTerms: boolean;
  allowGps: boolean;
}

// =====================================================
// COMPANY TYPES
// =====================================================

/** Company status in the system */
export type CompanyStatus = 'pending' | 'active' | 'suspended';

/** Company profile from public.companies table */
export interface Company {
  id: string;
  userId: string | null;
  businessName: string;
  nit: string;
  dv: string | null;
  industrialSector: string | null;
  city: string | null;
  repEmail: string | null;
  prefix: string;
  status: CompanyStatus;
  totalScans: number;
  totalQrGenerated: number;
  kgTracked: number;
  closureRate: number;
  createdAt: string;
  updatedAt: string;
}

/** Data for company registration form */
export interface CompanyRegistrationData {
  businessName: string;
  nit: string;
  dv: string;
  industrialSector: string;
  city: string;
  repEmail: string;
  plasticType: PlasticType;
  volumeMl: number;
  weightG: number;
  productDescription: string;
  lotNumber: string;
  qrCount: number;
}

// =====================================================
// PRODUCT TYPES
// =====================================================

/** Supported plastic types */
export type PlasticType = 'PET' | 'HDPE' | 'PP' | 'LDPE' | 'PS' | 'OTHER';

/** Plastic type labels in Spanish */
export const PLASTIC_TYPE_LABELS: Record<PlasticType, string> = {
  PET: '1 - PET - Tereftalato de polietileno',
  HDPE: '2 - HDPE - Polietileno de alta densidad',
  PP: '5 - PP - Polipropileno',
  LDPE: '4 - LDPE - Polietileno de baja densidad',
  PS: '6 - PS - Poliestireno',
  OTHER: '7 - Otros plasticos',
};

/** Product from public.products table */
export interface Product {
  id: string;
  companyId: string;
  plasticType: PlasticType;
  volumeMl: number | null;
  weightG: number | null;
  description: string | null;
  lotNumber: string | null;
  qrCount: number;
  createdAt: string;
}

// =====================================================
// QR CODE TYPES
// =====================================================

/** QR code lifecycle status */
export type QrCodeStatus = 'active' | 'scanned' | 'collected' | 'recycled' | 'invalid';

/** QR code from public.qr_codes table */
export interface QrCode {
  id: string;
  productId: string;
  code: string;
  status: QrCodeStatus;
  scannedAt: string | null;
  collectedAt: string | null;
  recycledAt: string | null;
  createdAt: string;
}

/** Extended QR code with product and company info */
export interface QrCodeWithDetails extends QrCode {
  product: Product;
  company: Company;
}

// =====================================================
// SCAN TYPES
// =====================================================

/** Scan record from public.scans table */
export interface Scan {
  id: string;
  userId: string;
  qrCodeId: string;
  collectionPoint: string | null;
  pointsEarned: number;
  scannedAt: string;
}

/** Extended scan with QR code details */
export interface ScanWithDetails extends Scan {
  qrCode: QrCodeWithDetails;
}

/** Scan result after processing a QR code */
export interface ScanResult {
  success: boolean;
  pointsEarned: number;
  message: string;
  scanDetails: {
    company: string;
    plasticType: PlasticType;
    volumeMl: number;
    collectionPoint: string;
    scannedAt: string;
  } | null;
}

// =====================================================
// REWARD TYPES
// =====================================================

/** Reward from public.rewards table */
export interface Reward {
  id: string;
  name: string;
  description: string | null;
  pointsCost: number;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

/** Redemption record from public.redemptions table */
export interface Redemption {
  id: string;
  userId: string;
  rewardId: string;
  pointsSpent: number;
  redeemedAt: string;
}

/** Extended redemption with reward details */
export interface RedemptionWithDetails extends Redemption {
  reward: Reward;
}

// =====================================================
// DASHBOARD TYPES
// =====================================================

/** User dashboard statistics */
export interface UserDashboardStats {
  greenPoints: number;
  totalScans: number;
  totalRedemptions: number;
  kgRecycled: number;
  level: UserLevel;
  nextLevelPoints: number;
}

/** Company dashboard statistics */
export interface CompanyDashboardStats {
  totalScans: number;
  totalQrGenerated: number;
  kgTracked: number;
  closureRate: number;
  plasticBreakdown: Record<PlasticType, number>;
  monthlyScans: { month: string; count: number }[];
}

/** Admin dashboard statistics */
export interface AdminDashboardStats {
  activeUsers: number;
  registeredCompanies: number;
  scansToday: number;
  closureRateGlobal: number;
  recentScans: ScanWithDetails[];
  recentAlerts: SystemAlert[];
}

/** System alert for admin dashboard */
export interface SystemAlert {
  id: string;
  type: 'duplicate' | 'invalid' | 'new_company' | 'info';
  message: string;
  createdAt: string;
}

// =====================================================
// TRACEABILITY TYPES
// =====================================================

/** Lot status for REP compliance */
export type LotStatus = 'Registrado' | 'En Acopio' | 'Reciclado' | 'Incidencia';

/** Lot record for traceability */
export interface Lot {
  id: string;
  lotNumber: string;
  status: LotStatus;
  date: string;
  qrCount: number;
  scannedCount: number;
}

/** REP monthly report data */
export interface RepReport {
  period: string;
  totalScans: number;
  kgEstimated: number;
  closureRate: number;
  status: 'Listo para enviar' | 'Pendiente' | 'Enviado';
}

// =====================================================
// CAMPUS RANKING TYPES
// =====================================================

/** User in campus ranking */
export interface RankingUser {
  id: string;
  name: string;
  points: number;
  position: number;
  level: UserLevel;
}

// =====================================================
// NAVIGATION TYPES
// =====================================================

/** Mobile app navigation tabs */
export type MobileNavTab = 'inicio' | 'escanear' | 'canjear' | 'impacto' | 'perfil';

/** Navigation item configuration */
export interface NavItem {
  id: MobileNavTab;
  label: string;
  icon: string;
  href: string;
}

// =====================================================
// ADDITIONAL DASHBOARD TYPES
// Used by admin and company dashboard components
// =====================================================

/** Admin panel statistics */
export interface AdminStats {
  activeUsers: number;
  usersChange: number;
  scansToday: number;
  scansChange: number;
  registeredCompanies: number;
  companiesThisMonth: number;
  globalClosureRate: number;
  closureChange: number;
}

/** Company portal statistics */
export interface CompanyStats {
  totalScans: number;
  totalKgTracked: number;
  closureRate: number;
  qrGenerated: number;
  scansChange: number;
  kgChange: number;
  closureChange: number;
}

/** Traceability event for company dashboard */
export interface TraceabilityEvent {
  id: string;
  qrCode: string;
  event: 'scanned' | 'collected' | 'recycled' | 'invalid';
  location: string;
  timestamp: string;
}
