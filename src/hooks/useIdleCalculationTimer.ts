/**
 * useIdleCalculationTimer Hook
 * 
 * Manages idle calculation timer to prevent unnecessary re-calculations.
 * Only triggers calculation if:
 * 1. Never calculated before, OR
 * 2. Last calculation was more than 1 hour ago
 * 
 * Features:
 * - localStorage persistence for calculation timestamps
 * - Idle state tracking
 * - Manual calculation trigger
 * - Countdown timer for next calculation
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface IdleCalculationState {
  shouldCalculate: boolean;
  lastCalculationTime: number | null;
  isIdle: boolean;
  timeUntilNextCalculation: number;
  markCalculationDone: () => void;
  forceCalculation: () => void;
  getCalculationStatus: () => 'never' | 'fresh' | 'idle' | 'stale';
}

const IDLE_THRESHOLD = 60 * 60 * 1000; // 1 hour in milliseconds
const STORAGE_KEY_PREFIX = 'followup_calculation_';

export const useIdleCalculationTimer = (): IdleCalculationState => {
  const { user } = useAuth();
  const [lastCalculationTime, setLastCalculationTime] = useState<number | null>(null);
  const [timeUntilNextCalculation, setTimeUntilNextCalculation] = useState<number>(0);
  const [isIdle, setIsIdle] = useState<boolean>(false);

  // Generate storage key based on user ID
  const getStorageKey = useCallback(() => {
    return `${STORAGE_KEY_PREFIX}${user?.id || 'anonymous'}`;
  }, [user?.id]);

  // Load last calculation time from localStorage
  useEffect(() => {
    if (!user?.id) return;

    const storageKey = getStorageKey();
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      const timestamp = parseInt(stored, 10);
      if (!isNaN(timestamp)) {
        setLastCalculationTime(timestamp);
      }
    }
  }, [user?.id, getStorageKey]);

  // Update idle state and countdown timer
  useEffect(() => {
    if (!lastCalculationTime) {
      setIsIdle(false);
      setTimeUntilNextCalculation(0);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const timeSinceLastCalculation = now - lastCalculationTime;
      const timeRemaining = IDLE_THRESHOLD - timeSinceLastCalculation;

      if (timeSinceLastCalculation >= IDLE_THRESHOLD) {
        setIsIdle(true);
        setTimeUntilNextCalculation(0);
      } else {
        setIsIdle(false);
        setTimeUntilNextCalculation(timeRemaining);
      }
    };

    // Update immediately
    updateTimer();

    // Update every minute
    const interval = setInterval(updateTimer, 60000);

    return () => clearInterval(interval);
  }, [lastCalculationTime]);

  // Determine if calculation should run
  const shouldCalculate = !lastCalculationTime || isIdle;

  // Mark calculation as done
  const markCalculationDone = useCallback(() => {
    const now = Date.now();
    setLastCalculationTime(now);
    
    if (user?.id) {
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, now.toString());
    }
  }, [user?.id, getStorageKey]);

  // Force calculation (bypass idle timer)
  const forceCalculation = useCallback(() => {
    setLastCalculationTime(null);
    
    if (user?.id) {
      const storageKey = getStorageKey();
      localStorage.removeItem(storageKey);
    }
  }, [user?.id, getStorageKey]);

  // Get human-readable calculation status
  const getCalculationStatus = useCallback((): 'never' | 'fresh' | 'idle' | 'stale' => {
    if (!lastCalculationTime) return 'never';
    
    const timeSinceLastCalculation = Date.now() - lastCalculationTime;
    
    if (timeSinceLastCalculation < 5 * 60 * 1000) { // Less than 5 minutes
      return 'fresh';
    } else if (timeSinceLastCalculation < IDLE_THRESHOLD) { // Less than 1 hour
      return 'idle';
    } else { // More than 1 hour
      return 'stale';
    }
  }, [lastCalculationTime]);

  return {
    shouldCalculate,
    lastCalculationTime,
    isIdle,
    timeUntilNextCalculation,
    markCalculationDone,
    forceCalculation,
    getCalculationStatus
  };
};