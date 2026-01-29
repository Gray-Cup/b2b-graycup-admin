'use client'

import { useState, useRef, useEffect } from 'react'
import { Button, Text, toast } from '@medusajs/ui'
import { ArrowUpRightOnBox } from '@medusajs/icons'
import { useWebhooks, bulkForwardToDiscord } from '@/lib/hooks/use-webhooks'

interface BulkForwardDropdownProps {
  tableName: string
  selectedSubmissions: object[]
  onSuccess: () => void
}

export function BulkForwardDropdown({
  tableName,
  selectedSubmissions,
  onSuccess,
}: BulkForwardDropdownProps) {
  const { data: webhooks, isLoading } = useWebhooks()
  const [isOpen, setIsOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleBulkForward = async (webhookId: string, webhookName: string) => {
    setIsSending(true)
    try {
      const result = await bulkForwardToDiscord(webhookId, {
        table: tableName,
        submissions: selectedSubmissions,
      })
      if (result.failed > 0) {
        toast.warning(`Sent ${result.succeeded}/${result.total} to ${webhookName}`)
      } else {
        toast.success(`Sent ${result.succeeded} items to ${webhookName}`)
      }
      setIsOpen(false)
      onSuccess()
    } catch {
      toast.error('Failed to forward')
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading || webhooks.length === 0) {
    return (
      <Button variant="secondary" size="small" disabled>
        <ArrowUpRightOnBox className="w-4 h-4 mr-2" />
        Forward
      </Button>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="secondary"
        size="small"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSending}
      >
        <ArrowUpRightOnBox className="w-4 h-4 mr-2" />
        {isSending ? 'Sending...' : 'Forward'}
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-ui-bg-base border border-ui-border-base rounded-lg shadow-lg overflow-hidden z-50">
          <div className="p-2 border-b border-ui-border-base">
            <Text className="text-xs text-ui-fg-muted font-medium">Send to Discord</Text>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {webhooks.map((webhook) => (
              <button
                key={webhook.id}
                onClick={() => handleBulkForward(webhook.id, webhook.name)}
                disabled={isSending}
                className="w-full px-3 py-2 text-left text-sm text-ui-fg-base hover:bg-ui-bg-subtle transition-colors disabled:opacity-50"
              >
                {webhook.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
