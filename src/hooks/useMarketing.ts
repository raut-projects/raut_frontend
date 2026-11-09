import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryKeys";
import type { PromotionListParams, PromotionPayload } from "@/lib/marketing";
import type {
  ReferralCode,
  ReferralCodeListParams,
  ReferralCodePayload,
  ReferralCodeUpdatePayload,
  ReferralSendChannel,
  ReferralUserType,
} from "@/lib/referralCodes";
import {
  createPromotion,
  deletePromotion,
  getPromotion,
  listPromotions,
  updatePromotion,
} from "@/services/marketing";
import {
  createReferralCode,
  deleteReferralCode,
  getReferralCodeStats,
  listReferralCodes,
  searchReferralUsers,
  sendReferralCode,
  updateReferralCode,
} from "@/services/referralCodes";

export type ReferralBulkResult = {
  succeeded: string[];
  failed: { id: string; message: string }[];
};

function summarizeBulkReferralResults(
  ids: string[],
  results: PromiseSettledResult<unknown>[],
): ReferralBulkResult {
  const summary: ReferralBulkResult = { succeeded: [], failed: [] };

  ids.forEach((id, index) => {
    const result = results[index];

    if (result?.status === "fulfilled") {
      summary.succeeded.push(id);
      return;
    }

    summary.failed.push({
      id,
      message:
        result?.status === "rejected" && result.reason instanceof Error
          ? result.reason.message
          : "The request failed.",
    });
  });

  return summary;
}

function invalidateReferralCodes(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.invalidateQueries({
    queryKey: queryKeys.marketing.referrals.all,
  });
}

export function usePromotions(params: PromotionListParams) {
  return useQuery({
    queryKey: queryKeys.marketing.promotions.list(params),
    queryFn: () => listPromotions(params),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });
}

export function usePromotion(promotionId: string) {
  return useQuery({
    queryKey: queryKeys.marketing.promotions.detail(promotionId),
    queryFn: () => getPromotion(promotionId),
    enabled: Boolean(promotionId),
  });
}

export function useCreatePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PromotionPayload) => createPromotion(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.marketing.promotions.all,
      });
    },
  });
}

export function useUpdatePromotion(promotionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PromotionPayload) =>
      updatePromotion(promotionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.marketing.promotions.all,
      });
    },
  });
}

export function useDeletePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (promotionId: string) => deletePromotion(promotionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.marketing.promotions.all,
      });
    },
  });
}

export function useReferralCodes(params: ReferralCodeListParams) {
  return useQuery({
    queryKey: queryKeys.marketing.referrals.codes.list(params),
    queryFn: () => listReferralCodes(params),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });
}

export function useReferralCodeStats() {
  return useQuery({
    queryKey: queryKeys.marketing.referrals.codes.stats,
    queryFn: () => getReferralCodeStats(),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

export function useCreateReferralCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReferralCodePayload) => createReferralCode(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.marketing.referrals.all,
      });
    },
  });
}

export function useUpdateReferralCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      code,
      payload,
    }: {
      code: ReferralCode;
      payload: ReferralCodeUpdatePayload;
    }) => updateReferralCode(code, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.marketing.referrals.all,
      });
    },
  });
}

export function useDeleteReferralCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (codeId: string) => deleteReferralCode(codeId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.marketing.referrals.all,
      });
    },
  });
}

export function useSendReferralCode() {
  return useMutation({
    mutationFn: ({
      codeId,
      channel,
    }: {
      codeId: string;
      channel: ReferralSendChannel;
    }) => sendReferralCode(codeId, channel),
  });
}

export function useBulkDeleteReferralCodes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (codes: ReferralCode[]) => {
      const results = await Promise.allSettled(
        codes.map((code) => deleteReferralCode(code.id)),
      );

      return summarizeBulkReferralResults(
        codes.map((code) => code.id),
        results,
      );
    },
    onSuccess: () => invalidateReferralCodes(queryClient),
  });
}

export function useBulkUpdateReferralCodes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      codes,
      payload,
    }: {
      codes: ReferralCode[];
      payload: ReferralCodeUpdatePayload;
    }) => {
      const results = await Promise.allSettled(
        codes.map((code) => updateReferralCode(code, payload)),
      );

      return summarizeBulkReferralResults(
        codes.map((code) => code.id),
        results,
      );
    },
    onSuccess: () => invalidateReferralCodes(queryClient),
  });
}

export function useBulkSendReferralCodes() {
  return useMutation({
    mutationFn: async ({
      codes,
      channel,
    }: {
      codes: ReferralCode[];
      channel: ReferralSendChannel;
    }) => {
      const results = await Promise.allSettled(
        codes.map((code) => sendReferralCode(code.id, channel)),
      );

      return summarizeBulkReferralResults(
        codes.map((code) => code.id),
        results,
      );
    },
  });
}

export function useReferralUserSearch(
  search: string,
  userType: ReferralUserType,
) {
  const query = search.trim();

  return useQuery({
    queryKey: queryKeys.marketing.referrals.codes.users(query, userType),
    queryFn: () => searchReferralUsers({ search: query, userType }),
    enabled: query.length >= 2,
    staleTime: 60_000,
  });
}
