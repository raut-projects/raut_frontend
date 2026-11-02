import { Megaphone } from "lucide-react";

import ComingSoon from "@/components/ComingSoon";

export default function PromotionsPage() {
  return (
    <ComingSoon
      icon={Megaphone}
      title="Promotions"
      description="Create and manage rider promotions, discounts, and campaigns."
    />
  );
}
