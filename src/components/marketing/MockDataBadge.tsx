import { FlaskConical } from "lucide-react";

import { MARKETING_USES_MOCK_DATA } from "@/lib/mockMarketing";

export function MockDataBadge() {
  if (!MARKETING_USES_MOCK_DATA) return null;

  return (
    <span
      title="Showing built-in sample data until the marketing API is available."
      className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700"
    >
      <FlaskConical className="size-3" aria-hidden="true" />
      Sample data
    </span>
  );
}
