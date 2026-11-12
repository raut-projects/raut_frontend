import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryKeys";
import type { PromotionListParams, PromotionPayload } from "@/lib/marketing";
import {
  activatePromotion,
  createPromotion,
  deactivatePromotion,
  deletePromotion,
  getPromotion,
  listPromotions,
  updatePromotion,
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

export function useActivatePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (promotionId: string) => activatePromotion(promotionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.marketing.promotions.all,
      });
    },
  });
}

export function useDeactivatePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (promotionId: string) => deactivatePromotion(promotionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.marketing.promotions.all,
      });
    },
  });
}
