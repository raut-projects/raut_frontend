// Centralised TanStack Query key factory. Keys are hierarchical (entity -> scope
// -> params) so invalidation can target whole groups or single entries.

export const queryKeys = {
  customers: {
    all: ["customers"],
    lists: () => ["customers", "list"],
    list: (params) => ["customers", "list", params],
    stats: ["customers", "stats"],
  },
  drivers: {
    all: ["drivers"],
    lists: () => ["drivers", "list"],
    list: (params) => ["drivers", "list", params],
    detail: (driverId) => ["drivers", "detail", driverId],
  },
  documents: {
    all: ["documents"],
    list: (driverId) => ["documents", "list", driverId],
  },
  rides: {
    all: ["rides"],
    lists: () => ["rides", "list"],
    list: (params) => ["rides", "list", params],
    summary: ["rides", "summary"],
    dispute: (rideId: string) => ["rides", "dispute", rideId],
  },
  liveRides: {
    all: ["liveRides"],
    list: (params) => ["liveRides", "list", params],
    detail: (rideId: string) => ["liveRides", "detail", rideId],
    history: (rideId: string) => ["liveRides", "history", rideId],
  },
  routes: {
    all: ["routes"],
    lists: () => ["routes", "list"],
    list: (params) => ["routes", "list", params],
    summary: ["routes", "summary"],
  },
  payouts: {
    all: ["payouts"],
    lists: () => ["payouts", "list"],
    list: (params) => ["payouts", "list", params],
    batchReview: ["payouts", "batch-review"],
    batchProcessing: ["payouts", "batch-processing"],
    batchFailures: ["payouts", "batch-failures"],
  },
  transactions: {
    all: ["transactions"],
    list: (params) => ["transactions", "list", params],
    summary: ["transactions", "summary"],
  },
  dashboard: {
    all: ["dashboard"],
    stats: ["dashboard", "stats"],
    alerts: ["dashboard", "alerts"],
    hourlyRevenue: (date) => ["dashboard", "hourly-revenue", date ?? "today"],
    health: ["dashboard", "health"],
    mapRides: ["dashboard", "map-rides"],
    byRange: (range, compare) => [
      "dashboard",
      range.startStr,
      range.endStr,
      range.granularity,
      range.daysBack,
      compare,
    ],
  },
  notifications: {
    all: ["notifications"],
  },
  config: {
    all: ["config"],
    list: (filters) => ["config", "list", filters ?? {}],
    detail: (configKey, scope) => ["config", "detail", configKey, scope ?? {}],
    history: (configKey, limit) => ["config", "history", configKey, limit],
  },
  me: {
    all: ["me"],
  },
  rbac: {
    all: ["rbac"],
    permissions: ["rbac", "permissions"],
    roles: ["rbac", "roles"],
    regions: ["rbac", "regions"],
  },
  staff: {
    all: ["staff"],
    lists: () => ["staff", "list"],
    list: (params) => ["staff", "list", params],
    invitations: ["staff", "invitations"],
    invitationLists: () => ["staff", "invitations", "list"],
    invitationList: (params) => ["staff", "invitations", "list", params],
    invitationVerification: (token) => [
      "staff",
      "invitations",
      "verify",
      token,
    ],
  },
  supportTickets: {
    all: ["support-tickets"],
    lists: () => ["support-tickets", "list"],
    list: (params) => ["support-tickets", "list", params],
    detail: (ticketId) => ["support-tickets", "detail", ticketId],
    agents: ["support-tickets", "agents"],
  },
  marketing: {
    all: ["marketing"],
    promotions: {
      all: ["marketing", "promotions"],
      lists: () => ["marketing", "promotions", "list"],
      list: (params) => ["marketing", "promotions", "list", params],
      detail: (promotionId) => [
        "marketing",
        "promotions",
        "detail",
        promotionId,
      ],
    },
  },
  referrals: {
    all: ["referrals"],
    programs: {
      all: ["referrals", "programs"],
      lists: () => ["referrals", "programs", "list"],
      list: (params) => ["referrals", "programs", "list", params],
      detail: (programId) => ["referrals", "programs", "detail", programId],
    },
    users: {
      all: ["referrals", "users"],
      lists: () => ["referrals", "users", "list"],
      list: (params) => ["referrals", "users", "list", params],
      detail: (userId) => ["referrals", "users", "detail", userId],
    },
    relationships: {
      all: ["referrals", "relationships"],
      lists: () => ["referrals", "relationships", "list"],
      list: (params) => ["referrals", "relationships", "list", params],
    },
    statsAll: () => ["referrals", "stats"],
    stats: (params) => ["referrals", "stats", params],
    topReferrersAll: () => ["referrals", "top-referrers"],
    topReferrers: (limit) => ["referrals", "top-referrers", limit],
    pendingPayments: ["referrals", "payments", "pending"],
    myCode: ["referrals", "my-code"],
  },
};
