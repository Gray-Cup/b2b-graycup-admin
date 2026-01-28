'use client'

import { Heading, Text } from '@medusajs/ui'

interface PageHeaderProps {
  title: string
  description: string
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <Heading level="h1" className="mb-2">{title}</Heading>
      <Text className="text-ui-fg-subtle">{description}</Text>
    </div>
  )
}
