"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/settings/system-health", label: "Overview" },
  { href: "/settings/system-health/jobs", label: "Background Jobs" },
  { href: "/settings/system-health/incidents", label: "Recent Incidents" },
];

export function SystemHealthTabs() {
  const pathname = usePathname().replace(/\/+$/, "") || "/settings/system-health";

  return (
    <nav
      role="tablist"
      aria-label="System Health sections"
      className="flex overflow-x-auto border-b border-slate-200"
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            role="tab"
            aria-selected={active}
            aria-current={active ? "page" : undefined}
            className={`-mb-px shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
              active
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default SystemHealthTabs;
