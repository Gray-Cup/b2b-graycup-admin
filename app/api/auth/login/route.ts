import { NextResponse } from 'next/server'
import { createToken, validateCredentials } from '@/lib/auth'

async function verifyTurnstileToken(token: string): Promise<boolean> {
  const response = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY!,
        response: token,
      }),
    }
  )
  const data = await response.json()
  return data.success === true
}

export async function POST(request: Request) {
  try {
    const { username, password, turnstileToken } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    if (!turnstileToken) {
      return NextResponse.json(
        { error: 'Security verification required' },
        { status: 400 }
      )
    }

    const isTurnstileValid = await verifyTurnstileToken(turnstileToken)
    if (!isTurnstileValid) {
      return NextResponse.json(
        { error: 'Security verification failed' },
        { status: 400 }
      )
    }

    if (!validateCredentials(username, password)) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const token = await createToken(username)

    const response = NextResponse.json({ success: true })
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    })

    return response
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
