export const queryKeys = {
  customers: {
    all: ['customers'],
    list: (params) => ['customers', 'list', params],
  },
  drivers: {
    all: ['drivers'],
    list: (params) => ['drivers', 'list', params],
  },
  documents: {
    all: ['documents'],
    list: (driverId) => ['documents', 'list', driverId],
  },
  rides: {
    all: ['rides'],
    list: (params) => ['rides', 'list', params],
    summary: ['rides', 'summary'],
  },
  routes: {
    all: ['routes'],
    list: (params) => ['routes', 'list', params],
    summary: ['routes', 'summary'],
  },
  payouts: {
    all: ['payouts'],
    list: (params) => ['payouts', 'list', params],
  },
  transactions: {
    all: ['transactions'],
    list: (params) => ['transactions', 'list', params],
    summary: ['transactions', 'summary'],
  },
  dashboard: {
    all: ['dashboard'],
  },
  notifications: {
    all: ['notifications'],
  },
  me: {
    all: ['me'],
  },
}
