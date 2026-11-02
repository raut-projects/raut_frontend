import { FileText } from "lucide-react";

import ComingSoon from "@/components/ComingSoon";

export default function AuditLogsPage() {
  return (
    <ComingSoon
      icon={FileText}
      title="Audit Logs"
      description="Review a history of administrative actions across the platform."
    />
  );
}
