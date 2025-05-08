import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { RootProvider } from '@/components/providers/RootProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OFAuto - OnlyFans Content Management & Automation',
  description: 'Automate and optimize your OnlyFans content schedule, engagement, and campaigns',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <RootProvider>
          {children}
        </RootProvider>
      </body>
    </html>
  )
} 