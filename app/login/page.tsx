'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@medusajs/ui'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileInstance>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!turnstileToken) {
      setError('Please complete the security check')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, turnstileToken }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        turnstileRef.current?.reset()
        setTurnstileToken(null)
        return
      }

      router.push('/')
      router.refresh()
    } catch {
      setError('An error occurred. Please try again.')
      turnstileRef.current?.reset()
      setTurnstileToken(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100">
      <div className="w-full max-w-sm p-8 bg-white border border-neutral-200 rounded-lg">
        <div className="mb-6">
          <h1 className="text-lg font-medium text-neutral-900">GrayCup Admin</h1>
          <p className="mt-1 text-sm text-neutral-500">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-2 text-sm text-red-600 bg-red-50 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm text-neutral-600 mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
              className="w-full px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 bg-neutral-50 border border-neutral-200 rounded focus:border-neutral-400 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-neutral-600 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 bg-neutral-50 border border-neutral-200 rounded focus:border-neutral-400 focus:outline-none transition-colors"
            />
          </div>

          <Turnstile
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onSuccess={setTurnstileToken}
            onError={() => setTurnstileToken(null)}
            onExpire={() => setTurnstileToken(null)}
          />

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
