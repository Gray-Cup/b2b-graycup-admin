'use client'

import { useMemo, useState } from 'react'
import { PageHeader } from '@/app/components/page-header'
import { Badge, Button, Text, Select } from '@medusajs/ui'
import { format } from 'date-fns'
import { useSubmissions } from '@/lib/hooks/use-submissions'

interface Feedback {
  id: string
  company: string
  name: string
  email: string
  feedback_type: string
  rating: string
  feedback: string
  resolved: boolean
  created_at: string
}

const ratingColors: Record<string, 'green' | 'blue' | 'orange' | 'red' | 'grey'> = {
  Excellent: 'green',
  Good: 'blue',
  Average: 'orange',
  Poor: 'red',
}

export function AnalyzePage() {
  const [selectedRating, setSelectedRating] = useState<string>('All')
  const { data, isLoading } = useSubmissions({
    table: 'feedback_submissions',
    resolved: null, // Get all feedback
  })

  const feedbackData = data as Feedback[]

  // Calculate statistics
  const stats = useMemo(() => {
    const total = feedbackData.length
    const byRating: Record<string, number> = {
      Excellent: 0,
      Good: 0,
      Average: 0,
      Poor: 0,
    }

    feedbackData.forEach((f) => {
      if (f.rating in byRating) {
        byRating[f.rating]++
      }
    })

    return { total, byRating }
  }, [feedbackData])

  // Filter feedback by selected rating
  const filteredFeedback = useMemo(() => {
    if (selectedRating === 'All') return feedbackData
    return feedbackData.filter((f) => f.rating === selectedRating)
  }, [feedbackData, selectedRating])

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy')
    } catch {
      return dateString
    }
  }

  const handleEmailAll = () => {
    const emails = filteredFeedback
      .filter((f) => f.email)
      .map((f) => f.email)
      .join(',')

    if (emails) {
      window.location.href = `mailto:${emails}?subject=Feedback Follow-up&body=Hi,%0A%0AThank you for your feedback. We would love to hear more about your experience and how we can improve.%0A%0ABest regards,%0AGrayCup Team`
    }
  }

  if (isLoading) {
    return (
      <>
        <PageHeader title="Analyze Feedback" description="Feedback analytics and insights" />
        <div className="p-8 text-center">
          <Text className="text-ui-fg-subtle">Loading...</Text>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Analyze Feedback" description="Feedback analytics and insights" />

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {/* All option */}
        <button
          onClick={() => setSelectedRating('All')}
          className={`
            p-4 rounded-lg border transition-all text-left
            ${selectedRating === 'All'
              ? 'border-ui-border-interactive bg-ui-bg-interactive-subtle'
              : 'border-ui-border-base bg-ui-bg-base hover:border-ui-border-strong'
            }
          `}
        >
          <div className="flex items-center justify-between mb-2">
            <Badge color="purple">All</Badge>
            <Text className="text-2xl font-bold text-ui-fg-base">{stats.total}</Text>
          </div>
          <Text className="text-sm text-ui-fg-subtle">100%</Text>
        </button>
        {Object.entries(stats.byRating).map(([rating, count]) => {
          const percentage = stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : '0'
          return (
            <button
              key={rating}
              onClick={() => setSelectedRating(rating)}
              className={`
                p-4 rounded-lg border transition-all text-left
                ${selectedRating === rating
                  ? 'border-ui-border-interactive bg-ui-bg-interactive-subtle'
                  : 'border-ui-border-base bg-ui-bg-base hover:border-ui-border-strong'
                }
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <Badge color={ratingColors[rating] ?? 'grey'}>{rating}</Badge>
                <Text className="text-2xl font-bold text-ui-fg-base">{count}</Text>
              </div>
              <Text className="text-sm text-ui-fg-subtle">{percentage}% of total</Text>
            </button>
          )
        })}
      </div>

      {/* Filtered Results Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Select value={selectedRating} onValueChange={setSelectedRating}>
            <Select.Trigger>
              <Select.Value placeholder="Select rating" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="All">All</Select.Item>
              <Select.Item value="Excellent">Excellent</Select.Item>
              <Select.Item value="Good">Good</Select.Item>
              <Select.Item value="Average">Average</Select.Item>
              <Select.Item value="Poor">Poor</Select.Item>
            </Select.Content>
          </Select>
          <Text className="text-ui-fg-subtle">
            {filteredFeedback.length} {filteredFeedback.length === 1 ? 'result' : 'results'}
          </Text>
        </div>

        {filteredFeedback.length > 0 && (
          <Button variant="secondary" onClick={handleEmailAll}>
            Email All ({filteredFeedback.filter(f => f.email).length})
          </Button>
        )}
      </div>

      {/* Feedback List */}
      {filteredFeedback.length === 0 ? (
        <div className="p-8 text-center bg-ui-bg-base rounded-lg border border-ui-border-base">
          <Text className="text-ui-fg-subtle">
            {selectedRating === 'All' ? 'No feedback yet' : `No feedback with "${selectedRating}" rating`}
          </Text>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFeedback.map((item) => (
            <div
              key={item.id}
              className="bg-ui-bg-base rounded-lg border border-ui-border-base p-4"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                {/* Left: Contact Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Text className="font-medium text-ui-fg-base">{item.name || 'Anonymous'}</Text>
                    {item.company && (
                      <Text className="text-sm text-ui-fg-subtle">({item.company})</Text>
                    )}
                  </div>

                  {item.email && (
                    <a
                      href={`mailto:${item.email}?subject=Feedback Follow-up&body=Hi ${item.name || ''},%0A%0AThank you for your feedback. We noticed you rated your experience as "${item.rating}" and would love to hear more about how we can improve.%0A%0ABest regards,%0AGrayCup Team`}
                      className="text-sm text-ui-fg-interactive hover:underline"
                    >
                      {item.email}
                    </a>
                  )}

                  {item.feedback && (
                    <div className="mt-3 p-3 bg-ui-bg-subtle rounded-md">
                      <Text className="text-xs text-ui-fg-muted uppercase tracking-wide mb-1">
                        Feedback
                      </Text>
                      <Text className="text-sm text-ui-fg-base">{item.feedback}</Text>
                    </div>
                  )}
                </div>

                {/* Right: Meta Info */}
                <div className="flex flex-row md:flex-col items-center md:items-end gap-3">
                  <Badge color={ratingColors[item.rating] ?? 'grey'}>{item.rating}</Badge>
                  <Text className="text-xs text-ui-fg-muted">{formatDate(item.created_at)}</Text>
                  {item.email && (
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => {
                        window.location.href = `mailto:${item.email}?subject=Feedback Follow-up&body=Hi ${item.name || ''},%0A%0AThank you for your feedback. We noticed you rated your experience as "${item.rating}" and would love to hear more about how we can improve.%0A%0ABest regards,%0AGrayCup Team`
                      }}
                    >
                      Contact
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
