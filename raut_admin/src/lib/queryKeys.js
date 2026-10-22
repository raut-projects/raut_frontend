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
