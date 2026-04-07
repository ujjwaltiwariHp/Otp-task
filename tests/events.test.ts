import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildApp } from '../src/app.js'

describe('Events API', () => {
  let app: any

  beforeAll(async () => {
    process.env.INGEST_API_KEY = 'test-key'
    app = await buildApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should accept valid batch of events', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/events',
      headers: { 'x-api-key': 'test-key' },
      payload: {
        events: [
          {
            event_id: 'e1',
            account_id: 'a1',
            session_id: 's1',
            timestamp: new Date().toISOString(),
            client: { surface: 'web' },
            device: { fingerprint: 'f1' },
            network: { ip: '1.2.3.4' }
          },
          {
            event_id: 'e2',
            account_id: 'a1',
            session_id: 's1',
            timestamp: new Date().toISOString(),
            client: { surface: 'web' },
            device: { fingerprint: 'f1' },
            network: { ip: '1.2.3.4' }
          }
        ]
      }
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.accepted).toBe(2)
    expect(body.duplicates).toBe(0)
  })

  it('should handle duplicate event_id', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/events',
      headers: { 'x-api-key': 'test-key' },
      payload: {
        events: [
          {
            event_id: 'e1', // Duplicate from previous test
            account_id: 'a1',
            session_id: 's1',
            timestamp: new Date().toISOString(),
            client: { surface: 'web' },
            device: { fingerprint: 'f1' },
            network: { ip: '1.2.3.4' }
          }
        ]
      }
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.accepted).toBe(0)
    expect(body.duplicates).toBe(1)
  })

  it('should return 401 for missing API key', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/events',
      payload: {
        events: [
          {
            event_id: 'e_auth',
            account_id: 'a1',
            session_id: 's1',
            timestamp: new Date().toISOString(),
            client: { surface: 'web' },
            device: { fingerprint: 'f1' },
            network: { ip: '1.2.3.4' }
          }
        ]
      }
    })

    expect(response.statusCode).toBe(401)
  })

  it('should return 400 for invalid body', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/events',
      headers: { 'x-api-key': 'test-key' },
      payload: { events: [] } // Schema requires minItems: 1
    })

    expect(response.statusCode).toBe(400)
  })

  it('should return correct signals after ingestion', async () => {
     // Check signals for account 'a1'
     const response = await app.inject({
      method: 'GET',
      url: '/v1/accounts/a1/signals',
      headers: { 'x-api-key': 'test-key' }
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.event_count).toBe(2) // Only the 2 accepted ones
    expect(body.distinct_sessions).toBe(1)
    expect(body.distinct_fingerprints).toBe(1)
  })
})
