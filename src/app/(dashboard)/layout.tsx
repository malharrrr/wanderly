import Sidebar from '@/components/layout/Sidebar'
import AuthGuard from '@/components/layout/AuthGuard'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-cream-50">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden w-full pt-16 md:pt-0">
          {children}
        </main>
      </div>
    </AuthGuard>
  )
}