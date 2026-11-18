/**
 * In-memory filter state for each admin list page. `page` is 1-based, empty
 * strings mean "not set", and select fields use "all" as the neutral value.
 */
import { useCallback } from "react";
import { create } from "zustand";
import type { AdminUserStatus } from "@/lib/adminUsers";
import type { PromotionTab } from "@/lib/marketing";
import type {
  SupportTicketPriority,
  SupportTicketStatus,
} from "@/lib/supportTickets";

type PageViewValues = {
  routes: {
    status: string;
    driverId: string;
    origin: string;
    destination: string;
    from: string;
    to: string;
    page: number;
  };
  rides: {
    status: string;
    driverId: string;
    from: string;
    to: string;
    page: number;
  };
  drivers: {
    query: string;
    status: string;
    rating: string;
    joinedFrom: string;
    joinedTo: string;
    hasIssues: string;
    payoutPending: string;
    page: number;
  };
  payouts: {
    status: string;
    method: string;
    driverId: string;
    from: string;
    to: string;
    page: number;
  };
  transactions: {
    status: string;
    type: string;
    from: string;
    to: string;
    page: number;
  };
  customers: {
    search: string;
    status: string;
    page: number;
  };
  supportTickets: {
    status: SupportTicketStatus | "all";
    search: string;
    priority: SupportTicketPriority | "all";
    category: string;
    assignee: string;
    page: number;
  };
  marketingPromotions: {
    status: PromotionTab;
    search: string;
    page: number;
  };
  adminUsers: {
    status: AdminUserStatus;
    search: string;
    page: number;
  };
  "live-rides": {
    status: string;
    type: string;
    driverQuery: string;
    customerQuery: string;
    rideId: string;
    issuesOnly: boolean;
    viewMode: string;
  };
};

type PageViewStore = {
  views: PageViewValues;
  /** Immutably updates one field on one page's view. */
  setField: <
    Page extends keyof PageViewValues,
    Field extends keyof PageViewValues[Page],
  >(
    page: Page,
    field: Field,
    value: PageViewValues[Page][Field],
  ) => void;
  /** Restores every page view to its initial filters. */
  reset: () => void;
};

function createInitialViews(): PageViewValues {
  return {
    routes: {
      status: "all",
      driverId: "",
      origin: "",
      destination: "",
      from: "",
      to: "",
      page: 1,
    },
    rides: {
      status: "all",
      driverId: "",
      from: "",
      to: "",
      page: 1,
    },
    drivers: {
      query: "",
      status: "all",
      rating: "all",
      joinedFrom: "",
      joinedTo: "",
      hasIssues: "all",
      payoutPending: "all",
      page: 1,
    },
    payouts: {
      status: "all",
      method: "all",
      driverId: "",
      from: "",
      to: "",
      page: 1,
    },
    transactions: {
      status: "all",
      type: "all",
      from: "",
      to: "",
      page: 1,
    },
    customers: {
      search: "",
      status: "all",
      page: 1,
    },
    supportTickets: {
      status: "all",
      search: "",
      priority: "all",
      category: "all",
      assignee: "all",
      page: 1,
    },
    marketingPromotions: {
      status: "active",
      search: "",
      page: 1,
    },
    adminUsers: {
      status: "active",
      search: "",
      page: 1,
    },
    "live-rides": {
      status: "all",
      type: "all",
      driverQuery: "",
      customerQuery: "",
      rideId: "",
      issuesOnly: false,
      viewMode: "both",
    },
  };
}

function isUpdater<T>(
  value: T | ((previous: T) => T),
): value is (previous: T) => T {
  return typeof value === "function";
}

/** Zustand store holding every page's filter drafts. */
export const usePageViewStore = create<PageViewStore>()((set) => ({
  views: createInitialViews(),
  reset: () => set({ views: createInitialViews() }),
  setField: (page, field, value) =>
    set((state) => ({
      views: {
        ...state.views,
        [page]: {
          ...state.views[page],
          [field]: value,
        },
      },
    })),
}));

/**
 * Reads and writes a single page field, mirroring the `useState` tuple.
 * The setter accepts either a value or a functional updater, which always
 * receives the latest store value rather than a stale render closure.
 */
export function usePageViewField<
  Page extends keyof PageViewValues,
  Field extends keyof PageViewValues[Page],
>(
  page: Page,
  field: Field,
): [
  PageViewValues[Page][Field],
  (
    value:
      | PageViewValues[Page][Field]
      | ((
          previous: PageViewValues[Page][Field],
        ) => PageViewValues[Page][Field]),
  ) => void,
] {
  const value = usePageViewStore((state) => state.views[page][field]);
  const setValue = useCallback(
    (
      nextValue:
        | PageViewValues[Page][Field]
        | ((
            previous: PageViewValues[Page][Field],
          ) => PageViewValues[Page][Field]),
    ) => {
      const currentValue = usePageViewStore.getState().views[page][field];

      usePageViewStore
        .getState()
        .setField(
          page,
          field,
          isUpdater(nextValue) ? nextValue(currentValue) : nextValue,
        );
    },
    [field, page],
  );

  return [value, setValue];
}
