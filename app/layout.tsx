// Root layout for the application.

'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link' 
import { resetDatabase } from '@/actions/database'
import '@/app/globals.css'

export const metadata = {
  title: 'Sunglasses Management System',
  viewport: 'width=device-width, initial-scale=1', 
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Native database reset execution line.
  async function handleReset() {
    if (!confirm('Database reset? All unsaved changes will be lost.')) return

    const result = await resetDatabase()
    if (result.success) {
      alert('Database has been reset!')
      window.location.reload()
    } else {
      alert(`The server encountered an error during reset: ${result.error}`)
    }
  }

  // Check if a navigation item matches the current route.
  function getTabClass(routePath: string) {
    return pathname === routePath ? 'chrome-tab active' : 'chrome-tab'
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Sunglasses Store - CS340</title>
      </head>
      <body className="app-body">
        <header className="chrome-header">
          
          {/* APPLICATION IDENTITY AND CONTROL STRIP */}
          <div className="control-strip">
            <span className="app-title">
              Sunglasses Management Terminal
            </span>
            
            {/* CONTAINER FOR STATUS BADGE */}
            <div className="control-actions">
              <div className="nav-status-badge">
                <span className="status-dot-pulse"></span>
                <span className="nav-status-text">Database Connected</span>
              </div>
              <button onClick={handleReset} className="reset-btn">
                Reset Database
              </button>
            </div>
          </div>

          {/* HORIZONTAL TAB BAR NAVIGATION ROW */}
          <nav className="chrome-tab-bar">
            <Link href="/" className={getTabClass('/')}>
              Home
            </Link>
            <Link href="/customers" className={getTabClass('/customers')}>
              Customers
            </Link>
            <Link href="/employees" className={getTabClass('/employees')}>
              Employees
            </Link>
            <Link href="/invoices" className={getTabClass('/invoices')}>
              Invoices
            </Link>
            <Link href="/sunglasses" className={getTabClass('/sunglasses')}>
              Sunglasses
            </Link>
            <Link href="/invoice_sunglasses" className={getTabClass('/invoice_sunglasses')}>
              Invoice Sunglasses
            </Link>
          </nav>
        </header>

        {/* WHITE VIEWPORT APPLICATION CANVAS CONTAINER */}
        <main className="app-main">
          <div className="app-canvas">
            {children}
          </div>
        </main>

      </body>
    </html>
  )
}