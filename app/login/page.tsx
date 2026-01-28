'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Label, Heading, Text } from '@medusajs/ui'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }

      router.push('/')
      router.refresh()
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ui-bg-subtle">
      <div className="w-full max-w-md p-8 bg-ui-bg-base rounded-lg shadow-elevation-card-rest">
        <div className="mb-8 text-center">
          <Heading level="h1" className="mb-2">GrayCup Admin</Heading>
          <Text className="text-ui-fg-subtle">Sign in to your account</Text>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-ui-fg-error bg-ui-bg-subtle-hover rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            isLoading={loading}
          >
            Sign in
          </Button>
        </form>
      </div>
    </div>
  )
}
