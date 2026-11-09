"use client";

import {
  Copy,
  EllipsisVertical,
  Eye,
  Link2,
  Pencil,
  Power,
  PowerOff,
  Send,
  Share2,
  Trash2,
} from "lucide-react";

import { useToast } from "@/components/toastContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { copyToClipboard } from "@/lib/clipboard";
import {
  buildReferralLink,
  canActivateReferralCode,
  canDeactivateReferralCode,
  canDeleteReferralCode,
  type ReferralCode,
} from "@/lib/referralCodes";

const itemClass =
  "px-2.5 py-1.5 text-xs font-medium text-slate-600 focus:bg-slate-50 focus:text-slate-700";
const destructiveClass =
  "px-2.5 py-1.5 text-xs font-medium text-rose-600 focus:bg-rose-50 focus:text-rose-700";

export function ReferralRowActions({
  code,
  busy,
  onViewDetails,
  onEdit,
  onSend,
  onActivate,
  onDeactivate,
  onDelete,
}: {
  code: ReferralCode;
  busy: boolean;
  onViewDetails: (code: ReferralCode) => void;
  onEdit: (code: ReferralCode) => void;
  onSend: (code: ReferralCode) => void;
  onActivate: (code: ReferralCode) => void;
  onDeactivate: (code: ReferralCode) => void;
  onDelete: (code: ReferralCode) => void;
}) {
  const toast = useToast();
  const link = buildReferralLink(code.code);
  const deletable = canDeleteReferralCode(code);

  const copy = async (value: string, message: string) => {
    try {
      await copyToClipboard(value);
      toast.success(message);
    } catch {
      toast.error("Could not copy to the clipboard.");
    }
  };

  const share = async () => {
    const text = `Use my Raut referral code ${code.code} to sign up: ${link}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Raut",
          text: `Use my Raut referral code ${code.code} to sign up on Raut.`,
          url: link,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    const opened = window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
    );

    if (opened) {
      opened.opener = null;
      toast.success("Opening WhatsApp to share the referral.");
      return;
    }

    await copy(link, "Referral link copied. You can share it now.");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={busy}
          className="text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          aria-label={`Actions for ${code.code}`}
        >
          <EllipsisVertical className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52 rounded-lg border border-slate-200 bg-white p-1 shadow-elevated ring-0"
      >
        <DropdownMenuItem
          onSelect={() => onViewDetails(code)}
          className={itemClass}
        >
          <Eye className="size-3.5" aria-hidden="true" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => void copy(code.code, "Referral code copied.")}
          className={itemClass}
        >
          <Copy className="size-3.5" aria-hidden="true" />
          Copy Code
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => void copy(link, "Referral link copied.")}
          className={itemClass}
        >
          <Link2 className="size-3.5" aria-hidden="true" />
          Copy Link
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => void share()}
          className={itemClass}
        >
          <Share2 className="size-3.5" aria-hidden="true" />
          Share Referral
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => onSend(code)}
          className={itemClass}
        >
          <Send className="size-3.5" aria-hidden="true" />
          Send to User
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-slate-100" />

        <DropdownMenuItem
          onSelect={() => onEdit(code)}
          className={itemClass}
        >
          <Pencil className="size-3.5" aria-hidden="true" />
          Edit Referral
        </DropdownMenuItem>

        {canActivateReferralCode(code) && (
          <DropdownMenuItem
            onSelect={() => onActivate(code)}
            className="px-2.5 py-1.5 text-xs font-medium text-emerald-700 focus:bg-emerald-50 focus:text-emerald-800"
          >
            <Power className="size-3.5" aria-hidden="true" />
            Activate
          </DropdownMenuItem>
        )}

        {canDeactivateReferralCode(code) && (
          <DropdownMenuItem
            onSelect={() => onDeactivate(code)}
            className="px-2.5 py-1.5 text-xs font-medium text-amber-700 focus:bg-amber-50 focus:text-amber-800"
          >
            <PowerOff className="size-3.5" aria-hidden="true" />
            Deactivate
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator className="bg-slate-100" />

        {!deletable && (
          <DropdownMenuLabel className="px-2.5 pb-1 text-[11px] font-normal text-slate-400">
            Only expired or unused codes can be deleted.
          </DropdownMenuLabel>
        )}

        <DropdownMenuItem
          disabled={!deletable}
          onSelect={() => onDelete(code)}
          variant="destructive"
          className={destructiveClass}
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
