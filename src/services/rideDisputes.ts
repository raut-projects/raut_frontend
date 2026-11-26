// Ride dispute service.
// Loads a ride's dispute and resolves it or issues a refund through the admin
// API. Failures surface as ApiError.

import { API_ROUTES } from "../lib/config";
import { apiGet, apiPost } from "./api";
import { mapRideDispute } from "./mappers";
import type {
  IssueRideRefundInput,
  ResolveRideDisputeInput,
  RideDispute,
} from "../lib/rideDisputes";

export async function getRideDispute(
  rideId: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<RideDispute> {
  const data = await apiGet(API_ROUTES.rideDispute(rideId), { signal });

  return mapRideDispute(data, rideId);
}

export async function resolveRideDispute(
  rideId: string,
  input: ResolveRideDisputeInput,
): Promise<RideDispute> {
  const data = await apiPost(API_ROUTES.rideResolveDispute(rideId), input);

  return mapRideDispute(data, rideId);
}

export async function issueRideRefund(
  rideId: string,
  input: IssueRideRefundInput,
): Promise<RideDispute> {
  const data = await apiPost(API_ROUTES.rideRefund(rideId), input);

  return mapRideDispute(data, rideId);
}
