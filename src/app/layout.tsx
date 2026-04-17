import type { Metadata } from 'next'
import { Lora, Source_Sans_3 } from 'next/font/google'
import Providers from '@/components/Providers'
import './globals.css'

const lora = Lora({ subsets: ['latin'], variable: '--font-lora', display: 'swap' })
const sourceSans = Source_Sans_3({ subsets: ['latin'], variable: '--font-source', display: 'swap' })

export const metadata: Metadata = {
  title: 'Wanderly — AI Travel Planner',
  description: 'Plan your dream trip with AI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${lora.variable} ${sourceSans.variable}`}>
      <body className="bg-cream-50 font-source text-stone-800 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
