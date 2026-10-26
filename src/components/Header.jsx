import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import NotificationPanel from './NotificationPanel.jsx'
import { useSession } from '../hooks/useSession.js'
import { useMarkNotificationRead, useNotifications } from '../hooks/useNotifications.js'

const titles = {
  '/': 'Dashboard',
  '/customers': 'Customers',
  '/drivers': 'Drivers',
  '/rides': 'Rides',
  '/routes': 'Routes',
  '/payouts': 'Payouts',
  '/settings': 'Settings',
}

function Header({ onMenuClick }) {
  const { pathname } = useLocation()
  const title = titles[pathname] ?? 'Raut'

  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [dismissed, setDismissed] = useState([])

  const session = useSession()
  const { data: fetchedNotifications } = useNotifications()
  const markRead = useMarkNotificationRead()

  const notifications = useMemo(
    () => (fetchedNotifications ?? []).filter((notification) => !dismissed.includes(notification.id)),
    [fetchedNotifications, dismissed],
  )

  const unreadCount = notifications.filter((notification) => !notification.read).length

  const handleMarkRead = (id) => {
    markRead.mutate(id)
  }

  const handleMarkAllRead = () => {
    notifications.filter((notification) => !notification.read).forEach((notification) => markRead.mutate(notification.id))
  }

  const handleDismiss = (id) => setDismissed((prev) => (prev.includes(id) ? prev : [...prev, id]))

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 lg:hidden"
        aria-label="Open sidebar"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      <h1 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h1>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <div className="relative hidden sm:block">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="search"
            placeholder="Search…"
            aria-label="Search"
            className="w-56 rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <button
          type="button"
          onClick={() => setNotificationsOpen(true)}
          className="cursor-pointer relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          aria-haspopup="dialog"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          {unreadCount > 0 && (
            <span
              className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white"
              aria-hidden="true"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
            {session?.initials ?? 'AD'}
          </span>
          <div className="hidden leading-tight md:block">
            <p className="text-sm font-semibold text-slate-800">{session?.name ?? 'Admin'}</p>
            <p className="text-xs text-slate-500">{session?.roleLabel ?? session?.role ?? 'Admin'}</p>
          </div>
        </div>
      </div>

      {createPortal(
        <NotificationPanel
          open={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          notifications={notifications}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
          onDismiss={handleDismiss}
        />,
        document.body
      )}
    </header>
  )
}

export default Header
