'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      setLoading(false)
      return
    }

    // Auto sign in after register
    await signIn('credentials', { email: form.email, password: form.password, redirect: false })
    router.push('/dashboard')
    router.refresh()
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
          <p className="text-amber-700 text-sm mt-1">Start planning your next adventure</p>
        </div>

        <div className="bg-white rounded-3xl border border-amber-200 p-8 shadow-sm">
          <h2 className="font-lora text-xl font-semibold text-amber-900 mb-6">Create your account</h2>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label block">Full name</label>
              <input
                className="input-field"
                placeholder="Alex Johnson"
                value={form.name}
                onChange={e => update('name', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label block">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="alex@email.com"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label block">Password</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label block">Confirm</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={form.confirm}
                  onChange={e => update('confirm', e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </>
              ) : 'Create account'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-amber-100 text-center">
            <span className="text-sm text-amber-700">Already have an account? </span>
            <Link href="/login" className="text-sm text-amber-600 font-medium hover:underline">
              Sign in →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
