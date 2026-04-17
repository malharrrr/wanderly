'use client'
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

  const initials = session?.user?.name
    ? session.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <aside className="w-56 flex-shrink-0 bg-cream-200 flex flex-col border-r border-amber-200 min-h-screen">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-amber-200">
        <div className="font-lora text-lg font-semibold text-amber-900">🗺 Wanderly</div>
        <div className="text-xs text-amber-700 mt-0.5">AI Travel Planner</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
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
  )
}
