// Ride dispute domain types and shared labels for the admin disputes screens.
// Defines the dispute shape the UI renders and how a dispute is resolved.

import type { DisputeIssueType, RefundMethod } from "./refundCalculator";

export type DisputeStatus = "open" | "resolved";
export type DisputeDecision = "rider" | "driver" | "split";

export interface FareBreakdown {
  baseFare: number;
  distanceCharge: number;
  timeCharge: number;
  platformFee: number;
  total: number;
}

export interface RideDisputeEvidence {
  actualDistanceKm: number;
  optimalDistanceKm: number;
  extraDistanceKm: number;
  originalFare: number;
  routeLabel?: string;
  fareBreakdown: FareBreakdown;
}

export interface RideDispute {
  id: string;
  rideId: string;
  displayId: string;
  status: DisputeStatus;
  disputingParty: string;
  complaint: DisputeIssueType;
  complaintLabel: string;
  filedAt: string;
  evidence: RideDisputeEvidence;
  suggestedRefund: number;
  currency: string;
  decision?: DisputeDecision;
  refundAmount?: number;
  refundMethod?: RefundMethod;
  resolutionNote?: string;
  resolvedAt?: string;
}

export interface ResolveRideDisputeInput {
  decision: DisputeDecision;
  refundAmount: number;
  refundMethod: RefundMethod;
  resolutionNote: string;
}

export interface IssueRideRefundInput {
  amount: number;
  method: RefundMethod;
  note?: string;
}

export const DISPUTE_COMPLAINT_LABELS: Record<DisputeIssueType, string> = {
  wrong_route: "Driver took wrong route",
  overcharge: "Fare overcharged",
  driver_no_show: "Driver no-show",
  late_arrival: "Late arrival",
  other: "Other",
};

export const DISPUTE_CURRENCY = "TZS";
