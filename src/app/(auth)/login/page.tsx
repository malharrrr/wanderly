'use client'
import React, { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (res?.error) {
      setError('Invalid email or password') 
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-cream-200 opacity-60" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-amber-100 opacity-40" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🗺</div>
          <h1 className="font-lora text-3xl font-semibold text-amber-900">Wanderly</h1>
          <p className="text-amber-700 text-sm mt-1">Your personal AI travel planner</p>
        </div>

        <div className="bg-white rounded-3xl border border-amber-200 p-8 shadow-sm">
          <h2 className="font-lora text-xl font-semibold text-amber-900 mb-6">Welcome back</h2>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}
          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="w-full flex items-center justify-center gap-3 bg-white border border-stone-200 text-stone-700 py-3 rounded-xl font-medium hover:bg-stone-50 transition-colors shadow-sm mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>
          <div className="relative flex items-center py-2 mb-6">
            <div className="flex-grow border-t border-stone-200"></div>
            <span className="flex-shrink-0 mx-4 text-stone-400 text-xs uppercase tracking-wider">Or continue with email</span>
            <div className="flex-grow border-t border-stone-200"></div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input type="email" className="input-field" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <input type="password" className="input-field" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2 flex items-center justify-center gap-2">
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in...</>
              ) : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-amber-100 text-center">
            <span className="text-sm text-amber-700">Don't have an account? </span>
            <Link href="/register" className="text-sm text-amber-600 font-medium hover:underline">
              Create one →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}