import { describe, it, expect } from 'vitest'
import { computeRisk } from '../src/services/scorer.js'
import { AccountSignals } from '../src/types/index.js'

describe('Risk Scorer', () => {
  it('should return near 0 risk for a clean account', () => {
    const now = new Date()
    const signals: AccountSignals = {
      account_id: 'clean-user',
      event_count: 1,
      distinct_sessions: new Set(['s1']),
      distinct_fingerprints: new Set(['f1']),
      distinct_screens: new Set(['1920x1080']),
      distinct_ip_prefixes: new Set(['1.2.3.0/24']),
      first_seen: now,
      last_seen: now
    }

    const result = computeRisk(signals)
    expect(result.risk_score).toBeLessThan(0.1)
    expect(result.recommendation).toBe('allow')
  })

  it('should return high risk for many fingerprints and IPs', () => {
    const now = new Date()
    const signals: AccountSignals = {
      account_id: 'bad-user',
      event_count: 5,
      distinct_sessions: new Set(['s1', 's2', 's3', 's4', 's5']),
      distinct_fingerprints: new Set(['f1', 'f2', 'f3', 'f4', 'f5']),
      distinct_screens: new Set(['1920x1080']),
      distinct_ip_prefixes: new Set(['1.1.1.0/24', '2.2.2.0/24', '3.3.3.0/24', '4.4.4.0/24', '5.5.5.0/24']),
      first_seen: now,
      last_seen: now
    }

    const result = computeRisk(signals)
    expect(result.risk_score).toBeGreaterThan(0.7)
    expect(result.recommendation).toBe('block')
  })

  it('should return challenge for moderate anomalies', () => {
    const now = new Date()
    const signals: AccountSignals = {
      account_id: 'risky-user',
      event_count: 3,
      distinct_sessions: new Set(['s1', 's2', 's3']),
      distinct_fingerprints: new Set(['f1', 'f2', 'f3']),
      distinct_screens: new Set(['1920x1080', '1440x900']),
      distinct_ip_prefixes: new Set(['1.1.1.0/24', '2.2.2.0/24', '3.3.3.0/24']),
      first_seen: now,
      last_seen: now
    }

    const result = computeRisk(signals)
    expect(result.recommendation).toBe('challenge')
  })
})
