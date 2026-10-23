import { useSyncExternalStore } from 'react'
import { getSessionSnapshot, subscribeSession } from '../services/tokenStore.js'

export function useSession() {
  return useSyncExternalStore(subscribeSession, getSessionSnapshot, getSessionSnapshot)
}
