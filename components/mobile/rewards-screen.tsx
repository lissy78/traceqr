'use client';

/**
 * =====================================================
 * Rewards Screen Component
 * Display available rewards and handle redemption
 * Features reward cards, history, and redemption flow
 * =====================================================
 */

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { eventBus } from '@/lib/events';
import type { Reward, User, Redemption, RedemptionWithDetails } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GiftIcon, CheckCircleIcon } from '@/components/icons';

// =====================================================
// PROPS INTERFACE
// =====================================================

interface RewardsScreenProps {
  /** Current user data */
  user: User | null;
  /** Available rewards */
  rewards: Reward[];
  /** User's redemption history */
  redemptionHistory: RedemptionWithDetails[];
  /** Callback to refresh data after redemption */
  onRedemptionComplete: () => void;
  /** Loading state */
  isLoading?: boolean;
}

// =====================================================
// SAMPLE REWARD IMAGES (emoji placeholders)
// =====================================================

const REWARD_EMOJIS: Record<string, string> = {
  'Empanada pipian': '🥟',
  'Cafe americano': '☕',
  'Jugo natural 350ml': '🧃',
  'Snack saludable': '🍪',
};

// =====================================================
// REWARDS SCREEN COMPONENT
// =====================================================

export function RewardsScreen({
  user,
  rewards,
  redemptionHistory,
  onRedemptionComplete,
  isLoading,
}: RewardsScreenProps) {
  // State for redemption modal
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState(false);

  const availablePoints = user?.greenPoints ?? 0;

  /**
   * Handle reward redemption
   * Deducts points and creates redemption record
   */
  const handleRedeem = useCallback(async (reward: Reward) => {
    if (!user || availablePoints < reward.pointsCost) return;
    
    setIsRedeeming(true);
    eventBus.emit('reward:redeem', { reward });

    try {
      const supabase = createClient();

      // Create redemption record
      const { data, error } = await supabase
        .from('redemptions')
        .insert({
          user_id: user.id,
          reward_id: reward.id,
          points_spent: reward.pointsCost,
        })
        .select()
        .single();

      if (error) throw error;

      // Update user points (handled by RPC or trigger)
      await supabase.rpc('decrement_user_points', {
        user_id: user.id,
        points: reward.pointsCost,
      });

      // Update reward stock
      await supabase
        .from('rewards')
        .update({ stock: reward.stock - 1 })
        .eq('id', reward.id);

      setRedeemSuccess(true);
      
      eventBus.emit('reward:redeemSuccess', { 
        redemption: data as unknown as Redemption,
        reward,
      });
      eventBus.emit('points:spent', { 
        amount: reward.pointsCost, 
        reason: `Canje: ${reward.name}` 
      });
      eventBus.emit('ui:toast', {
        message: `¡Has canjeado ${reward.name}!`,
        type: 'success',
      });

      // Refresh data after short delay
      setTimeout(() => {
        setSelectedReward(null);
        setRedeemSuccess(false);
        onRedemptionComplete();
      }, 2000);
    } catch (error) {
      console.error('[v0] Redemption error:', error);
      eventBus.emit('reward:redeemError', { error: 'Error al canjear' });
      eventBus.emit('ui:toast', {
        message: 'Error al canjear. Intenta de nuevo.',
        type: 'error',
      });
    } finally {
      setIsRedeeming(false);
    }
  }, [user, availablePoints, onRedemptionComplete]);

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
        <div className="flex items-center justify-center w-10 h-10 bg-warning/20 rounded-xl">
          <GiftIcon size={24} className="text-warning" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recompensas</h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-primary">{availablePoints} pts</span> disponibles
          </p>
        </div>
      </header>

      {/* Available Rewards Section */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          Canjear Ahora
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          {rewards.filter(r => r.isActive && r.stock > 0).map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              canAfford={availablePoints >= reward.pointsCost}
              onSelect={() => setSelectedReward(reward)}
            />
          ))}
        </div>

        {rewards.filter(r => r.isActive && r.stock > 0).length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No hay recompensas disponibles en este momento
          </div>
        )}
      </section>

      {/* Redemption History Section */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          Historial de Canjes
        </h2>
        
        {redemptionHistory.length > 0 ? (
          <div className="space-y-3">
            {redemptionHistory.slice(0, 5).map((redemption) => (
              <HistoryItem key={redemption.id} redemption={redemption} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                Aun no has canjeado ninguna recompensa
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Redemption Modal */}
      {selectedReward && (
        <RedeemModal
          reward={selectedReward}
          canAfford={availablePoints >= selectedReward.pointsCost}
          isRedeeming={isRedeeming}
          redeemSuccess={redeemSuccess}
          onConfirm={() => handleRedeem(selectedReward)}
          onClose={() => {
            setSelectedReward(null);
            setRedeemSuccess(false);
          }}
        />
      )}
    </div>
  );
}

// =====================================================
// REWARD CARD COMPONENT
// =====================================================

interface RewardCardProps {
  reward: Reward;
  canAfford: boolean;
  onSelect: () => void;
}

function RewardCard({ reward, canAfford, onSelect }: RewardCardProps) {
  const emoji = REWARD_EMOJIS[reward.name] || '🎁';

  return (
    <Card 
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md',
        !canAfford && 'opacity-60'
      )}
      onClick={onSelect}
    >
      <CardContent className="p-4 flex flex-col items-center text-center">
        {/* Emoji placeholder for image */}
        <div className="text-4xl mb-3">{emoji}</div>
        
        {/* Name */}
        <h3 className="font-semibold text-foreground text-sm line-clamp-2">
          {reward.name}
        </h3>
        
        {/* Points cost */}
        <p className={cn(
          'text-lg font-bold mt-2',
          canAfford ? 'text-primary' : 'text-muted-foreground'
        )}>
          {reward.pointsCost} pts
        </p>
        
        {/* Stock indicator */}
        <p className="text-xs text-muted-foreground mt-1">
          Stock: {reward.stock} unid.
        </p>
        
        {/* Redeem button */}
        <Button
          size="sm"
          disabled={!canAfford}
          className={cn(
            'mt-3 w-full rounded-lg',
            canAfford 
              ? 'bg-primary hover:bg-primary/90' 
              : 'bg-muted text-muted-foreground'
          )}
        >
          Canjear
        </Button>
      </CardContent>
    </Card>
  );
}

// =====================================================
// HISTORY ITEM COMPONENT
// =====================================================

interface HistoryItemProps {
  redemption: RedemptionWithDetails;
}

function HistoryItem({ redemption }: HistoryItemProps) {
  const emoji = REWARD_EMOJIS[redemption.reward?.name || ''] || '🎁';
  const date = new Date(redemption.redeemedAt).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-3 flex items-center gap-3">
        <div className="text-2xl">{emoji}</div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">
            {redemption.reward?.name || 'Recompensa'}
          </p>
          <p className="text-xs text-muted-foreground">{date}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-destructive">
            -{redemption.pointsSpent} pts
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// =====================================================
// REDEEM MODAL COMPONENT
// =====================================================

interface RedeemModalProps {
  reward: Reward;
  canAfford: boolean;
  isRedeeming: boolean;
  redeemSuccess: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

function RedeemModal({
  reward,
  canAfford,
  isRedeeming,
  redeemSuccess,
  onConfirm,
  onClose,
}: RedeemModalProps) {
  const emoji = REWARD_EMOJIS[reward.name] || '🎁';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-card rounded-t-3xl p-6 pb-8 safe-bottom animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {redeemSuccess ? (
          // Success state
          <div className="text-center py-4">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-success/20 rounded-full mb-4">
              <CheckCircleIcon size={40} className="text-success" />
            </div>
            <h3 className="text-xl font-bold text-foreground">¡Canjeado!</h3>
            <p className="text-muted-foreground mt-2">
              Presenta este canje en el punto autorizado
            </p>
          </div>
        ) : (
          // Confirmation state
          <>
            <div className="text-center">
              <div className="text-5xl mb-4">{emoji}</div>
              <h3 className="text-xl font-bold text-foreground">{reward.name}</h3>
              {reward.description && (
                <p className="text-muted-foreground mt-2">{reward.description}</p>
              )}
              <p className="text-2xl font-bold text-primary mt-4">
                {reward.pointsCost} pts
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 h-12 rounded-xl"
                disabled={isRedeeming}
              >
                Cancelar
              </Button>
              <Button
                onClick={onConfirm}
                className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90"
                disabled={!canAfford || isRedeeming}
              >
                {isRedeeming ? 'Canjeando...' : 'Confirmar canje'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
