// Ride dispute state transitions and refund-method rules for the admin disputes
// screens. Defines valid issue types and how a dispute is resolved.

import type { DisputeIssueType, RefundMethod } from "./refundCalculator";
import { suggestRefund } from "./refundCalculator";

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

const STORAGE_KEY = "raut_ride_disputes_v1";

const RIDE_DISPUTES_USE_MOCK_DATA =
  process.env.NEXT_PUBLIC_USE_MOCK_RIDE_DISPUTES !== "false";

const PARTIES = ["Customer (Mary S.)", "Driver (John K.)", "Customer (Amina J.)", "Driver (Peter M.)"];
const COMPLAINT_LABELS: Record<DisputeIssueType, string> = {
  wrong_route: "Driver took wrong route",
  overcharge: "Fare overcharged",
  driver_no_show: "Driver no-show",
  late_arrival: "Late arrival",
  other: "Other",
};

const CURRENCY = "TZS";

const MOCK_DELAY_MS = 160;

function hashString(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) | 0;
  }
  return h;
}

function stableHash(rideId: string): number {
  return Math.abs(hashString(rideId));
}

export function mockHasDispute(rideId: string): boolean {
  return stableHash(rideId) % 3 === 0;
}

function wait(duration = MOCK_DELAY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function buildFareBreakdown(originalFare: number): FareBreakdown {
  const baseFare = Math.round(originalFare * 0.7);
  const distanceCharge = Math.round(originalFare * 0.2);
  const timeCharge = Math.round(originalFare * 0.08);
  const platformFee = Math.round(originalFare * 0.02);
  return { baseFare, distanceCharge, timeCharge, platformFee, total: originalFare };
}

function generateMockRideDispute(rideId: string): RideDispute {
  const seed = stableHash(rideId);
  const partyIndex = seed % PARTIES.length;
  const issueIndex = seed % Object.keys(COMPLAINT_LABELS).length;
  const issueType =
    Object.keys(COMPLAINT_LABELS)[issueIndex] as DisputeIssueType;

  const actualDistanceKm = 5 + (seed % 15);
  const extraDistanceKm = issueType === "wrong_route" ? 1 + (seed % 10) : 0;
  const optimalDistanceKm = Math.max(0, actualDistanceKm - extraDistanceKm);
  const originalFare = 8000 + (seed % 12000);
  const fareBreakdown = buildFareBreakdown(originalFare);
  const suggestedRefund = suggestRefund({
    issueType,
    originalFare,
    actualDistanceKm,
    extraDistanceKm,
  });

  return {
    id: `DIS-${stableHash(rideId).toString(16).toUpperCase().slice(0, 8)}`,
    rideId,
    displayId: `#RD-${String(rideId).replace(/-/g, "").slice(0, 8).toUpperCase()}`,
    status: "open",
    disputingParty: PARTIES[partyIndex],
    complaint: issueType,
    complaintLabel: COMPLAINT_LABELS[issueType],
    filedAt: minutesAgo(60 + (seed % 500)),
    evidence: { actualDistanceKm, optimalDistanceKm, extraDistanceKm, originalFare, fareBreakdown },
    suggestedRefund,
    currency: CURRENCY,
  };
}

function loadFromStorage(): Map<string, RideDispute> {
  if (typeof window === "undefined") return new Map();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();
    const entries = JSON.parse(raw) as RideDispute[];
    return new Map(entries.map((entry) => [entry.rideId, entry]));
  } catch {
    return new Map();
  }
}

function saveToStorage(map: Map<string, RideDispute>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...map.values()]));
  } catch {
    // storage unavailable; keep in-memory only
  }
}

const store = new Map<string, RideDispute>(loadFromStorage());

export function getMockRideDispute(rideId: string): RideDispute {
  const existing = store.get(rideId);
  if (existing) return existing;

  const dispute = generateMockRideDispute(rideId);
  store.set(rideId, dispute);
  saveToStorage(store);
  return dispute;
}

export async function resolveMockRideDispute(
  rideId: string,
  input: ResolveRideDisputeInput,
): Promise<RideDispute> {
  await wait();

  const dispute = getMockRideDispute(rideId);
  const resolved: RideDispute = {
    ...dispute,
    status: "resolved",
    decision: input.decision,
    refundAmount:
      input.decision === "driver" ? 0 : Math.max(0, input.refundAmount),
    refundMethod: input.refundMethod,
    resolutionNote: input.resolutionNote,
    resolvedAt: new Date().toISOString(),
  };
  store.set(rideId, resolved);
  saveToStorage(store);
  return resolved;
}

export async function issueMockRideRefund(
  rideId: string,
  input: IssueRideRefundInput,
): Promise<RideDispute> {
  await wait();

  const dispute = getMockRideDispute(rideId);
  const updated: RideDispute = {
    ...dispute,
    refundAmount: Math.max(0, input.amount),
    refundMethod: input.method,
    resolutionNote: dispute.resolutionNote ?? input.note,
  };
  if (!dispute.decision) {
    updated.decision = "rider";
    updated.status = "resolved";
    updated.resolvedAt = new Date().toISOString();
  }
  store.set(rideId, updated);
  saveToStorage(store);
  return updated;
}

export function resetMockRideDisputes(): void {
  store.clear();
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

export { RIDE_DISPUTES_USE_MOCK_DATA };
