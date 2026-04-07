import { FastifyPluginAsync } from 'fastify'
import { verifyApiKey } from '../middleware/auth.js'
import { createRateLimiter } from '../middleware/rateLimit.js'
import { processEvent } from '../services/aggregator.js'
import { SessionEvent } from '../types/index.js'

export const eventRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: { events: SessionEvent[] } }>('/v1/events', {
    schema: {
      body: {
        type: 'object',
        required: ['events'],
        properties: {
          events: {
            type: 'array',
            minItems: 1,
            maxItems: 100,
            items: {
              type: 'object',
              required: ['event_id', 'account_id', 'session_id', 'timestamp', 'client', 'device', 'network'],
              properties: {
                event_id: { type: 'string' },
                account_id: { type: 'string' },
                session_id: { type: 'string' },
                timestamp: { type: 'string' },
                client: {
                  type: 'object',
                  required: ['surface'],
                  properties: {
                    surface: { type: 'string' },
                    sdk_version: { type: 'string' }
                  }
                },
                device: {
                  type: 'object',
                  required: ['fingerprint'],
                  properties: {
                    fingerprint: { type: 'string' },
                    screen: { type: 'string' },
                    timezone: { type: 'string' },
                    locale: { type: 'string' }
                  }
                },
                network: {
                  type: 'object',
                  required: ['ip'],
                  properties: {
                    ip: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    preHandler: [verifyApiKey, createRateLimiter(100, 60_000)]
  }, async (request, reply) => {
    let accepted = 0
    let duplicates = 0
    
    for (const event of request.body.events) {
      const result = processEvent(event)
      if (result === 'accepted') {
        accepted++
      } else {
        duplicates++
      }
    }
    
    return reply.code(200).send({ accepted, duplicates, errors: [] })
  })
}
