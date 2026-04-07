import { SessionEvent, AccountSignals } from '../types/index.js'
import { store } from './store.js'

export function processEvent(event: SessionEvent): 'accepted' | 'duplicate' {
  if (store.seenEventIds.has(event.event_id)) {
    return 'duplicate'
  }

  store.seenEventIds.set(event.event_id, true)

  let signals = store.accountSignals.get(event.account_id)

  if (!signals) {
    const timestamp = new Date(event.timestamp)
    signals = {
      account_id: event.account_id,
      event_count: 0,
      distinct_sessions: new Set<string>(),
      distinct_fingerprints: new Set<string>(),
      distinct_screens: new Set<string>(),
      distinct_ip_prefixes: new Set<string>(),
      first_seen: timestamp,
      last_seen: timestamp
    }
    store.accountSignals.set(event.account_id, signals)
  }

  signals.event_count++
  signals.distinct_sessions.add(event.session_id)
  signals.distinct_fingerprints.add(event.device.fingerprint)

  if (event.device.screen) {
    signals.distinct_screens.add(event.device.screen)
  }

  let ipPrefix = event.network.ip
  if (event.network.ip.includes('.')) {
    const parts = event.network.ip.split('.')
    if (parts.length === 4) {
      ipPrefix = `${parts[0]}.${parts[1]}.${parts[2]}.0/24`
    }
  }
  signals.distinct_ip_prefixes.add(ipPrefix)

  const eventTime = new Date(event.timestamp)
  if (eventTime < signals.first_seen) {
    signals.first_seen = eventTime
  }
  if (eventTime > signals.last_seen) {
    signals.last_seen = eventTime
  }

  return 'accepted'
}

export function getSignals(accountId: string): AccountSignals | undefined {
  return store.accountSignals.get(accountId)
}
