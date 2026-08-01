// Rate Limiter Edge Function
// Enterprise-grade rate limiting following Stripe/Vercel patterns
// Implements token bucket algorithm with Redis-like in-memory storage

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Rate limit configuration
const RATE_LIMITS = {
  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    skipSuccessfulRequests: false
  },
  // API endpoints
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    skipSuccessfulRequests: true
  },
  // Sensitive operations
  sensitive: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    skipSuccessfulRequests: false
  }
}

// In-memory storage for rate limits (in production, use Redis)
const rateLimitStore = new Map<string, {
  count: number
  resetTime: number
  blocked: boolean
}>()

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

function getClientIdentifier(req: Request): string {
  // Priority: API key > User ID > IP address
  const apiKey = req.headers.get('x-api-key')
  if (apiKey) return `api:${apiKey}`
  
  const userId = req.headers.get('x-user-id')
  if (userId) return `user:${userId}`
  
  // Fallback to IP (from CF-Connecting-IP or X-Forwarded-For)
  const ip = req.headers.get('cf-connecting-ip') || 
             req.headers.get('x-forwarded-for')?.split(',')[0] || 
             'unknown'
  return `ip:${ip}`
}

function checkRateLimit(
  identifier: string,
  limitType: keyof typeof RATE_LIMITS
): RateLimitResult {
  const config = RATE_LIMITS[limitType]
  const now = Date.now()
  
  // Get or create rate limit entry
  let entry = rateLimitStore.get(identifier)
  
  if (!entry || now > entry.resetTime) {
    // Create new entry
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
      blocked: false
    }
    rateLimitStore.set(identifier, entry)
  }
  
  // Check if blocked
  if (entry.blocked) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000)
    }
  }
  
  // Increment counter
  entry.count++
  
  // Check if limit exceeded
  if (entry.count > config.maxRequests) {
    entry.blocked = true
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000)
    }
  }
  
  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    reset: entry.resetTime
  }
}

function cleanupExpiredEntries() {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Cleanup expired entries every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000)

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, x-api-key, x-user-id, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { limitType = 'api' } = await req.json()
    const identifier = getClientIdentifier(req)
    
    // Validate limit type
    if (!RATE_LIMITS[limitType as keyof typeof RATE_LIMITS]) {
      return new Response(
        JSON.stringify({ error: 'Invalid limit type' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    const result = checkRateLimit(identifier, limitType as keyof typeof RATE_LIMITS)
    
    // Log rate limit events
    if (!result.success) {
      console.log(`Rate limit exceeded for ${identifier} (${limitType})`)
    }
    
    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 429,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.reset.toString(),
          ...(result.retryAfter && { 'Retry-After': result.retryAfter.toString() })
        }
      }
    )
  } catch (error) {
    console.error('Rate limiter error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})