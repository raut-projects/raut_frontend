'use client'

import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'sidebarCollapsed'

const listeners = new Set<() => void>()

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  window.addEventListener('storage', listener)

  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', listener)
  }
}

const getSnapshot = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

const getServerSnapshot = () => false

export function useSidebarCollapsed() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export function setSidebarCollapsed(value: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {}

  listeners.forEach((listener) => listener())
}
