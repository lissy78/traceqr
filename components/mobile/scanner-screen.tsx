'use client';

/**
 * =====================================================
 * QR Scanner Screen Component
 * Camera-based QR code scanner for recycling containers
 * Uses html5-qrcode library for real camera access
 * =====================================================
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { eventBus } from '@/lib/events';
import type { ScanResult, QrCodeWithDetails } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MobileHeader } from './mobile-layout';
import { CheckCircleIcon, ArrowLeftIcon } from '@/components/icons';

// =====================================================
// TYPES
// =====================================================

type ScannerState = 'idle' | 'scanning' | 'processing' | 'success' | 'error';

interface ScannerScreenProps {
  /** User ID for recording scans */
  userId: string;
  /** Callback when user wants to go back */
  onBack: () => void;
}

// =====================================================
// SCANNER SCREEN COMPONENT
// =====================================================

export function ScannerScreen({ userId, onBack }: ScannerScreenProps) {
  // Scanner state
  const [scannerState, setScannerState] = useState<ScannerState>('idle');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Refs
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<unknown>(null);

  /**
   * Initialize the QR scanner
   * Loads html5-qrcode dynamically and starts camera
   */
  const initializeScanner = useCallback(async () => {
    if (!scannerRef.current || scannerState !== 'idle') return;

    try {
      setScannerState('scanning');
      
      // Dynamically import html5-qrcode to avoid SSR issues
      const { Html5Qrcode } = await import('html5-qrcode');
      
      const scanner = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        handleQrCodeScanned,
        (errorMsg: string) => {
          // Ignore errors during scanning (normal when no QR found)
        }
      );
    } catch (error) {
      console.error('[v0] Scanner initialization error:', error);
      setErrorMessage('No se pudo acceder a la camara. Por favor permite el acceso.');
      setScannerState('error');
    }
  }, [scannerState]);

  /**
   * Handle successful QR code scan
   * Validates and processes the scanned code
   */
  const handleQrCodeScanned = useCallback(async (decodedText: string) => {
    // Prevent multiple scans
    if (scannerState === 'processing' || scannerState === 'success') return;
    
    setScannerState('processing');
    
    // Emit scan start event
    eventBus.emit('scan:start', undefined);

    try {
      // Stop the scanner
      if (html5QrCodeRef.current) {
        await (html5QrCodeRef.current as { stop: () => Promise<void> }).stop();
      }

      // Process the QR code
      const result = await processQrCode(decodedText, userId);
      
      setScanResult(result);
      setScannerState(result.success ? 'success' : 'error');
      
      if (result.success) {
        eventBus.emit('scan:success', { result });
        eventBus.emit('points:earned', { 
          amount: result.pointsEarned, 
          reason: 'Escaneo de envase' 
        });
      } else {
        eventBus.emit('scan:error', { error: result.message });
      }
    } catch (error) {
      console.error('[v0] QR processing error:', error);
      setErrorMessage('Error al procesar el codigo QR');
      setScannerState('error');
      eventBus.emit('scan:error', { error: 'Error de procesamiento' });
    }
  }, [userId, scannerState]);

  /**
   * Reset scanner to scan another code
   */
  const handleScanAnother = useCallback(() => {
    setScanResult(null);
    setErrorMessage(null);
    setScannerState('idle');
  }, []);

  // Initialize scanner on mount
  useEffect(() => {
    if (scannerState === 'idle') {
      initializeScanner();
    }

    // Cleanup on unmount
    return () => {
      if (html5QrCodeRef.current) {
        (html5QrCodeRef.current as { stop: () => Promise<void> }).stop().catch(() => {});
      }
    };
  }, [initializeScanner, scannerState]);

  // Render success state
  if (scannerState === 'success' && scanResult) {
    return (
      <ScanSuccessScreen 
        result={scanResult} 
        onScanAnother={handleScanAnother}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-foreground">
      {/* Header */}
      <MobileHeader 
        title="Escanear envase" 
        showBack 
        onBack={onBack}
        transparent
      />

      {/* Scanner Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {/* QR Scanner Container */}
        <div className="relative w-full max-w-sm aspect-square">
          {/* Scanner viewfinder */}
          <div 
            id="qr-reader" 
            ref={scannerRef}
            className="w-full h-full rounded-2xl overflow-hidden"
          />
          
          {/* Viewfinder overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Corner brackets */}
            <div className="absolute top-4 left-4 w-12 h-12 border-l-4 border-t-4 border-primary rounded-tl-xl" />
            <div className="absolute top-4 right-4 w-12 h-12 border-r-4 border-t-4 border-primary rounded-tr-xl" />
            <div className="absolute bottom-4 left-4 w-12 h-12 border-l-4 border-b-4 border-primary rounded-bl-xl" />
            <div className="absolute bottom-4 right-4 w-12 h-12 border-r-4 border-b-4 border-primary rounded-br-xl" />
            
            {/* Scanning indicator */}
            {scannerState === 'scanning' && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-primary/80 rounded-full">
                <p className="text-sm text-primary-foreground font-medium animate-pulse">
                  Buscando QR...
                </p>
              </div>
            )}
            
            {/* Processing indicator */}
            {scannerState === 'processing' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <Card className="w-full max-w-sm mt-6 bg-card/90 backdrop-blur">
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-3">Como escanear</h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0">1</span>
                <span>Deposita el envase en el punto de acopio mas cercano</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0">2</span>
                <span>Apunta la camara al codigo QR del envase</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0">3</span>
                <span>¡Recibe tus puntos automaticamente!</span>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Error message */}
        {errorMessage && (
          <div className="w-full max-w-sm mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
            <p className="text-sm text-destructive text-center">{errorMessage}</p>
            <Button 
              onClick={handleScanAnother}
              variant="outline"
              className="w-full mt-3"
            >
              Intentar de nuevo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// SCAN SUCCESS SCREEN
// =====================================================

interface ScanSuccessScreenProps {
  result: ScanResult;
  onScanAnother: () => void;
  onBack: () => void;
}

function ScanSuccessScreen({ result, onScanAnother, onBack }: ScanSuccessScreenProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background p-4 safe-top safe-bottom animate-fade-in">
      {/* Success Icon */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-success/20 animate-pulse-ring" />
          <div className="relative flex items-center justify-center w-24 h-24 bg-success/20 rounded-full">
            <CheckCircleIcon size={64} className="text-success" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground mt-6 text-center">
          ¡Reciclaje registrado!
        </h1>
        <p className="text-muted-foreground text-center mt-2">
          Tu envase ha sido rastreado exitosamente. Gracias por cuidar el planeta
        </p>

        {/* Points Earned */}
        <div className="mt-8 px-8 py-4 bg-success/10 rounded-2xl">
          <p className="text-4xl font-bold text-success text-center">
            +{result.pointsEarned}
          </p>
          <p className="text-sm text-success text-center uppercase tracking-wide">
            Puntos Verdes Ganados
          </p>
        </div>

        {/* Scan Details */}
        {result.scanDetails && (
          <Card className="w-full max-w-sm mt-8">
            <CardContent className="p-4 space-y-3">
              <DetailRow label="Empresa" value={result.scanDetails.company} />
              <DetailRow 
                label="Tipo de plastico" 
                value={`${result.scanDetails.plasticType} · ${result.scanDetails.volumeMl} ml`} 
              />
              <DetailRow label="Punto de acopio" value={result.scanDetails.collectionPoint} />
              <DetailRow 
                label="Hora" 
                value={new Date(result.scanDetails.scannedAt).toLocaleString('es-CO')} 
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3 pt-4">
        <Button
          onClick={onScanAnother}
          className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
        >
          Escanear otro envase
        </Button>
        <Button
          onClick={onBack}
          variant="outline"
          className="w-full h-14 text-lg font-medium rounded-xl"
        >
          Volver al inicio
        </Button>
      </div>
    </div>
  );
}

// =====================================================
// HELPER COMPONENTS
// =====================================================

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Process a scanned QR code
 * Validates the code and records the scan in the database
 */
async function processQrCode(code: string, userId: string): Promise<ScanResult> {
  const supabase = createClient();

  try {
    // Find the QR code in the database
    const { data: qrCode, error: qrError } = await supabase
      .from('qr_codes')
      .select(`
        *,
        products:product_id (
          *,
          companies:company_id (*)
        )
      `)
      .eq('code', code)
      .single();

    if (qrError || !qrCode) {
      return {
        success: false,
        pointsEarned: 0,
        message: 'Codigo QR no reconocido',
        scanDetails: null,
      };
    }

    // Check if already scanned
    if (qrCode.status !== 'active') {
      return {
        success: false,
        pointsEarned: 0,
        message: 'Este envase ya fue escaneado anteriormente',
        scanDetails: null,
      };
    }

    // Record the scan
    const pointsEarned = 10;
    const collectionPoint = 'Bloque A - Piso 1';

    const { error: scanError } = await supabase
      .from('scans')
      .insert({
        user_id: userId,
        qr_code_id: qrCode.id,
        collection_point: collectionPoint,
        points_earned: pointsEarned,
      });

    if (scanError) {
      throw scanError;
    }

    // Update QR code status
    await supabase
      .from('qr_codes')
      .update({ 
        status: 'scanned',
        scanned_at: new Date().toISOString(),
      })
      .eq('id', qrCode.id);

    // Update user points
    await supabase.rpc('increment_user_points', { 
      user_id: userId, 
      points: pointsEarned 
    });

    const product = qrCode.products;
    const company = product?.companies;

    return {
      success: true,
      pointsEarned,
      message: '¡Escaneo exitoso!',
      scanDetails: {
        company: company?.business_name || 'Empresa',
        plasticType: product?.plastic_type || 'PET',
        volumeMl: product?.volume_ml || 500,
        collectionPoint,
        scannedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('[v0] processQrCode error:', error);
    return {
      success: false,
      pointsEarned: 0,
      message: 'Error al procesar el escaneo',
      scanDetails: null,
    };
  }
}
