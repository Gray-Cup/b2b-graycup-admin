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
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="w-full max-w-sm p-8">
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-medium text-neutral-900">GrayCup Admin</h1>
          <p className="mt-2 text-sm text-neutral-500">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm text-neutral-600 mb-1.5">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              className="w-full px-0 py-2 text-neutral-900 placeholder-neutral-400 bg-transparent border-0 border-b border-neutral-200 focus:border-neutral-900 focus:outline-none focus:ring-0 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-neutral-600 mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full px-0 py-2 text-neutral-900 placeholder-neutral-400 bg-transparent border-0 border-b border-neutral-200 focus:border-neutral-900 focus:outline-none focus:ring-0 transition-colors"
            />
          </div>

          <div className="pt-2">
            <Turnstile
              ref={turnstileRef}
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
              onSuccess={setTurnstileToken}
              onError={() => setTurnstileToken(null)}
              onExpire={() => setTurnstileToken(null)}
            />
          </div>

          <Button
            type="submit"
            className="w-full mt-4"
            isLoading={loading}
          >
            Sign in
          </Button>
        </form>
      </div>
    </div>
  )
}
