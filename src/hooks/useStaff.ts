import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useToast } from "@/components/toastContext";
import { queryKeys } from "@/lib/queryKeys";
import { polledQueryOptions } from "@/lib/queryClient";
import {
  acceptStaffInvitation,
  assignStaffRole,
  cancelStaffInvitation,
  deactivateStaff,
  inviteStaff,
  listStaff,
  listStaffInvitations,
  resendStaffInvitation,
  revokeStaffRole,
  verifyStaffInvitation,
} from "@/services/staff";
import type {
  AcceptStaffInvitationPayload,
  StaffAssignRolePayload,
  StaffInvitationListParams,
  StaffInvitePayload,
  StaffListParams,
} from "@/types/staff";

export function useStaff(params: StaffListParams) {
  return useQuery({
    queryKey: queryKeys.staff.list(params),
    queryFn: ({ signal }) => listStaff(params, { signal }),
    placeholderData: keepPreviousData,
    ...polledQueryOptions,
    refetchInterval: 60_000,
  });
}

export function useStaffInvitations(params: StaffInvitationListParams) {
  return useQuery({
    queryKey: queryKeys.staff.invitationList(params),
    queryFn: ({ signal }) => listStaffInvitations(params, { signal }),
    placeholderData: keepPreviousData,
    ...polledQueryOptions,
    refetchInterval: 60_000,
  });
}

export function useInviteStaff() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (payload: StaffInvitePayload) => inviteStaff(payload),
    onSuccess: (_data, payload) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.staff.invitationLists() });
      toast.success(`Invitation sent to ${payload.email}.`);
    },
    onError: (error: Error) => {
      toast.error(error?.message ?? "The staff invitation could not be sent.");
    },
  });
}

export function useCancelStaffInvitation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({
      invitationId,
      reason,
    }: {
      invitationId: string;
      reason: string;
    }) => cancelStaffInvitation(invitationId, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.staff.invitationLists() });
      toast.success("Staff invitation cancelled.");
    },
    onError: (error: Error) => {
      toast.error(error?.message ?? "The invitation could not be cancelled.");
    },
  });
}

export function useResendStaffInvitation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (invitationId: string) => resendStaffInvitation(invitationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.staff.invitationLists() });
      toast.success("Staff invitation resent.");
    },
    onError: (error: Error) => {
      toast.error(error?.message ?? "The invitation could not be resent.");
    },
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
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.lists() });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.lists() });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.lists() });
      toast.success("Staff account deactivated.");
    },
    onError: (error: Error) => {
      toast.error(error?.message ?? "The account could not be deactivated.");
    },
  });
}

export function useVerifyStaffInvitation(token: string) {
  return useQuery({
    queryKey: queryKeys.staff.invitationVerification(token),
    queryFn: ({ signal }) => verifyStaffInvitation(token, { signal }),
    enabled: Boolean(token),
    retry: false,
    staleTime: Infinity,
  });
}

export function useAcceptStaffInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AcceptStaffInvitationPayload) =>
      acceptStaffInvitation(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.staff.invitations,
      });
    },
  });
}
