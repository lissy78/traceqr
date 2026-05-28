'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { eventBus } from '@/lib/events'
import type { ScanResult } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MobileHeader } from './mobile-layout'
import { CheckCircleIcon } from '@/components/icons'

type ScannerState =
  | 'idle'
  | 'scanning'
  | 'processing'
  | 'success'
  | 'error'

interface ScannerScreenProps {
  userId: string
  onBack: () => void
}

export function ScannerScreen({
  userId,
  onBack,
}: ScannerScreenProps) {
  const [scannerState, setScannerState] =
    useState<ScannerState>('idle')

  const [scanResult, setScanResult] =
    useState<ScanResult | null>(null)

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null)

  const scannerRef = useRef<HTMLDivElement>(null)
  const html5QrCodeRef = useRef<any>(null)

  const handleQrCodeScanned = useCallback(
    async (decodedText: string) => {
      if (
        scannerState === 'processing' ||
        scannerState === 'success'
      ) {
        return
      }

      setScannerState('processing')

      try {
        if (html5QrCodeRef.current) {
          await html5QrCodeRef.current.stop()
        }

        const result = await processQrCode(
          decodedText,
          userId
        )

        setScanResult(result)

        if (result.success) {
          eventBus.emit('scan:success', { result })

          eventBus.emit('points:earned', {
            amount: result.pointsEarned,
            reason: 'Escaneo de envase',
          })

          setScannerState('success')
        } else {
          setErrorMessage(result.message)
          setScannerState('error')
        }
      } catch (error) {
        console.error(error)
        setErrorMessage(
          'Error al procesar el código QR'
        )
        setScannerState('error')
      }
    },
    [scannerState, userId]
  )

  const initializeScanner = useCallback(async () => {
    if (!scannerRef.current) return

    try {
      await navigator.mediaDevices.getUserMedia({
        video: true,
      })

      const { Html5Qrcode } = await import(
        'html5-qrcode'
      )

      const scanner = new Html5Qrcode('qr-reader')
      html5QrCodeRef.current = scanner

      setScannerState('scanning')

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: 250,
        },
        handleQrCodeScanned,
        () => {}
      )
    } catch (error) {
      console.error(
        'Scanner initialization error:',
        error
      )

      setErrorMessage(
        'No se pudo acceder a la cámara'
      )

      setScannerState('error')
    }
  }, [handleQrCodeScanned])

  const handleScanAnother = useCallback(async () => {
    setScanResult(null)
    setErrorMessage(null)
    setScannerState('idle')

    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.clear()
      } catch {}
    }

    setTimeout(() => {
      initializeScanner()
    }, 300)
  }, [initializeScanner])

  useEffect(() => {
    initializeScanner()

    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current
          .stop()
          .catch(() => {})
      }
    }
  }, [])

  if (scannerState === 'success' && scanResult) {
    return (
      <ScanSuccessScreen
        result={scanResult}
        onScanAnother={handleScanAnother}
        onBack={onBack}
      />
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <MobileHeader
        title="Escanear envase"
        showBack
        onBack={onBack}
        transparent
      />

      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="relative aspect-square w-full max-w-sm">
          <div
            id="qr-reader"
            ref={scannerRef}
            className="h-full w-full overflow-hidden rounded-2xl"
          />

          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-4 top-4 h-12 w-12 rounded-tl-xl border-l-4 border-t-4 border-cyan-400" />
            <div className="absolute right-4 top-4 h-12 w-12 rounded-tr-xl border-r-4 border-t-4 border-cyan-400" />
            <div className="absolute bottom-4 left-4 h-12 w-12 rounded-bl-xl border-b-4 border-l-4 border-cyan-400" />
            <div className="absolute bottom-4 right-4 h-12 w-12 rounded-br-xl border-b-4 border-r-4 border-cyan-400" />
          </div>
        </div>

        {scannerState === 'processing' && (
          <div className="mt-6">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
          </div>
        )}

        {errorMessage && (
          <div className="mt-6 w-full max-w-sm rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-center text-red-400">
              {errorMessage}
            </p>

            <Button
              onClick={handleScanAnother}
              className="mt-4 w-full"
            >
              Intentar de nuevo
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

interface ScanSuccessScreenProps {
  result: ScanResult
  onScanAnother: () => void
  onBack: () => void
}

function ScanSuccessScreen({
  result,
  onScanAnother,
  onBack,
}: ScanSuccessScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <CheckCircleIcon
        size={80}
        className="text-green-500"
      />

      <h1 className="mt-6 text-3xl font-bold">
        ¡Escaneo exitoso!
      </h1>

      <p className="mt-3 text-muted-foreground">
        +{result.pointsEarned} puntos
      </p>

      <div className="mt-8 w-full max-w-sm space-y-3">
        <Button
          onClick={onScanAnother}
          className="w-full"
        >
          Escanear otro
        </Button>

        <Button
          variant="outline"
          onClick={onBack}
          className="w-full"
        >
          Volver
        </Button>
      </div>
    </div>
  )
}

async function processQrCode(
  code: string,
  userId: string
): Promise<ScanResult> {
  const supabase = createClient()

  try {
    const { data: qrCode } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('code', code)
      .single()

    if (!qrCode) {
      return {
        success: false,
        pointsEarned: 0,
        message: 'Código no válido',
        scanDetails: null,
      }
    }

    return {
      success: true,
      pointsEarned: 10,
      message: 'Escaneo exitoso',
      scanDetails: null,
    }
  } catch {
    return {
      success: false,
      pointsEarned: 0,
      message: 'Error procesando QR',
      scanDetails: null,
    }
  }
}
