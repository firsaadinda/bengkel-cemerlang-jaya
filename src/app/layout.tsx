import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bengkel Cemerlang Jaya',
  description:
    'Aplikasi Manajemen Bengkel Cemerlang Jaya - Sistem Pengelolaan Work Order, Inventory, dan Keuangan',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  )
}
