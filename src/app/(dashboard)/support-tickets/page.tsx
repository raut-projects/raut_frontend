import { Ticket } from "lucide-react";

import ComingSoon from "@/components/ComingSoon";

export default function SupportTicketsPage() {
  return (
    <ComingSoon
      icon={Ticket}
      title="Support Tickets"
      description="Review and respond to rider and driver support requests."
    />
  );
}
