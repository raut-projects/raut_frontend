// Refund suggestion rules for ride disputes. Suggests a refund amount from the
// issue type and fare/distance evidence, and exposes the refund-method and
// issue-type option lists plus a TZS formatter.

/** How a refund is paid out. */
export type RefundMethod = 'mpesa' | 'wallet' | 'next_ride_discount';
/** Reason a rider or driver is disputing a fare. */
export type DisputeIssueType =
  | 'wrong_route'
  | 'overcharge'
  | 'driver_no_show'
  | 'late_arrival'
  | 'other';

/** Evidence used to suggest a refund. Fares are TZS; distances are km. */
export interface RefundSuggestionInput {
  issueType: DisputeIssueType;
  originalFare: number;
  actualDistanceKm?: number;
  extraDistanceKm?: number;
  expectedFare?: number;
}

/**
 * Suggests a refund amount in TZS for a dispute.
 *
 * - wrong_route: fare × (extraDistance / actualDistance) when both distances are
 *   known, otherwise a flat 25% of the fare.
 * - overcharge: the positive difference between the fare paid and the expected
 *   fare.
 * - driver_no_show: the full fare.
 * - late_arrival: 25% of the fare.
 * - other: nothing.
 *
 * The result is clamped to zero or more and rounded to the nearest 100 TZS.
 */
export function suggestRefund(input: RefundSuggestionInput): number {
  const { issueType, originalFare = 0, actualDistanceKm = 0, extraDistanceKm = 0, expectedFare = 0 } = input;

  let suggested = 0;
  switch (issueType) {
    case 'wrong_route':
      if (actualDistanceKm > 0 && extraDistanceKm > 0) {
        suggested = originalFare * (extraDistanceKm / actualDistanceKm);
      } else if (extraDistanceKm > 0) {
        suggested = originalFare * 0.25;
      }
      break;
    case 'overcharge':
      suggested = Math.max(0, originalFare - expectedFare);
      break;
    case 'driver_no_show':
      suggested = originalFare;
      break;
    case 'late_arrival':
      suggested = originalFare * 0.25;
      break;
    case 'other':
      suggested = 0;
      break;
  }

  return Math.max(0, Math.round(suggested / 100) * 100);
}

/** Selectable refund methods with display labels. */
export const REFUND_METHODS: { value: RefundMethod; label: string }[] = [
  { value: 'mpesa', label: 'M-Pesa Instant' },
  { value: 'wallet', label: 'Wallet Credit' },
  { value: 'next_ride_discount', label: 'Next Ride Discount' },
];

/** Selectable dispute issue types with display labels. */
export const ISSUE_TYPES: { value: DisputeIssueType; label: string }[] = [
  { value: 'wrong_route', label: 'Driver took wrong route' },
  { value: 'overcharge', label: 'Fare overcharged' },
  { value: 'driver_no_show', label: 'Driver no-show' },
  { value: 'late_arrival', label: 'Late arrival' },
  { value: 'other', label: 'Other' },
];

/** Formats a number as a TZS amount, e.g. "TZS 12,000". */
export function formatMoneyTZS(value: number): string {
  return `TZS ${Number(value).toLocaleString('en-TZ')}`;
}
