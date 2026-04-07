import { FastifyRequest, FastifyReply } from 'fastify'

interface RateLimitInfo {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitInfo>()

export function createRateLimiter(limit: number, windowMs: number) {
  return async function rateLimitHandler(request: FastifyRequest, reply: FastifyReply) {
    const key = (request.headers['x-api-key'] as string) || request.ip
    const now = Date.now()
    
    let info = rateLimitStore.get(key)
    
    if (!info || now > info.resetAt) {
      info = {
        count: 0,
        resetAt: now + windowMs
      }
      rateLimitStore.set(key, info)
    }
    
    info.count++
    
    const remaining = Math.max(0, limit - info.count)
    const resetTime = Math.ceil(info.resetAt / 1000)
    
    reply.header('X-RateLimit-Limit', limit)
    reply.header('X-RateLimit-Remaining', remaining)
    reply.header('X-RateLimit-Reset', resetTime)
    
    if (info.count > limit) {
      const retryAfter = Math.ceil((info.resetAt - now) / 1000)
      reply.header('Retry-After', retryAfter)
      reply.code(429).send({ error: 'rate_limit_exceeded', message: 'Too many requests' })
      return
    }
  }
}

setInterval(() => {
  const now = Date.now()
  for (const [key, info] of rateLimitStore.entries()) {
    if (now > info.resetAt) {
      rateLimitStore.delete(key)
    }
  }
}, 60_000)
