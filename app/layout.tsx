// Root layout for homepage.

import React from 'react'
import '@/app/globals.css'
import Navigation from '@/components/navigation' 

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Sunglasses Store - CS340</title>
      </head>
      <body className="app-body">
        <Navigation /> 
        <main className="app-main">
          <div className="app-canvas">{children}</div>
        </main>
      </body>
    </html>
  )
}