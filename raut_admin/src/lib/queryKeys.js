export const queryKeys = {
  customers: {
    all: ['customers'],
    list: (params) => ['customers', 'list', params],
  },
  riders: {
    all: ['riders'],
    list: (params) => ['riders', 'list', params],
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
