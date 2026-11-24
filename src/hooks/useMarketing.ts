/**
 * Promotion (marketing) hooks over the marketing service.
 * Provides list/detail queries with keep-previous pagination and 60s polling,
 * plus mutations for create/update/delete/activate/deactivate that invalidate
 * the promotions cache. Collaborates with marketing service and queryKeys.
 */
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

/**
 * Lists promotions with keep-previous data and 60s polling.
 * Query key: marketing.promotions.list(params).
 */
export function usePromotions(params: PromotionListParams) {
  return useQuery({
    queryKey: queryKeys.marketing.promotions.list(params),
    queryFn: () => listPromotions(params),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });
}

/**
 * usePromotion hook.
 */
export function usePromotion(promotionId: string) {
  return useQuery({
    queryKey: queryKeys.marketing.promotions.detail(promotionId),
    queryFn: () => getPromotion(promotionId),
    enabled: Boolean(promotionId),
  });
}

/**
 * useCreatePromotion hook.
 */
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

/**
 * useUpdatePromotion hook.
 */
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

/**
 * useDeletePromotion hook.
 */
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

/**
 * useActivatePromotion hook.
 */
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

/**
 * useDeactivatePromotion hook.
 */
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
