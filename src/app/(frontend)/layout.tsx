'use client'

import React from 'react'
import './styles.css'
import { SessionProvider } from 'next-auth/react'
import 'katex/dist/katex.min.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <main>{children}</main>
        </SessionProvider>
      </body>
    </html>
  )
}

