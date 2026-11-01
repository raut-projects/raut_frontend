"use client";

import RequireAuth from "@/components/RequireAuth";
import RequestAdmin from "@/views/requestAdmin";

export default function Page() {
  return (
    <RequireAuth>
      <RequestAdmin />
    </RequireAuth>
  );
}
