export interface SessionEvent {
  event_id: string
  account_id: string
  session_id: string
  timestamp: string
  client: { surface: string; sdk_version?: string }
  device: { fingerprint: string; screen?: string; timezone?: string; locale?: string }
  network: { ip: string }
}

export interface AccountSignals {
  account_id: string
  event_count: number
  distinct_sessions: Set<string>
  distinct_fingerprints: Set<string>
  distinct_screens: Set<string>
  distinct_ip_prefixes: Set<string>
  first_seen: Date
  last_seen: Date
}

export interface Challenge {
  challenge_id: string
  account_id: string
  session_id: string
  code: string
  expires_at: Date
  attempts_remaining: number
  invalidated: boolean
}

export interface RiskBreakdown {
  fingerprint_factor: number
  ip_factor: number
  session_velocity_factor: number
}

export interface RiskResult {
  account_id: string
  risk_score: number
  breakdown: RiskBreakdown
  recommendation: 'allow' | 'challenge' | 'block'
}
