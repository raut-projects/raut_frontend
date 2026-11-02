import { Users } from "lucide-react";

import ComingSoon from "@/components/ComingSoon";

export default function AdminUsersPage() {
  return (
    <ComingSoon
      icon={Users}
      title="Admin Users"
      description="Manage administrator accounts, roles, and access permissions."
    />
  );
}
