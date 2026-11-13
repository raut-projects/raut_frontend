/**
 * Referral program hooks: programs, users, relationships, stats and payments.
 * Mutations invalidate the referrals cache. Collaborates with referrals service.
 */
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryKeys";
import type {
  ProcessReferralPayload,
  ReferralPaymentPayload,
  ReferralProgramListParams,
  ReferralProgramPayload,
  ReferralProgramUpdatePayload,
  ReferralRelationshipsParams,
  ReferralStatsParams,
  ReferralUsersParams,
} from "@/lib/referrals";
import {
  bulkEnrollReferralUsers,
  createReferralProgram,
  enrollReferralUser,
  getMyReferralCode,
  getReferralProgram,
  getReferralStats,
  getReferralUser,
  listPendingReferralPayments,
  listReferralPrograms,
  listReferralRelationships,
  listReferralUsers,
  listTopReferrers,
  markReferralPaymentPaid,
  processReferral,
  unenrollReferralUser,
  updateReferralProgram,
} from "@/services/referrals";

function invalidateReferrals(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.referrals.all });
}

/**
 * useReferralPrograms hook.
 */
export function useReferralPrograms(
  params: ReferralProgramListParams = {},
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.referrals.programs.list(params),
    queryFn: () => listReferralPrograms(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

/**
 * useReferralProgram hook.
 */
export function useReferralProgram(programId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.referrals.programs.detail(programId),
    queryFn: () => getReferralProgram(programId),
    enabled: enabled && Boolean(programId),
  });
}

/**
 * useCreateReferralProgram hook.
 */
export function useCreateReferralProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReferralProgramPayload) =>
      createReferralProgram(payload),
    onSuccess: () => invalidateReferrals(queryClient),
  });
}

/**
 * useUpdateReferralProgram hook.
 */
export function useUpdateReferralProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      programId,
      payload,
    }: {
      programId: string;
      payload: ReferralProgramUpdatePayload;
    }) => updateReferralProgram(programId, payload),
    onSuccess: () => invalidateReferrals(queryClient),
  });
}

/**
 * useEnrollReferralUser hook.
 */
export function useEnrollReferralUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      programId,
      userId,
    }: {
      programId: string;
      userId: string;
    }) => enrollReferralUser(programId, userId),
    onSuccess: () => invalidateReferrals(queryClient),
  });
}

/**
 * useBulkEnrollReferralUsers hook.
 */
export function useBulkEnrollReferralUsers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      programId,
      userIds,
    }: {
      programId: string;
      userIds: string[];
    }) => bulkEnrollReferralUsers(programId, userIds),
    onSuccess: () => invalidateReferrals(queryClient),
  });
}

/**
 * useUnenrollReferralUser hook.
 */
export function useUnenrollReferralUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      programId,
      userId,
    }: {
      programId: string;
      userId: string;
    }) => unenrollReferralUser(programId, userId),
    onSuccess: () => invalidateReferrals(queryClient),
  });
}

/**
 * useReferralUsers hook.
 */
export function useReferralUsers(
  params: ReferralUsersParams = {},
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.referrals.users.list(params),
    queryFn: () => listReferralUsers(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

/**
 * useReferralUser hook.
 */
export function useReferralUser(userId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.referrals.users.detail(userId),
    queryFn: () => getReferralUser(userId),
    enabled: enabled && Boolean(userId),
  });
}

/**
 * useReferralRelationships hook.
 */
export function useReferralRelationships(
  params: ReferralRelationshipsParams = {},
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.referrals.relationships.list(params),
    queryFn: () => listReferralRelationships(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

/**
 * useReferralStats hook.
 */
export function useReferralStats(
  params: ReferralStatsParams = {},
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.referrals.stats(params),
    queryFn: () => getReferralStats(params),
    enabled,
  });
}

/**
 * useTopReferrers hook.
 */
export function useTopReferrers(limit?: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.referrals.topReferrers(limit),
    queryFn: () => listTopReferrers(limit),
    enabled,
  });
}

/**
 * usePendingReferralPayments hook.
 */
export function usePendingReferralPayments(enabled = true) {
  return useQuery({
    queryKey: queryKeys.referrals.pendingPayments,
    queryFn: () => listPendingReferralPayments(),
    enabled,
  });
}

/**
 * useMarkReferralPaymentPaid hook.
 */
export function useMarkReferralPaymentPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      paymentId,
      payload,
    }: {
      paymentId: string;
      payload: ReferralPaymentPayload;
    }) => markReferralPaymentPaid(paymentId, payload),
    onSuccess: () => invalidateReferrals(queryClient),
  });
}

/**
 * useMyReferralCode hook.
 */
export function useMyReferralCode(enabled = true) {
  return useQuery({
    queryKey: queryKeys.referrals.myCode,
    queryFn: () => getMyReferralCode(),
    enabled,
  });
}

/**
 * useProcessReferral hook.
 */
export function useProcessReferral() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProcessReferralPayload) => processReferral(payload),
    onSuccess: () => invalidateReferrals(queryClient),
  });
}
