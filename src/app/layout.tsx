import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ResepPintar - Resep AI dari Bahan yang Kamu Punya',
  description:
    'Masukkan bahan-bahan yang kamu punya, AI akan membuatkan resep masakan Indonesia yang lezat!',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
