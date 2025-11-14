import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lokolo - Discover Black-Owned Businesses',
  description: 'Find and support Black-owned local businesses in Southern Africa',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  themeColor: '#B85C1A',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
