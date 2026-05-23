'use client';

/**
 * =====================================================
 * Splash Screen Component
 * First screen users see when opening the app
 * Features animated logo and onboarding dots
 * =====================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { LogoIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon } from '@/components/icons';

// =====================================================
// PROPS INTERFACE
// =====================================================

interface SplashScreenProps {
  /** Callback when user clicks "Comenzar" */
  onStart: () => void;
}

// =====================================================
// SPLASH SCREEN COMPONENT
// =====================================================

export function SplashScreen({ onStart }: SplashScreenProps) {
  // Track current onboarding slide
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Auto-advance slides every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-primary/10 p-8 safe-top safe-bottom">
      {/* Top section - Logo and branding */}
      <div className="flex-1 flex flex-col items-center justify-center animate-fade-in">
        {/* Logo container with pulse animation */}
        <div className="relative">
          {/* Pulse ring effect */}
          <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-pulse-ring" />
          
          {/* Main logo box */}
          <div className="relative flex items-center justify-center w-28 h-28 bg-card rounded-2xl shadow-lg">
            <LogoIcon size={64} className="text-primary" />
          </div>
        </div>

        {/* Brand name */}
        <h1 className="mt-8 text-4xl font-bold text-foreground tracking-tight">
          TraceQR
        </h1>

        {/* Tagline with recycle icon */}
        <p className="mt-3 text-muted-foreground text-center flex items-center gap-2">
          <span className="text-primary">&#9851;</span>
          <span>Rastrear</span>
          <span className="text-primary">·</span>
          <span>Reciclar</span>
          <span className="text-primary">·</span>
          <span>Ganar</span>
        </p>
      </div>

      {/* Middle section - Onboarding dots */}
      <div className="flex items-center gap-2 py-8">
        {[0, 1, 2].map((index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={cn(
              'w-2.5 h-2.5 rounded-full transition-all duration-300',
              currentSlide === index 
                ? 'bg-primary w-8' 
                : 'bg-primary/30'
            )}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Bottom section - CTA Button */}
      <div className="w-full max-w-xs animate-slide-up">
        <Button
          onClick={onStart}
          className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg"
        >
          <span>Comenzar</span>
          <ArrowRightIcon size={20} className="ml-2" />
        </Button>
      </div>
    </div>
  );
}
