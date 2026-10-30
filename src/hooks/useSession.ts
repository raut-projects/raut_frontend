import { useSyncExternalStore } from 'react'
import { getSessionSnapshot, subscribeSession } from '../services/tokenStore'

export function useSession() {
  return useSyncExternalStore(subscribeSession, getSessionSnapshot, getSessionSnapshot)
}
