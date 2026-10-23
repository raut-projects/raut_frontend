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
  payouts: {
    all: ['payouts'],
    list: (params) => ['payouts', 'list', params],
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
