import { type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ComingSoonProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export default function ComingSoon({
  title,
  description,
  icon: Icon,
}: ComingSoonProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {title}
          </h2>
          <Badge variant="secondary">Coming soon</Badge>
        </div>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            This section is being prepared and is not available yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <Icon className="size-6" />
            </span>
            <p className="max-w-md text-sm text-slate-500">
              The page and its data will appear here once the feature is ready.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
