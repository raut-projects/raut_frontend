import { Map } from "lucide-react";

import ComingSoon from "@/components/ComingSoon";

export default function LiveRidesPage() {
  return (
    <ComingSoon
      icon={Map}
      title="Live Rides"
      description="Track active rides, driver locations, and trips happening right now."
    />
  );
}
