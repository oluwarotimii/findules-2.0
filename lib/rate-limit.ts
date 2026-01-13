import { NextRequest } from 'next/server'

// Simple in-memory rate limiter (for production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  max: number // Max requests allowed per window
}

export function rateLimit(options: RateLimitOptions) {
  return {
    check: async (identifier: string) => {
      const now = Date.now()
      const windowStart = now - options.windowMs
      const record = rateLimitMap.get(identifier) || { count: 0, resetTime: now + options.windowMs }

      // Reset the counter if the window has passed
      if (record.resetTime <= now) {
        record.count = 0
        record.resetTime = now + options.windowMs
      }

      record.count++

      if (record.count > options.max) {
        // Rate limit exceeded
        return {
          allowed: false,
          resetTime: record.resetTime,
          remaining: 0,
          retryAfter: Math.ceil((record.resetTime - now) / 1000)
        }
      }

      rateLimitMap.set(identifier, record)

      return {
        allowed: true,
        resetTime: record.resetTime,
        remaining: options.max - record.count,
        retryAfter: 0
      }
    }
  }
}

// Rate limiter for login attempts (more restrictive)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // Limit each IP to 5 login attempts per window
})

// Rate limiter for general API requests
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // Limit each IP to 100 requests per window
})

// Rate limiter for user creation (to prevent spam)
export const userCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10 // Limit each IP to 10 user creations per window
})

// Helper function to get client IP
export function getClientIP(request: NextRequest): string {
  // Try different headers in order of preference
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) return realIP
  if (cfConnectingIP) return cfConnectingIP
  
  // Fallback to default
  return '127.0.0.1'
}
