import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const typeStyles = {
  info: {
    circle: "bg-brand-100 text-brand-600",
    icon: "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75",
  },
  success: {
    circle: "bg-emerald-100 text-emerald-600",
    icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  warning: {
    circle: "bg-amber-100 text-amber-600",
    icon: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z",
  },
  error: {
    circle: "bg-rose-100 text-rose-600",
    icon: "M12 9v3.75m0 3.75h.008v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
};

function NotificationPanel({
  open,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDismiss,
}) {
  const navigate = useNavigate();
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleClick = (n) => {
    onMarkRead(n.id);
    if (n.to) {
      navigate(n.to);
      onClose();
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-96 max-w-full flex-col border-l border-slate-200 bg-white transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Notifications
          </h2>
          {unreadCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
              {unreadCount} new
            </span>
          )}
          <div className="ml-auto flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="rounded-lg px-2 py-1 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                Mark all as read
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close notifications"
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {notifications.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
              <svg
                className="h-8 w-8 text-slate-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                />
              </svg>
              <p className="text-sm font-medium text-slate-700">
                No notifications
              </p>
              <p className="text-xs text-slate-500">You're all caught up.</p>
            </div>
          )}

          {notifications.map((n) => {
            const style = typeStyles[n.type] ?? typeStyles.info;
            return (
              <div
                key={n.id}
                className={`group relative flex gap-3 px-5 py-4 transition-colors ${
                  n.read
                    ? "hover:bg-slate-50"
                    : "bg-brand-50/50 hover:bg-brand-50"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.circle}`}
                >
                  <svg
                    className="h-4.5 w-4.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={style.icon}
                    />
                  </svg>
                </span>

                <button
                  type="button"
                  onClick={() => handleClick(n)}
                  className="min-w-0 flex-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                >
                  <p
                    className={`text-sm text-slate-800 ${n.read ? "" : "font-semibold"}`}
                  >
                    {n.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                    {n.message}
                  </p>
                  <p className="mt-1.5 text-xs text-slate-400">{n.time}</p>
                </button>

                <div className="flex shrink-0 flex-col items-center gap-2 pt-0.5">
                  {!n.read && (
                    <span
                      className="h-2 w-2 rounded-full bg-brand-500"
                      aria-label="Unread"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => onDismiss(n.id)}
                    aria-label={`Dismiss: ${n.title}`}
                    className="rounded-md p-1 text-slate-400 opacity-0 transition-all hover:bg-slate-100 hover:text-slate-600 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 group-hover:opacity-100"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}

export default NotificationPanel;
