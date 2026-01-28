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

export function useSubmissions({ table, resolved }: UseSubmissionsOptions) {
  const resolvedParam = resolved ? `&resolved=${resolved}` : ''
  const key = `/api/submissions?table=${table}${resolvedParam}`

  const { data, error, isLoading, isValidating } = useSWR(key, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 5000, // Dedupe requests within 5s
    focusThrottleInterval: 10000, // Throttle revalidation on focus
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
      revalidateOnFocus: true,
      refreshInterval: 30000, // Refresh every 30s
      dedupingInterval: 5000,
    }
  )

  return {
    counts: data?.counts ?? [] as TableCount[],
    error,
    isLoading,
  }
}

// Optimistic update helper
export async function updateSubmission(
  table: string,
  id: string,
  resolved: boolean,
  currentFilter: string | null
) {
  // Construct the cache key
  const resolvedParam = currentFilter ? `&resolved=${currentFilter}` : ''
  const key = `/api/submissions?table=${table}${resolvedParam}`

  // Optimistically update the cache
  await mutate(
    key,
    async (currentData: { data: Record<string, unknown>[] } | undefined) => {
      // Make the API call
      await fetch('/api/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, id, resolved }),
      })

      // Return updated data
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

  // Also revalidate dashboard counts
  mutate('/api/dashboard/counts')
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
    { revalidate: false } // Don't revalidate, we already updated optimistically
  )

  mutate('/api/dashboard/counts')
}
