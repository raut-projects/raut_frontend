import { Activity } from "lucide-react";

import ComingSoon from "@/components/ComingSoon";

export default function SystemHealthPage() {
  return (
    <ComingSoon
      icon={ Activity }
      title="System Health"
      description="Monitor service availability, performance, and background jobs."
    />
  );
}
