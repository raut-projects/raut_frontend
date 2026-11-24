// Ride dispute service.
// Loads a ride's dispute and resolves it or issues a refund. Uses the shared
// `./api` helpers in production and mock helpers when RIDE_DISPUTES_USE_MOCK_DATA
// is on. Failures surface as ApiError.

import { API_ROUTES } from "../lib/config";
import { apiGet, apiPost } from "./api";
import {
  getMockRideDispute,
  issueMockRideRefund,
  resolveMockRideDispute,
  RIDE_DISPUTES_USE_MOCK_DATA,
} from "../lib/rideDisputes";
import type {
  IssueRideRefundInput,
  ResolveRideDisputeInput,
  RideDispute,
} from "../lib/rideDisputes";

export async function getRideDispute(rideId: string): Promise<RideDispute> {
  if (RIDE_DISPUTES_USE_MOCK_DATA) {
    return getMockRideDispute(rideId);
  }

  return apiGet(API_ROUTES.rideDispute(rideId));
}

export async function resolveRideDispute(
  rideId: string,
  input: ResolveRideDisputeInput,
): Promise<RideDispute> {
  if (RIDE_DISPUTES_USE_MOCK_DATA) {
    return resolveMockRideDispute(rideId, input);
  }

  return apiPost(API_ROUTES.rideResolveDispute(rideId), input);
}

export async function issueRideRefund(
  rideId: string,
  input: IssueRideRefundInput,
): Promise<RideDispute> {
  if (RIDE_DISPUTES_USE_MOCK_DATA) {
    return issueMockRideRefund(rideId, input);
  }

  return apiPost(API_ROUTES.rideRefund(rideId), input);
}
