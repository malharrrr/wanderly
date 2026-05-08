import type { Metadata } from "next";
import { Lora, Inter } from "next/font/google";
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import "./globals.css";
import Providers from "@/components/Providers"; 

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: 'swap' });
const lora = Lora({ subsets: ["latin"], variable: "--font-lora", display: 'swap' });

export const metadata: Metadata = {
  title: "Wanderly",
  description: "Your personal AI travel planner",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${lora.variable} font-sans bg-cream-50 text-stone-800`}>
        <Providers>
          {children}
        </Providers>
        <Analytics/>
        <SpeedInsights/>
      </body>
    </html>
  );
}