import fastify from 'fastify'
import helmet from '@fastify/helmet'
import cors from '@fastify/cors'
import { eventRoutes } from './routes/events.js'
import { signalRoutes } from './routes/signals.js'
import { riskRoutes } from './routes/risk.js'
import { challengeRoutes } from './routes/challenge.js'

export async function buildApp() {
  const app = fastify({ logger: true })

  await app.register(helmet)
  await app.register(cors, { origin: '*' })

  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  await app.register(eventRoutes)
  await app.register(signalRoutes)
  await app.register(riskRoutes)
  await app.register(challengeRoutes)

  app.setErrorHandler((error, request, reply) => {
    if (error.validation) {
      return reply.code(400).send({
        error: 'invalid_request',
        message: error.message
      })
    }

    app.log.error(error)
    return reply.code(500).send({
      error: 'internal_error',
      message: 'Internal server error'
    })
  })

  return app
}
