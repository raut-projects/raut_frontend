export type RefundMethod = 'mpesa' | 'wallet' | 'next_ride_discount';
export type DisputeIssueType =
  | 'wrong_route'
  | 'overcharge'
  | 'driver_no_show'
  | 'late_arrival'
  | 'other';

export interface RefundSuggestionInput {
  issueType: DisputeIssueType;
  originalFare: number;
  actualDistanceKm?: number;
  extraDistanceKm?: number;
  expectedFare?: number;
}

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

export const REFUND_METHODS: { value: RefundMethod; label: string }[] = [
  { value: 'mpesa', label: 'M-Pesa Instant' },
  { value: 'wallet', label: 'Wallet Credit' },
  { value: 'next_ride_discount', label: 'Next Ride Discount' },
];

export const ISSUE_TYPES: { value: DisputeIssueType; label: string }[] = [
  { value: 'wrong_route', label: 'Driver took wrong route' },
  { value: 'overcharge', label: 'Fare overcharged' },
  { value: 'driver_no_show', label: 'Driver no-show' },
  { value: 'late_arrival', label: 'Late arrival' },
  { value: 'other', label: 'Other' },
];

export function formatMoneyTZS(value: number): string {
  return `TZS ${Number(value).toLocaleString('en-TZ')}`;
}
