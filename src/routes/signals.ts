import { FastifyPluginAsync } from 'fastify'
import { verifyApiKey } from '../middleware/auth.js'
import { getSignals } from '../services/aggregator.js'

export const signalRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Params: { account_id: string } }>('/v1/accounts/:account_id/signals', {
    preHandler: [verifyApiKey]
  }, async (request, reply) => {
    const signals = getSignals(request.params.account_id)
    
    if (!signals) {
      return reply.code(404).send({ error: 'not_found', message: 'Account not found' })
    }
    
    return reply.code(200).send({
      account_id: signals.account_id,
      event_count: signals.event_count,
      distinct_sessions: signals.distinct_sessions.size,
      distinct_fingerprints: signals.distinct_fingerprints.size,
      distinct_screens: signals.distinct_screens.size,
      distinct_ip_prefixes: signals.distinct_ip_prefixes.size,
      first_seen: signals.first_seen.toISOString(),
      last_seen: signals.last_seen.toISOString()
    })
  })
}
