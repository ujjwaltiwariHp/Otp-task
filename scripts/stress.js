import autocannon from 'autocannon'
import 'dotenv/config'

const URL = 'http://localhost:8080'
const API_KEY = process.env.INGEST_API_KEY || 'sk_test_assignment_only_not_real'

async function runIngestStress() {
  console.log('--- Starting Ingest Stress Test (POST /v1/events) ---')
  const result = await autocannon({
    url: `${URL}/v1/events`,
    connections: 10,
    duration: 10,
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      events: [
        {
          event_id: 'stress_test_evt_' + Math.random(),
          account_id: 'user_stress',
          session_id: 'sess_stress',
          timestamp: new Date().toISOString(),
          client: { surface: 'web' },
          device: { fingerprint: 'f_stress' },
          network: { ip: '1.2.3.4' }
        }
      ]
    })
  })
  console.log(autocannon.printResult(result))
}

async function runRiskStress() {
  console.log('--- Starting Risk Lookup Stress Test (GET /v1/accounts/user_stress/risk) ---')
  const result = await autocannon({
    url: `${URL}/v1/accounts/user_stress/risk`,
    connections: 10,
    duration: 10,
    headers: {
      'x-api-key': API_KEY
    }
  })
  console.log(autocannon.printResult(result))
}

async function start() {
  await runIngestStress()
  await runRiskStress()
}

start().catch(console.error)
