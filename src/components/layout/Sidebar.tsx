'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/plan', label: 'Plan a trip', icon: '✨' },
  { href: '/trips', label: 'My trips', icon: '✈️' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false) 

  const initials = session?.user?.name
    ? session.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 bg-cream-200 rounded-lg border border-amber-200 shadow-sm text-amber-900"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>

      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-stone-900/50 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* The Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 md:w-56 flex-shrink-0 bg-cream-200 flex flex-col border-r border-amber-200 min-h-screen
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="px-5 py-6 border-b border-amber-200 flex justify-between items-center">
          <div>
            <div className="font-lora text-lg font-semibold text-amber-900">🗺 Wanderly</div>
            <div className="text-xs text-amber-700 mt-0.5">AI Travel Planner</div>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden p-1 text-amber-900 hover:bg-amber-300 rounded">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)} // Close on click for mobile
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-amber-600 text-white'
                    : 'text-amber-800 hover:bg-amber-100'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-amber-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-xs font-semibold text-amber-900 flex-shrink-0">
              {initials}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-medium text-amber-900 truncate">{session?.user?.name}</div>
              <div className="text-xs text-amber-700 truncate">{session?.user?.email}</div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full text-left text-xs text-amber-700 hover:text-amber-900 transition-colors px-1"
          >
            Sign out →
          </button>
        </div>
      </aside>
    </>
  )
}