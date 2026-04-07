import { describe, it, expect, beforeEach } from 'vitest'
import { createChallenge, verifyChallenge } from '../src/services/otp.js'
import { store } from '../src/services/store.js'

describe('OTP Service', () => {
  beforeEach(() => {
    store.challenges.clear()
  })

  it('should create a valid 6-digit challenge', () => {
    const challenge = createChallenge('user1', 'session1')
    expect(challenge.code).toMatch(/^[0-9]{6}$/)
    expect(challenge.attempts_remaining).toBe(3)
    expect(challenge.invalidated).toBe(false)
  })

  it('should verify with correct code', () => {
    const challenge = createChallenge('user1', 'session1')
    const result = verifyChallenge(challenge.challenge_id, challenge.code)
    expect(result.status).toBe('verified')
  })

  it('should exhaust after 3 wrong attempts', () => {
    const challenge = createChallenge('user1', 'session1')
    verifyChallenge(challenge.challenge_id, '000000') // attempt 1
    verifyChallenge(challenge.challenge_id, '000000') // attempt 2
    const result = verifyChallenge(challenge.challenge_id, '000000') // attempt 3
    
    expect(result.status).toBe('exhausted')
    const stored = store.challenges.get(challenge.challenge_id)
    expect(stored?.invalidated).toBe(true)
  })

  it('should handle expired challenges', () => {
    const challenge = createChallenge('user1', 'session1')
    challenge.expires_at = new Date(Date.now() - 1000) // Manually expire

    const result = verifyChallenge(challenge.challenge_id, challenge.code)
    expect(result.status).toBe('expired')
  })

  it('should return not_found for unknown ids', () => {
    const result = verifyChallenge('unknown-id', '000000')
    expect(result.status).toBe('not_found')
  })
})
