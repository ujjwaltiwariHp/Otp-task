import { FastifyPluginAsync } from 'fastify'
import { verifyApiKey } from '../middleware/auth.js'
import { createRateLimiter } from '../middleware/rateLimit.js'
import { createChallenge, verifyChallenge } from '../services/otp.js'

export const challengeRoutes: FastifyPluginAsync = async (fastify) => {
  // Route 1: POST /v1/challenge
  fastify.post<{ Body: { account_id: string; session_id: string; email?: string } }>('/v1/challenge', {
    schema: {
      body: {
        type: 'object',
        required: ['account_id', 'session_id'],
        properties: {
          account_id: { type: 'string' },
          session_id: { type: 'string' },
          email: { type: 'string' }
        }
      }
    },
    preHandler: [verifyApiKey, createRateLimiter(20, 60_000)]
  }, async (request, reply) => {
    const { account_id, session_id } = request.body
    const challenge = createChallenge(account_id, session_id)
    
    return reply.code(201).send({
      challenge_id: challenge.challenge_id,
      expires_at: challenge.expires_at.toISOString(),
      attempts_remaining: challenge.attempts_remaining,
      code: challenge.code
    })
  })

  // Route 2: POST /v1/challenge/verify
  fastify.post<{ Body: { challenge_id: string; code: string } }>('/v1/challenge/verify', {
    schema: {
      body: {
        type: 'object',
        required: ['challenge_id', 'code'],
        properties: {
          challenge_id: { type: 'string' },
          code: { type: 'string', pattern: '^[0-9]{6}$' }
        }
      }
    },
    preHandler: [verifyApiKey, createRateLimiter(20, 60_000)]
  }, async (request, reply) => {
    const { challenge_id, code } = request.body
    const result = verifyChallenge(challenge_id, code)
    
    switch (result.status) {
      case 'verified':
        return reply.code(200).send({
          verified: true,
          account_id: result.challenge.account_id,
          session_id: result.challenge.session_id
        })
      case 'invalid_code':
        return reply.code(400).send({
          error: 'invalid_code',
          message: `Incorrect code. ${result.attemptsRemaining} attempts remaining.`
        })
      case 'expired':
        return reply.code(400).send({
          error: 'challenge_expired',
          message: 'This challenge has expired'
        })
      case 'exhausted':
        return reply.code(400).send({
          error: 'attempts_exhausted',
          message: 'Maximum verification attempts exceeded'
        })
      case 'not_found':
        return reply.code(404).send({
          error: 'not_found',
          message: 'Challenge not found'
        })
    }
  })
}
