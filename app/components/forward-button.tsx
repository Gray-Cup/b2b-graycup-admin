'use client'

import { useState, useRef, useEffect } from 'react'
import { Button, Text, toast } from '@medusajs/ui'
import { ArrowUpRightOnBox } from '@medusajs/icons'
import { useWebhooks, forwardToDiscord } from '@/lib/hooks/use-webhooks'

interface ForwardButtonProps {
  table: string
  submission: object
}

export function ForwardButton({ table, submission }: ForwardButtonProps) {
  const { data: webhooks, isLoading } = useWebhooks()
  const [isOpen, setIsOpen] = useState(false)
  const [isSending, setIsSending] = useState<string | null>(null)
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

  const handleForward = async (webhookId: string, webhookName: string) => {
    setIsSending(webhookId)
    try {
      await forwardToDiscord(webhookId, { table, submission })
      toast.success(`Sent to ${webhookName}`)
      setIsOpen(false)
    } catch {
      toast.error('Failed to forward')
    } finally {
      setIsSending(null)
    }
  }

  if (isLoading) {
    return (
      <Button variant="secondary" size="small" disabled>
        <ArrowUpRightOnBox className="w-4 h-4" />
      </Button>
    )
  }

  if (webhooks.length === 0) {
    return (
      <Button
        variant="secondary"
        size="small"
        onClick={() => toast.info('Add a Discord webhook in Connections first')}
        title="No webhooks configured"
      >
        <ArrowUpRightOnBox className="w-4 h-4" />
      </Button>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="secondary"
        size="small"
        onClick={() => setIsOpen(!isOpen)}
        title="Forward to Discord"
      >
        <ArrowUpRightOnBox className="w-4 h-4" />
      </Button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-1 w-48 bg-ui-bg-base border border-ui-border-base rounded-lg shadow-lg overflow-hidden z-50">
          <div className="p-2 border-b border-ui-border-base">
            <Text className="text-xs text-ui-fg-muted font-medium">Send to Discord</Text>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {webhooks.map((webhook) => (
              <button
                key={webhook.id}
                onClick={() => handleForward(webhook.id, webhook.name)}
                disabled={isSending !== null}
                className="w-full px-3 py-2 text-left text-sm text-ui-fg-base hover:bg-ui-bg-subtle transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSending === webhook.id ? (
                  <span className="text-ui-fg-muted">Sending...</span>
                ) : (
                  <span className="truncate">{webhook.name}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
