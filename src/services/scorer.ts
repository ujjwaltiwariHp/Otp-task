import { AccountSignals, RiskResult, RiskBreakdown } from '../types/index.js'

export function computeRisk(signals: AccountSignals): RiskResult {
  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max)

  const fingerprint_score = clamp((signals.distinct_fingerprints.size - 1) / 4, 0, 1)
  const fingerprint_weight = 0.40
  const fingerprint_factor = fingerprint_score * fingerprint_weight

  const ip_score = clamp((signals.distinct_ip_prefixes.size - 1) / 4, 0, 1)
  const ip_weight = 0.35
  const ip_factor = ip_score * ip_weight

  const timeSpanMs = signals.last_seen.getTime() - signals.first_seen.getTime()
  const timeSpanHours = Math.max(timeSpanMs / 3_600_000, 1)
  const sessionsPerHour = signals.distinct_sessions.size / timeSpanHours
  const session_velocity_score = clamp((sessionsPerHour - 1) / 9, 0, 1)
  const session_velocity_weight = 0.25
  const session_velocity_factor = session_velocity_score * session_velocity_weight

  const raw_risk_score = fingerprint_factor + ip_factor + session_velocity_factor
  const risk_score = Number(clamp(raw_risk_score, 0.0, 1.0).toFixed(2))

  let recommendation: 'allow' | 'challenge' | 'block'
  if (risk_score < 0.35) {
    recommendation = 'allow'
  } else if (risk_score < 0.65) {
    recommendation = 'challenge'
  } else {
    recommendation = 'block'
  }

  const breakdown: RiskBreakdown = {
    fingerprint_factor: Number(fingerprint_factor.toFixed(4)),
    ip_factor: Number(ip_factor.toFixed(4)),
    session_velocity_factor: Number(session_velocity_factor.toFixed(4))
  }

  return {
    account_id: signals.account_id,
    risk_score,
    breakdown,
    recommendation
  }
}
