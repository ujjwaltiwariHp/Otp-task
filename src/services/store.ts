import { AccountSignals, Challenge } from '../types/index.js'

export const store = {
  seenEventIds: new Map<string, boolean>(),
  accountSignals: new Map<string, AccountSignals>(),
  challenges: new Map<string, Challenge>()
}
