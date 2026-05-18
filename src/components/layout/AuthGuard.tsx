'use client'

import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // if the user is unauthenticated AND they are NOT on the guest viewer, kick them to login
    if (status === 'unauthenticated' && pathname !== '/trips/guest') {
      router.push('/login')
    }
  }, [status, pathname, router])

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center text-amber-900 font-medium bg-cream-50">Loading...</div>
  }

  // prevent a flash of unauthorized content if they hit a protected route directly
  if (status === 'unauthenticated' && pathname !== '/trips/guest') {
    return null 
  }

  return <>{children}</>
}