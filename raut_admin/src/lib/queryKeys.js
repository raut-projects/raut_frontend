export const queryKeys = {
  customers: {
    all: ['customers'],
    list: (params) => ['customers', 'list', params],
  },
  riders: {
    all: ['riders'],
    list: (params) => ['riders', 'list', params],
  },
  deliveries: {
    all: ['deliveries'],
    list: (params) => ['deliveries', 'list', params],
  },
  dashboard: {
    all: ['dashboard'],
  },
}
