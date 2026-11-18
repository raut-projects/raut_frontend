import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useToast } from "@/components/toastContext";
import { queryKeys } from "@/lib/queryKeys";
import {
  assignStaffRole,
  deactivateStaff,
  listStaff,
  revokeStaffRole,
} from "@/services/staff";
import type {
  StaffAssignRolePayload,
  StaffListParams,
} from "@/types/staff";

export function useStaff(params: StaffListParams) {
  return useQuery({
    queryKey: queryKeys.staff.list(params),
    queryFn: () => listStaff(params),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });
}

export function useAssignStaffRole() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string;
      payload: StaffAssignRolePayload;
    }) => assignStaffRole(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
      toast.success("Role assigned.");
    },
    onError: (error: Error) => {
      toast.error(error?.message ?? "The role could not be assigned.");
    },
  });
}

export function useRevokeStaffRole() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({
      userId,
      assignmentId,
      reason,
    }: {
      userId: string;
      assignmentId: string;
      reason: string;
    }) => revokeStaffRole(userId, assignmentId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
      toast.success("Role removed.");
    },
    onError: (error: Error) => {
      toast.error(error?.message ?? "The role could not be removed.");
    },
  });
}

export function useDeactivateStaff() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      deactivateStaff(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
      toast.success("Staff account deactivated.");
    },
    onError: (error: Error) => {
      toast.error(error?.message ?? "The account could not be deactivated.");
    },
  });
}
