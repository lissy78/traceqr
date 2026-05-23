/**
 * =====================================================
 * TraceQR Event System
 * Custom event-driven architecture for modular communication
 * between components without tight coupling
 * =====================================================
 */

import type {
  User,
  ScanResult,
  Reward,
  Redemption,
  MobileNavTab
} from './types';

// =====================================================
// EVENT TYPES
// =====================================================

export type EventName =
  | 'auth:login'
  | 'auth:logout'
  | 'auth:register'
  | 'auth:profileUpdate'
  | 'scan:start'
  | 'scan:success'
  | 'scan:error'
  | 'scan:complete'
  | 'points:earned'
  | 'points:spent'
  | 'points:levelUp'
  | 'reward:redeem'
  | 'reward:redeemSuccess'
  | 'reward:redeemError'
  | 'nav:change'
  | 'nav:back'
  | 'ui:toast'
  | 'ui:modal:open'
  | 'ui:modal:close'
  | 'ui:loading:start'
  | 'ui:loading:end';

// =====================================================
// EVENT PAYLOADS
// =====================================================

export interface EventPayloads {
  'auth:login': { user: User };
  'auth:logout': undefined;
  'auth:register': { user: User };
  'auth:profileUpdate': { user: User };
  'scan:start': undefined;
  'scan:success': { result: ScanResult };
  'scan:error': { error: string };
  'scan:complete': undefined;
  'points:earned': { amount: number; reason: string };
  'points:spent': { amount: number; reason: string };
  'points:levelUp': { newLevel: string; previousLevel: string };
  'reward:redeem': { reward: Reward };
  'reward:redeemSuccess': { redemption: Redemption; reward: Reward };
  'reward:redeemError': { error: string };
  'nav:change': { tab: MobileNavTab };
  'nav:back': undefined;
  'ui:toast': {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
  };
  'ui:modal:open': { modalId: string; data?: unknown };
  'ui:modal:close': { modalId: string };
  'ui:loading:start': { loaderId?: string };
  'ui:loading:end': { loaderId?: string };
}

export type EventListener<T extends EventName> = (
  payload: EventPayloads[T]
) => void;

// =====================================================
// EVENT EMITTER CLASS
// =====================================================

class EventEmitter {
  private listeners: Map<EventName, Set<EventListener<EventName>>> = new Map();

  on<T extends EventName>(eventName: T, listener: EventListener<T>): () => void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    const set = this.listeners.get(eventName)!;
    set.add(listener as EventListener<EventName>);
    return () => {
      set.delete(listener as EventListener<EventName>);
      if (set.size === 0) this.listeners.delete(eventName);
    };
  }

  once<T extends EventName>(eventName: T, listener: EventListener<T>): void {
    const unsub = this.on(eventName, (payload) => {
      unsub();
      listener(payload as EventPayloads[T]);
    });
  }

  emit<T extends EventName>(eventName: T, payload: EventPayloads[T]): void {
    const set = this.listeners.get(eventName);
    if (set) {
      set.forEach((listener) => {
        try { listener(payload); } catch (e) {
          console.error(`[TraceQR Events] Error in listener for ${eventName}:`, e);
        }
      });
    }
  }

  /** Remove a specific listener, or all listeners for an event if no listener provided */
  off<T extends EventName>(eventName: T, listener?: EventListener<T>): void {
    if (listener) {
      this.listeners.get(eventName)?.delete(listener as EventListener<EventName>);
    } else {
      this.listeners.delete(eventName);
    }
  }

  clear(): void {
    this.listeners.clear();
  }

  listenerCount(eventName: EventName): number {
    return this.listeners.get(eventName)?.size ?? 0;
  }
}

// =====================================================
// SINGLETON INSTANCE
// =====================================================

export const eventBus = new EventEmitter();

/** Alias used by components — same instance as eventBus */
export const appEventEmitter = eventBus;

// =====================================================
// APP EVENT TYPE CONSTANTS
// =====================================================

export const AppEventType = {
  QR_SCANNED:      'scan:success'          as const,
  USER_LOGIN:      'auth:login'            as const,
  USER_LOGOUT:     'auth:logout'           as const,
  POINTS_EARNED:   'points:earned'         as const,
  REWARD_REDEEMED: 'reward:redeemSuccess'  as const,
} as const;

// =====================================================
// REACT HOOKS
// =====================================================

import { useEffect, useCallback } from 'react';

export function useEvent<T extends EventName>(
  eventName: T,
  handler: EventListener<T>
): void {
  const memoizedHandler = useCallback(handler, [handler]);
  useEffect(() => {
    return eventBus.on(eventName, memoizedHandler);
  }, [eventName, memoizedHandler]);
}

export function useEmit<T extends EventName>(
  eventName: T
): (payload: EventPayloads[T]) => void {
  return useCallback(
    (payload: EventPayloads[T]) => { eventBus.emit(eventName, payload); },
    [eventName]
  );
}
