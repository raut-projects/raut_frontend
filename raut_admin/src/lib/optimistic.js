const listParamsOf = (key) => {
  const last = key[key.length - 1]
  return last && typeof last === 'object' && !Array.isArray(last) ? last : {}
}

export function insertOptimistic(queryClient, { queryKey, record, matches }) {
  const previous = []

  queryClient.getQueriesData({ queryKey }).forEach(([key, data]) => {
    if (!data) return

    const params = listParamsOf(key)
    if ((params.page ?? 1) !== 1) return
    if (matches && !matches(record, params)) return

    previous.push([key, data])
    queryClient.setQueryData(key, (old) =>
      old ? { ...old, items: [record, ...old.items], total: old.total + 1 } : old,
    )
  })

  return previous
}

export function rollback(queryClient, previous) {
  previous.forEach(([key, data]) => queryClient.setQueryData(key, data))
}

export function replaceOptimistic(queryClient, { queryKey, optimisticId, record }) {
  queryClient.setQueriesData({ queryKey }, (old) => {
    if (!old) return old
    return {
      ...old,
      items: old.items.map((item) => (item.id === optimisticId ? record : item)),
    }
  })
}
