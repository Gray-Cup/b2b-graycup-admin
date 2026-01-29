import useSWR, { mutate } from 'swr'

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(res => res.json())

export interface Webhook {
  id: string
  name: string
  url: string
  created_at: string
}

const WEBHOOKS_KEY = '/api/webhooks'

export function useWebhooks() {
  const { data, error, isLoading, isValidating } = useSWR<{ data: Webhook[] }>(
    WEBHOOKS_KEY,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    }
  )

  return {
    data: data?.data ?? [],
    error,
    isLoading,
    isValidating,
    mutate: () => mutate(WEBHOOKS_KEY),
  }
}

export async function createWebhook(name: string, url: string) {
  const response = await fetch(WEBHOOKS_KEY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, url }),
  })

  if (!response.ok) {
    throw new Error('Failed to create webhook')
  }

  await mutate(WEBHOOKS_KEY)
  return response.json()
}

export async function deleteWebhook(id: string) {
  const response = await fetch(`${WEBHOOKS_KEY}?id=${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Failed to delete webhook')
  }

  await mutate(WEBHOOKS_KEY)
}

export async function forwardToDiscord(webhookId: string, data: {
  table: string
  submission: object
}) {
  const response = await fetch('/api/webhooks/forward', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ webhookId, ...data }),
  })

  if (!response.ok) {
    throw new Error('Failed to forward to Discord')
  }

  return response.json()
}

export async function bulkForwardToDiscord(webhookId: string, data: {
  table: string
  submissions: object[]
}) {
  const results = await Promise.allSettled(
    data.submissions.map(submission =>
      forwardToDiscord(webhookId, { table: data.table, submission })
    )
  )

  const succeeded = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  return { succeeded, failed, total: data.submissions.length }
}
