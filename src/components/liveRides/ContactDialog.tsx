"use client";

import type { LiveRide } from "@/lib/liveRides";
import { Phone, MessageCircle, PhoneOutgoing, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import SidePanel from "@/components/SidePanel";

type ContactDialogProps = {
  open: boolean;
  onClose: () => void;
  ride: LiveRide;
};

export default function ContactDialog({
  open,
  onClose,
  ride,
}: ContactDialogProps) {
  const driverPhone = ride.driver.phone;
  const customerPhones = ride.customers.map((c) => c.phone).filter(Boolean);

  const callDriver = () => { if (driverPhone) window.location.href = `tel:${driverPhone}`; };
  const smsDriver = () => { if (driverPhone) window.location.href = `sms:${driverPhone}`; };
  const callCustomers = () => { customerPhones.forEach((p) => { if (p) window.location.href = `tel:${p}`; }); };
  const smsCustomers = () => { customerPhones.forEach((p) => { if (p) window.location.href = `sms:${p}`; }); };
  const contactBoth = () => { callDriver(); smsDriver(); customerPhones.forEach((p) => { if (p) window.location.href = `sms:${p}`; }); };

  return (
    <SidePanel
      open={ open }
      onClose={ onClose }
      title={ `Contact - ${ride.displayId}` }
      description="Choose how to reach the driver and customer."
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Driver</p>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <span className="w-20">{ ride.driver.name }</span>
            <span className="text-slate-500">{ driverPhone || "-" }</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={ callDriver } className="text-[11px] px-2.5 py-1.5">
              <Phone className="w-3 h-3 mr-1" /> Call
            </Button>
            <Button variant="outline" onClick={ smsDriver } className="text-[11px] px-2.5 py-1.5">
              <MessageCircle className="w-3 h-3 mr-1" /> SMS
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Customer{ ride.customers.length > 1 ? "s" : "" }</p>
          { ride.customers.map((c) => (
            <div key={ c.id } className="flex items-center gap-2 text-sm text-slate-700">
              <span className="w-20">{ c.name }</span>
              <span className="text-slate-500">{ c.phone || "-" }</span>
            </div>
          )) }
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={ callCustomers } className="text-[11px] px-2.5 py-1.5">
              <PhoneOutgoing className="w-3 h-3 mr-1" /> Call all
            </Button>
            <Button variant="outline" onClick={ smsCustomers } className="text-[11px] px-2.5 py-1.5">
              <Send className="w-3 h-3 mr-1" /> SMS all
            </Button>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-3">
          <p className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">Both parties</p>
          <Button onClick={ contactBoth } className="w-full text-[11px] px-3 py-2">
            Contact driver &amp; customer
          </Button>
        </div>
      </div>
    </SidePanel>
  );
}
