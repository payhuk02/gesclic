// Cookie Security Configuration
// Enterprise-grade cookie security following Stripe/Vercel patterns

type SameSite = 'strict' | 'lax' | 'none';

export const COOKIE_CONFIG = {
  // Session cookie configuration
  session: {
    name: 'gesclic-session',
    lifetime: 60 * 60 * 24 * 7, // 1 week in seconds
    domain: import.meta.env.PROD ? '.gesclic.com' : undefined,
    path: '/',
    sameSite: (import.meta.env.PROD ? 'strict' : 'lax') as SameSite,
    secure: import.meta.env.PROD,
    httpOnly: false, // Set to true for SSR
  },
  
  // CSRF protection
  csrf: {
    name: 'gesclic-csrf',
    lifetime: 60 * 60 * 24, // 1 day in seconds
    secure: import.meta.env.PROD,
    httpOnly: false,
    sameSite: 'strict' as SameSite,
  },
  
  // Consent cookies
  consent: {
    name: 'gesclic-consent',
    lifetime: 60 * 60 * 24 * 365, // 1 year in seconds
    secure: false,
    httpOnly: false,
    sameSite: 'lax' as SameSite,
  }
};

/**
 * Set secure cookie with proper attributes
 */
export function setSecureCookie(
  name: string,
  value: string,
  options: Partial<typeof COOKIE_CONFIG.session> = {}
): void {
  const config = { ...COOKIE_CONFIG.session, ...options };
  
  const cookieString = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${config.path}`,
    `Max-Age=${config.lifetime}`,
    config.domain && `Domain=${config.domain}`,
    config.secure && 'Secure',
    `SameSite=${config.sameSite}`,
    config.httpOnly && 'HttpOnly'
  ].filter(Boolean).join('; ');
  
  document.cookie = cookieString;
}

/**
 * Get cookie value
 */
export function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    return decodeURIComponent(parts.pop()?.split(';').shift() || '');
  }
  
  return null;
}

/**
 * Delete cookie
 */
export function deleteCookie(name: string, domain?: string): void {
  const cookieString = [
    `${name}=`,
    'Path=/',
    'Max-Age=0',
    domain && `Domain=${domain}`,
    'SameSite=strict'
  ].filter(Boolean).join('; ');
  
  document.cookie = cookieString;
}

/**
 * Validate cookie security settings
 */
export function validateCookieSecurity(): boolean {
  if (import.meta.env.PROD) {
    // In production, enforce strict security
    const sessionCookie = getCookie('gesclic-session');
    if (sessionCookie && !document.cookie.includes('Secure')) {
      console.warn('Session cookie missing Secure flag in production');
      return false;
    }
  }
  return true;
}