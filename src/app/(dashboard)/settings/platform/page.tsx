import { SlidersHorizontal } from "lucide-react";

import ComingSoon from "@/components/ComingSoon";

export default function PlatformConfigPage() {
  return (
    <ComingSoon
      icon={ SlidersHorizontal }
      title="Platform Config"
      description="Configure platform-wide settings, fees, and service rules."
    />
  );
}
