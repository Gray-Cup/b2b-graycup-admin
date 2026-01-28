import useSWR, { mutate } from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface UseSubmissionsOptions {
  table: string
  resolved?: 'true' | 'false' | null
}

interface TableCount {
  table: string
  label: string
  href: string
  count: number
}

// Cache for 1 year (in milliseconds)
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000

export function useSubmissions({ table, resolved }: UseSubmissionsOptions) {
  const resolvedParam = resolved ? `&resolved=${resolved}` : ''
  const key = `/api/submissions?table=${table}${resolvedParam}`

  const { data, error, isLoading, isValidating } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    dedupingInterval: ONE_YEAR_MS,
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
  const { data, error, isLoading } = useSWR<{ counts: TableCount[] }>(
    '/api/dashboard/counts',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: ONE_YEAR_MS,
    }
  )

  return {
    counts: data?.counts ?? [] as TableCount[],
    error,
    isLoading,
  }
}

// Revalidate all related caches after mutation
async function revalidateAllCaches(table: string) {
  // Revalidate all filter variants for this table
  await Promise.all([
    mutate(`/api/submissions?table=${table}`),
    mutate(`/api/submissions?table=${table}&resolved=true`),
    mutate(`/api/submissions?table=${table}&resolved=false`),
    mutate('/api/dashboard/counts'),
  ])
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
    { revalidate: false }
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
    { revalidate: false }
  )

  // Revalidate all related caches
  await revalidateAllCaches(table)
}
