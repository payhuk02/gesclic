// Rate Limit Hook
// Enterprise-grade rate limiting for client-side API calls
// Follows Stripe/Vercel patterns for API rate limiting

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RateLimitConfig {
  limitType: 'auth' | 'api' | 'sensitive';
  onRateLimit?: (retryAfter: number) => void;
}

interface RateLimitState {
  canProceed: boolean;
  remaining: number;
  reset: number;
  isLoading: boolean;
}

export function useRateLimit(config: RateLimitConfig) {
  const [state, setState] = useState<RateLimitState>({
    canProceed: true,
    remaining: 100,
    reset: Date.now() + 60000,
    isLoading: false
  });

  const checkRateLimit = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const { data, error } = await supabase.functions.invoke('rate-limiter', {
        body: { limitType: config.limitType }
      });

      if (error) throw error;

      const result = data as {
        success: boolean;
        limit: number;
        remaining: number;
        reset: number;
        retryAfter?: number;
      };

      setState({
        canProceed: result.success,
        remaining: result.remaining,
        reset: result.reset,
        isLoading: false
      });

      if (!result.success && result.retryAfter && config.onRateLimit) {
        config.onRateLimit(result.retryAfter);
      }

      return result.success;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Fail open - allow request if rate limiter fails
      setState(prev => ({ ...prev, isLoading: false, canProceed: true }));
      return true;
    }
  }, [config.limitType, config.onRateLimit]);

  const executeWithRateLimit = useCallback(async <T,>(
    fn: () => Promise<T>
  ): Promise<T | null> => {
    const canProceed = await checkRateLimit();
    
    if (!canProceed) {
      return null;
    }

    try {
      return await fn();
    } catch (error) {
      throw error;
    }
  }, [checkRateLimit]);

  return {
    ...state,
    checkRateLimit,
    executeWithRateLimit
  };
}

// Higher-order function for automatic rate limiting
export function withRateLimit<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  config: RateLimitConfig
) {
  return async (...args: T): Promise<R | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('rate-limiter', {
        body: { limitType: config.limitType }
      });

      if (error) throw error;

      const result = data as {
        success: boolean;
        limit: number;
        remaining: number;
        reset: number;
        retryAfter?: number;
      };

      if (!result.success) {
        if (result.retryAfter && config.onRateLimit) {
          config.onRateLimit(result.retryAfter);
        }
        return null;
      }

      return await fn(...args);
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Fail open
      return await fn(...args);
    }
  };
}