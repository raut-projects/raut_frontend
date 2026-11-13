"use client";

import { useMemo } from "react";
import { getUserFriendlyErrorMessage } from "../lib/friendlyError";
import { useToastStore, type ToastTone } from "../store/toastStore";

type ErrorInput = unknown;

function toMessage(
  value: unknown,
  fallback = "Something went wrong. Please try again.",
) {
  if (typeof value === "string" && value.trim()) {
    return getUserFriendlyErrorMessage(value, { context: "save", fallback });
  }
  return getUserFriendlyErrorMessage(value, { context: "save", fallback });
}

export function useToast() {
  return useMemo(
    () => ({
      toast: (message: string, tone: ToastTone = "info") =>
        useToastStore.getState().push(message, tone),
      success: (message: string) =>
        useToastStore.getState().push(message, "success"),
      error: (error: ErrorInput, fallback?: string) =>
        useToastStore.getState().push(toMessage(error, fallback), "error"),
    }),
    [],
  );
}
