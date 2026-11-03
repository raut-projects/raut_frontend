import { Bug, BadgeAlert } from "lucide-react";
import ComingSoon from "@/components/ComingSoon";

function CustomerIssues() {
  return (
    <ComingSoon
      icon={BadgeAlert}
      title="Customer Issues"
      description="Report and track customer issues in real-time."
    />
  );
}

export default CustomerIssues;
