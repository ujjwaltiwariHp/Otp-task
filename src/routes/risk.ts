import { FastifyPluginAsync } from 'fastify'
import { verifyApiKey } from '../middleware/auth.js'
import { getSignals } from '../services/aggregator.js'
import { computeRisk } from '../services/scorer.js'

export const riskRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Params: { account_id: string } }>('/v1/accounts/:account_id/risk', {
    preHandler: [verifyApiKey]
  }, async (request, reply) => {
    const signals = getSignals(request.params.account_id)
    
    if (!signals) {
      return reply.code(404).send({ error: 'not_found', message: 'Account not found' })
    }
    
    const riskResult = computeRisk(signals)
    return reply.code(200).send(riskResult)
  })
}
