// Web Vitals Monitoring
// Enterprise-grade performance monitoring following Vercel/Stripe patterns
// Tracks Core Web Vitals and sends to analytics for monitoring

import { Metric, onCLS, onFID, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';

// Web Vitals thresholds (following Google standards)
const VITAL_THRESHOLDS = {
  CLS: { good: 0.1, needsImprovement: 0.25 }, // Cumulative Layout Shift
  FID: { good: 100, needsImprovement: 300 }, // First Input Delay
  FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint
  TTFB: { good: 800, needsImprovement: 1800 }, // Time to First Byte
  INP: { good: 200, needsImprovement: 500 }, // Interaction to Next Paint
};

interface WebVitalsReport {
  cls?: number;
  fid?: number;
  fcp?: number;
  lcp?: number;
  ttfb?: number;
  inp?: number;
  timestamp: number;
  url: string;
  userAgent: string;
}

/**
 * Rate Web Vital score
 * @param value - The metric value
 * @param thresholds - Good and needs improvement thresholds
 * @returns 'good' | 'needs-improvement' | 'poor'
 */
function rateVital(value: number, thresholds: { good: number; needsImprovement: number }): 'good' | 'needs-improvement' | 'poor' {
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * Send Web Vitals to analytics endpoint
 * In production, this would send to your analytics service
 */
async function sendToAnalytics(metric: Metric) {
  const payload = {
    name: metric.name,
    value: metric.value,
    rating: rateVital(
      metric.value,
      VITAL_THRESHOLDS[metric.name as keyof typeof VITAL_THRESHOLDS] || { good: 0, needsImprovement: 0 }
    ),
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    // Custom attributes
    isMobile: /Mobile|Android|iPhone/i.test(navigator.userAgent),
    connectionType: (navigator as any).connection?.effectiveType || 'unknown',
    deviceMemory: (navigator as any).deviceMemory || 0,
  };

  // In development, log to console
  if (import.meta.env.DEV) {
    console.log('Web Vital:', payload);
  }

  // In production, send to analytics endpoint
  if (import.meta.env.PROD) {
    try {
      // Send to your analytics service
      // This could be Google Analytics, Vercel Analytics, or a custom endpoint
      await fetch('/api/web-vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true, // Ensure request completes even if page unloads
      });
    } catch (error) {
      console.error('Failed to send web vitals:', error);
    }
  }
}

/**
 * Report Web Vitals to console and analytics
 */
function reportWebVitals(metric: Metric) {
  // Send to analytics
  sendToAnalytics(metric);

  // Log warning for poor performance
  const rating = rateVital(
    metric.value,
    VITAL_THRESHOLDS[metric.name as keyof typeof VITAL_THRESHOLDS] || { good: 0, needsImprovement: 0 }
  );

  if (rating === 'poor') {
    console.warn(`Poor ${metric.name}: ${metric.value.toFixed(2)}`, metric);
  }
}

/**
 * Initialize Web Vitals monitoring
 * Call this in your app initialization
 */
export function initWebVitalsMonitoring() {
  if (typeof window === 'undefined') return;

  // Core Web Vitals
  onCLS(reportWebVitals);
  onFID(reportWebVitals);
  onFCP(reportWebVitals);
  onLCP(reportWebVitals);
  onTTFB(reportWebVitals);
  onINP(reportWebVitals);

  // Report initial load time
  window.addEventListener('load', () => {
    const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
    console.log(`Page load time: ${loadTime}ms`);
  });
}

/**
 * Get current Web Vitals report
 * Useful for debugging and manual reporting
 */
export function getWebVitalsReport(): WebVitalsReport {
  return {
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  };
}

/**
 * Web Vitals monitoring component
 * React component for real-time performance monitoring
 */
export function WebVitalsMonitor() {
  if (import.meta.env.DEV) {
    return (
      <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-xs z-50">
        <div className="font-bold mb-2">Web Vitals (Dev Only)</div>
        <div className="space-y-1">
          <div>CLS: <span className="text-green-400">Monitoring</span></div>
          <div>FID: <span className="text-green-400">Monitoring</span></div>
          <div>LCP: <span className="text-green-400">Monitoring</span></div>
          <div>FCP: <span className="text-green-400">Monitoring</span></div>
          <div>TTFB: <span className="text-green-400">Monitoring</span></div>
          <div>INP: <span className="text-green-400">Monitoring</span></div>
        </div>
      </div>
    );
  }
  return null;
}

/**
 * Custom hook for Web Vitals monitoring
 */
export function useWebVitals() {
  if (typeof window !== 'undefined') {
    initWebVitalsMonitoring();
  }

  return {
    reportVital: sendToAnalytics,
    getReport: getWebVitalsReport,
  };
}

/**
 * Performance monitoring utilities
 */
export const perfUtils = {
  /**
   * Measure custom performance mark
   */
  mark(name: string) {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(name);
    }
  },

  /**
   * Measure custom performance measure
   */
  measure(name: string, startMark: string, endMark: string) {
    if (typeof window !== 'undefined' && window.performance) {
      try {
        window.performance.measure(name, startMark, endMark);
        const measure = window.performance.getEntriesByName(name)[0] as PerformanceMeasure;
        console.log(`Performance [${name}]: ${measure.duration.toFixed(2)}ms`);
        return measure.duration;
      } catch (error) {
        console.error('Performance measure error:', error);
        return 0;
      }
    }
    return 0;
  },

  /**
   * Get resource timing data
   */
  getResourceTiming(): PerformanceResourceTiming[] {
    if (typeof window !== 'undefined' && window.performance) {
      return window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    }
    return [];
  },

  /**
   * Get navigation timing data
   */
  getNavigationTiming(): PerformanceNavigationTiming | null {
    if (typeof window !== 'undefined' && window.performance) {
      const entries = window.performance.getEntriesByType('navigation');
      return entries[0] as PerformanceNavigationTiming || null;
    }
    return null;
  },

  /**
   * Analyze slow resources
   */
  analyzeSlowResources(thresholdMs: number = 1000) {
    const resources = this.getResourceTiming();
    const slowResources = resources.filter(r => r.duration > thresholdMs);
    
    if (slowResources.length > 0) {
      console.warn('Slow resources detected:', slowResources.map(r => ({
        name: r.name,
        duration: `${r.duration.toFixed(0)}ms`,
        size: `${(r.transferSize / 1024).toFixed(0)}KB`,
      })));
    }
    
    return slowResources;
  },
};