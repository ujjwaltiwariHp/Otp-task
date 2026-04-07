import { Challenge } from '../types/index.js'
import { store } from './store.js'
import crypto from 'node:crypto'

export function createChallenge(accountId: string, sessionId: string): Challenge {
  const challenge_id = crypto.randomUUID()
  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0')
  const expires_at = new Date(Date.now() + 5 * 60 * 1000)
  
  const challenge: Challenge = {
    challenge_id,
    account_id: accountId,
    session_id: sessionId,
    code,
    expires_at,
    attempts_remaining: 3,
    invalidated: false
  }

  store.challenges.set(challenge_id, challenge)
  
  console.log(`[OTP] challenge_id=${challenge_id} account=${accountId} code=${code}`)
  
  return challenge
}

export type VerifyResult =
  | { status: 'verified'; challenge: Challenge }
  | { status: 'invalid_code'; attemptsRemaining: number }
  | { status: 'expired' }
  | { status: 'exhausted' }
  | { status: 'not_found' }

export function verifyChallenge(challengeId: string, code: string): VerifyResult {
  const challenge = store.challenges.get(challengeId)
  
  if (!challenge) {
    return { status: 'not_found' }
  }

  if (challenge.invalidated || challenge.attempts_remaining <= 0) {
    return { status: 'exhausted' }
  }

  if (new Date() > challenge.expires_at) {
    return { status: 'expired' }
  }

  challenge.attempts_remaining--

  if (code !== challenge.code) {
    if (challenge.attempts_remaining === 0) {
      challenge.invalidated = true
      return { status: 'exhausted' }
    }
    return { status: 'invalid_code', attemptsRemaining: challenge.attempts_remaining }
  }

  return { status: 'verified', challenge }
}

export function getChallenge(challengeId: string): Challenge | undefined {
  return store.challenges.get(challengeId)
}
