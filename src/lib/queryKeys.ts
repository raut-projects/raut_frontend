export const queryKeys = {
  customers: {
    all: ["customers"],
    list: (params) => ["customers", "list", params],
    stats: ["customers", "stats"],
  },
  drivers: {
    all: ["drivers"],
    list: (params) => ["drivers", "list", params],
    detail: (driverId) => ["drivers", "detail", driverId],
  },
  documents: {
    all: ["documents"],
    list: (driverId) => ["documents", "list", driverId],
  },
  rides: {
    all: ["rides"],
    list: (params) => ["rides", "list", params],
    summary: ["rides", "summary"],
    dispute: (rideId: string) => ["rides", "dispute", rideId],
  },
  routes: {
    all: ["routes"],
    list: (params) => ["routes", "list", params],
    summary: ["routes", "summary"],
  },
  payouts: {
    all: ["payouts"],
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
    pricing: ["config", "pricing"],
    features: ["config", "features"],
    operations: ["config", "operations"],
    integrations: ["config", "integrations"],
    history: (params) => ["config", "history", params],
  },
  me: {
    all: ["me"],
  },
  supportTickets: {
    all: ["support-tickets"],
    list: (params) => ["support-tickets", "list", params],
    detail: (ticketId) => ["support-tickets", "detail", ticketId],
    agents: ["support-tickets", "agents"],
  },
  adminUsers: {
    all: ["admin-users"],
    list: (params) => ["admin-users", "list", params],
    detail: (userId) => ["admin-users", "detail", userId],
  },
  marketing: {
    all: ["marketing"],
    promotions: {
      all: ["marketing", "promotions"],
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
      list: (params) => ["referrals", "programs", "list", params],
      detail: (programId) => ["referrals", "programs", "detail", programId],
    },
    users: {
      all: ["referrals", "users"],
      list: (params) => ["referrals", "users", "list", params],
      detail: (userId) => ["referrals", "users", "detail", userId],
    },
    relationships: {
      all: ["referrals", "relationships"],
      list: (params) => ["referrals", "relationships", "list", params],
    },
    stats: (params) => ["referrals", "stats", params],
    topReferrers: (limit) => ["referrals", "top-referrers", limit],
    pendingPayments: ["referrals", "payments", "pending"],
    myCode: ["referrals", "my-code"],
  },
};
