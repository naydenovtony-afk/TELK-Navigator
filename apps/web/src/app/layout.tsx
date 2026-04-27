import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ТЕЛК Навигатор',
  description: 'Навигирайте процеса на ТЕЛК с увереност.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
