import SupportTicketDetail from "@/components/SupportTicketDetail";
import { createSupportTickets } from "@/lib/supportTickets";

export function generateStaticParams() {
  return createSupportTickets().map((ticket) => ({ id: ticket.id }));
}

export default async function SupportTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <SupportTicketDetail ticketId={id} />;
}
