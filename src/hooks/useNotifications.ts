/**
 * Notification center queries and read-state mutations.
 * Loads the operator's notifications and marks individual entries as read.
 * Collaborates with the notifications service, queryKeys.notifications and the
 * toast context.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../components/toastContext";
import { queryKeys } from "../lib/queryKeys";
import { polledQueryOptions } from "../lib/queryClient";
import {
  listNotifications,
  markNotificationRead,
} from "../services/notifications";

/**
 * Lists notifications for the current operator.
 *
 * Query key: `notifications.all`. Polls every 60 seconds with a 30-second
 * staleTime so unread badges stay current without over-fetching.
 *
 * @returns A React Query result containing the notification list.
 */
export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: ({ signal }) => listNotifications({ signal }),
    ...polledQueryOptions,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

/**
 * Marks a notification as read.
 *
 * Variables: the notification id. Invalidates `notifications.all` on success;
 * failures surface through the toast context.
 *
 * @returns A React Query mutation accepting a notification id.
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: markNotificationRead,

    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });
      const previous = queryClient.getQueryData<
        Awaited<ReturnType<typeof listNotifications>>
      >(queryKeys.notifications.all);

      queryClient.setQueryData<
        Awaited<ReturnType<typeof listNotifications>>
      >(queryKeys.notifications.all, (current) =>
        current?.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification,
        ),
      );

      return { previous };
    },

    onError: (error, _notificationId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.notifications.all,
          context.previous,
        );
      }
      toast.error(error?.message ?? "The notification could not be updated.");
    },

    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
    },
  });
}
