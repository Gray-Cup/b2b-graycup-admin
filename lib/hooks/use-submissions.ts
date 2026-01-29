import useSWR, { mutate } from 'swr'

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(res => res.json())

interface UseSubmissionsOptions {
  table: string
  resolved?: 'true' | 'false' | null
  vaulted?: 'true' | 'false' | null
}

export interface TableCount {
  table: string
  label: string
  href: string
  count: number
  unreadCount?: number
}

export function useSubmissions({ table, resolved, vaulted }: UseSubmissionsOptions) {
  const resolvedParam = resolved ? `&resolved=${resolved}` : ''
  const vaultedParam = vaulted ? `&vaulted=${vaulted}` : ''
  const key = `/api/submissions?table=${table}${resolvedParam}${vaultedParam}`

  const { data, error, isLoading, isValidating } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 1000, // 1 second deduping to prevent spam
  })

  return {
    data: data?.data ?? [],
    error,
    isLoading,
    isValidating,
    mutate: () => mutate(key),
  }
}

export function useDashboardCounts() {
  const { data, error, isLoading, mutate: mutateCounts } = useSWR<{ counts: TableCount[] }>(
    '/api/dashboard/counts',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 1000,
    }
  )

  return {
    counts: data?.counts ?? [] as TableCount[],
    error,
    isLoading,
    mutate: mutateCounts,
  }
}

export function useVaultCounts() {
  const { data, error, isLoading, mutate: mutateCounts } = useSWR<{ counts: TableCount[] }>(
    '/api/dashboard/vault-counts',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 1000,
    }
  )

  return {
    counts: data?.counts ?? [] as TableCount[],
    error,
    isLoading,
    mutate: mutateCounts,
  }
}

// Revalidate all related caches after mutation
export async function revalidateAllCaches(table?: string) {
  const tables = table
    ? [table]
    : ['contact_submissions', 'quote_requests', 'sample_requests', 'feedback_submissions', 'product_requests', 'call_requests']

  const promises: Promise<unknown>[] = []

  for (const t of tables) {
    promises.push(
      mutate(`/api/submissions?table=${t}`),
      mutate(`/api/submissions?table=${t}&resolved=true`),
      mutate(`/api/submissions?table=${t}&resolved=false`),
      mutate(`/api/submissions?table=${t}&vaulted=true`),
      mutate(`/api/submissions?table=${t}&vaulted=false`),
    )
  }
  promises.push(mutate('/api/dashboard/counts'))
  promises.push(mutate('/api/dashboard/vault-counts'))

  await Promise.all(promises)
}

// Optimistic update helper
export async function updateSubmission(
  table: string,
  id: string,
  resolved: boolean,
  currentFilter: string | null
) {
  const resolvedParam = currentFilter ? `&resolved=${currentFilter}` : ''
  const key = `/api/submissions?table=${table}${resolvedParam}`

  // Optimistically update the current view
  await mutate(
    key,
    async (currentData: { data: Record<string, unknown>[] } | undefined) => {
      // Make the API call
      await fetch('/api/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, id, resolved }),
      })

      if (!currentData?.data) return currentData

      return {
        ...currentData,
        data: currentData.data.map(item =>
          item.id === id ? { ...item, resolved } : item
        ),
      }
    },
    { revalidate: true }
  )

  // Revalidate all related caches
  await revalidateAllCaches(table)
}

export async function deleteSubmission(
  table: string,
  id: string,
  currentFilter: string | null
) {
  const resolvedParam = currentFilter ? `&resolved=${currentFilter}` : ''
  const key = `/api/submissions?table=${table}${resolvedParam}`

  await mutate(
    key,
    async (currentData: { data: Record<string, unknown>[] } | undefined) => {
      await fetch(`/api/submissions?table=${table}&id=${id}`, {
        method: 'DELETE',
      })

      if (!currentData?.data) return currentData

      return {
        ...currentData,
        data: currentData.data.filter(item => item.id !== id),
      }
    },
    { revalidate: true }
  )

  // Revalidate all related caches
  await revalidateAllCaches(table)
}

export async function vaultSubmission(
  table: string,
  id: string,
  vaulted: boolean,
  currentFilter: string | null
) {
  const resolvedParam = currentFilter ? `&resolved=${currentFilter}` : ''
  const key = `/api/submissions?table=${table}${resolvedParam}`

  // Optimistically update the current view
  await mutate(
    key,
    async (currentData: { data: Record<string, unknown>[] } | undefined) => {
      // Make the API call
      await fetch('/api/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, id, vaulted }),
      })

      if (!currentData?.data) return currentData

      return {
        ...currentData,
        data: currentData.data.map(item =>
          item.id === id ? { ...item, vaulted } : item
        ),
      }
    },
    { revalidate: true }
  )

  // Revalidate all related caches
  await revalidateAllCaches(table)
}
