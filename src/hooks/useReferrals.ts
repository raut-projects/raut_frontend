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

type QueryClient = ReturnType<typeof useQueryClient>;

function invalidatePrograms(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.referrals.programs.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.referrals.statsAll() });
  queryClient.invalidateQueries({
    queryKey: queryKeys.referrals.topReferrersAll(),
  });
}

function invalidateEnrollment(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.referrals.users.all });
  queryClient.invalidateQueries({
    queryKey: queryKeys.referrals.relationships.all,
  });
  queryClient.invalidateQueries({ queryKey: queryKeys.referrals.statsAll() });
  queryClient.invalidateQueries({
    queryKey: queryKeys.referrals.topReferrersAll(),
  });
}

function invalidatePayments(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.referrals.pendingPayments });
}

function invalidateReferralActivity(queryClient: QueryClient) {
  invalidateEnrollment(queryClient);
  queryClient.invalidateQueries({ queryKey: queryKeys.referrals.myCode });
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
    queryFn: ({ signal }) => listReferralPrograms(params, { signal }),
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
    queryFn: ({ signal }) => getReferralProgram(programId, { signal }),
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
    onSuccess: () => invalidatePrograms(queryClient),
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
    onSuccess: () => invalidatePrograms(queryClient),
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
    onSuccess: () => invalidateEnrollment(queryClient),
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
    onSuccess: () => invalidateEnrollment(queryClient),
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
    onSuccess: () => invalidateEnrollment(queryClient),
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
    queryFn: ({ signal }) => listReferralUsers(params, { signal }),
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
    queryFn: ({ signal }) => getReferralUser(userId, { signal }),
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
    queryFn: ({ signal }) => listReferralRelationships(params, { signal }),
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
    queryFn: ({ signal }) => getReferralStats(params, { signal }),
    enabled,
  });
}

/**
 * useTopReferrers hook.
 */
export function useTopReferrers(limit?: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.referrals.topReferrers(limit),
    queryFn: ({ signal }) => listTopReferrers(limit, { signal }),
    enabled,
  });
}

/**
 * usePendingReferralPayments hook.
 */
export function usePendingReferralPayments(enabled = true) {
  return useQuery({
    queryKey: queryKeys.referrals.pendingPayments,
    queryFn: ({ signal }) => listPendingReferralPayments({ signal }),
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
    onSuccess: () => invalidatePayments(queryClient),
  });
}

/**
 * useMyReferralCode hook.
 */
export function useMyReferralCode(enabled = true) {
  return useQuery({
    queryKey: queryKeys.referrals.myCode,
    queryFn: ({ signal }) => getMyReferralCode({ signal }),
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
    onSuccess: () => invalidateReferralActivity(queryClient),
  });
}
