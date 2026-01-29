'use client'

import { Heading, Text } from '@medusajs/ui'
import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description: string
  action?: ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div>
        <Heading level="h1" className="mb-2">{title}</Heading>
        <Text className="text-ui-fg-subtle">{description}</Text>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
