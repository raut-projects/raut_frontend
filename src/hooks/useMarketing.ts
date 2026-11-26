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
import { polledQueryOptions } from "@/lib/queryClient";
import { derivePromotionStatus } from "@/lib/marketing";
import type {
  Promotion,
  PromotionListParams,
  PromotionListResult,
  PromotionPayload,
} from "@/lib/marketing";
import {
  activatePromotion,
  createPromotion,
  deactivatePromotion,
  deletePromotion,
  getPromotion,
  listPromotions,
  updatePromotion,
} from "@/services/marketing";

const patchPromotionStatus = (
  queryClient: ReturnType<typeof useQueryClient>,
  promotionId: string,
  isActive: boolean,
) => {
  const withStatus = (promotion: Promotion): Promotion => ({
    ...promotion,
    isActive,
    status: derivePromotionStatus({
      isActive,
      startsAt: promotion.startsAt,
      endsAt: promotion.endsAt,
    }),
  });

  queryClient.setQueriesData<PromotionListResult>(
    { queryKey: queryKeys.marketing.promotions.lists() },
    (current) =>
      current && {
        ...current,
        items: current.items.map((promotion) =>
          promotion.id === promotionId ? withStatus(promotion) : promotion,
        ),
      },
  );
  queryClient.setQueryData<Promotion>(
    queryKeys.marketing.promotions.detail(promotionId),
    (current) => (current ? withStatus(current) : current),
  );
};

/**
 * Lists promotions with keep-previous data and 60s polling.
 * Query key: marketing.promotions.list(params).
 */
export function usePromotions(params: PromotionListParams) {
  return useQuery({
    queryKey: queryKeys.marketing.promotions.list(params),
    queryFn: ({ signal }) => listPromotions(params, { signal }),
    placeholderData: keepPreviousData,
    ...polledQueryOptions,
    refetchInterval: 60_000,
  });
}

/**
 * usePromotion hook.
 */
export function usePromotion(promotionId: string) {
  return useQuery({
    queryKey: queryKeys.marketing.promotions.detail(promotionId),
    queryFn: ({ signal }) => getPromotion(promotionId, { signal }),
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
        queryKey: queryKeys.marketing.promotions.lists(),
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
        queryKey: queryKeys.marketing.promotions.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.marketing.promotions.detail(promotionId),
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
    onSuccess: (_data, promotionId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.marketing.promotions.lists(),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.marketing.promotions.detail(promotionId),
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
    onSuccess: (_data, promotionId) => {
      patchPromotionStatus(queryClient, promotionId, true);
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
    onSuccess: (_data, promotionId) => {
      patchPromotionStatus(queryClient, promotionId, false);
    },
  });
}
