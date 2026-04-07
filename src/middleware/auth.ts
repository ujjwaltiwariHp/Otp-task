import { FastifyRequest, FastifyReply } from 'fastify'

export async function verifyApiKey(request: FastifyRequest, reply: FastifyReply) {
  const apiKey = process.env.INGEST_API_KEY
  const headerKey = request.headers['x-api-key']

  if (!headerKey || headerKey !== apiKey) {
    reply.code(401).send({ error: 'unauthorized', message: 'Invalid or missing API key' })
    return
  }
}
