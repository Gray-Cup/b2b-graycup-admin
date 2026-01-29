'use client'

import { useState } from 'react'
import { PageHeader } from '@/app/components/page-header'
import { Button, Text, Input, toast } from '@medusajs/ui'
import { Plus, Trash } from '@medusajs/icons'
import { useWebhooks, createWebhook, deleteWebhook } from '@/lib/hooks/use-webhooks'

export function ConnectionsPage() {
  const { data: webhooks, isLoading } = useWebhooks()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddWebhook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newUrl.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    if (!newUrl.startsWith('https://discord.com/api/webhooks/')) {
      toast.error('Please enter a valid Discord webhook URL')
      return
    }

    setIsSubmitting(true)
    try {
      await createWebhook(newName.trim(), newUrl.trim())
      toast.success('Webhook added successfully')
      setNewName('')
      setNewUrl('')
      setShowAddForm(false)
    } catch {
      toast.error('Failed to add webhook')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteWebhook = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return
    try {
      await deleteWebhook(id)
      toast.success('Webhook deleted')
    } catch {
      toast.error('Failed to delete webhook')
    }
  }

  return (
    <>
      <PageHeader
        title="Connections"
        description="Manage integrations and webhooks"
      />

      <div className="max-w-2xl">
        {/* Discord Card */}
        <div className="bg-ui-bg-base rounded-lg border border-ui-border-base overflow-hidden">
          {/* Card Header */}
          <div className="p-4 border-b border-ui-border-base flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#5865F2] flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </div>
            <div>
              <Text className="font-medium text-ui-fg-base">Discord Webhooks</Text>
              <Text className="text-sm text-ui-fg-subtle">Forward submissions to Discord channels</Text>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-4">
            {isLoading ? (
              <Text className="text-ui-fg-subtle">Loading webhooks...</Text>
            ) : webhooks.length === 0 && !showAddForm ? (
              <div className="text-center py-6">
                <Text className="text-ui-fg-subtle mb-4">No webhooks configured yet</Text>
                <Button variant="secondary" onClick={() => setShowAddForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Discord Webhook
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Existing Webhooks */}
                {webhooks.map((webhook) => (
                  <div
                    key={webhook.id}
                    className="flex items-center justify-between p-3 bg-ui-bg-subtle rounded-lg"
                  >
                    <div className="min-w-0 flex-1">
                      <Text className="font-medium text-ui-fg-base truncate">{webhook.name}</Text>
                      <Text className="text-xs text-ui-fg-muted truncate">{webhook.url}</Text>
                    </div>
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() => handleDeleteWebhook(webhook.id, webhook.name)}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                {/* Add Form */}
                {showAddForm ? (
                  <form onSubmit={handleAddWebhook} className="p-3 bg-ui-bg-subtle rounded-lg space-y-3">
                    <div>
                      <Text className="text-sm text-ui-fg-subtle mb-1">Webhook Name</Text>
                      <Input
                        placeholder="e.g., Sales Notifications"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Text className="text-sm text-ui-fg-subtle mb-1">Webhook URL</Text>
                      <Input
                        placeholder="https://discord.com/api/webhooks/..."
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="secondary"
                        size="small"
                        onClick={() => {
                          setShowAddForm(false)
                          setNewName('')
                          setNewUrl('')
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" size="small" isLoading={isSubmitting}>
                        Add Webhook
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => setShowAddForm(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Webhook
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
