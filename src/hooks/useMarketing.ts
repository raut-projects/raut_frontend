import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryKeys";
import type {
  PromotionListParams,
  PromotionPayload,
  ReferralConfigFormValues,
  ReferralListParams,
} from "@/lib/marketing";
import {
  createPromotion,
  deletePromotion,
  getPromotion,
  getReferralOverview,
  listPromotions,
  listReferrals,
  updatePromotion,
  updateReferralConfig,
} from "@/services/marketing";

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

export function useReferralOverview(period = "month") {
  return useQuery({
    queryKey: queryKeys.marketing.referrals.overview(period),
    queryFn: () => getReferralOverview(period),
    staleTime: 5 * 60_000,
  });
}

export function useReferrals(params: ReferralListParams) {
  return useQuery({
    queryKey: queryKeys.marketing.referrals.list(params),
    queryFn: () => listReferrals(params),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });
}

export function useUpdateReferralConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: ReferralConfigFormValues) =>
      updateReferralConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.marketing.referrals.all,
      });
    },
  });
}
