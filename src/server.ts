import 'dotenv/config'
import { buildApp } from './app.js'

async function start() {
  const app = await buildApp()
  const port = Number(process.env.PORT) || 8080

  try {
    await app.listen({ port, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }

  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM']
  for (const signal of signals) {
    process.on(signal, async () => {
      await app.close()
      process.exit(0)
    })
  }
}

start()
