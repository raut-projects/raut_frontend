import { SystemHealthTabs } from "@/components/systemHealth/SystemHealthTabs";

export default function SystemHealthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <SystemHealthTabs />
      {children}
    </div>
  );
}
