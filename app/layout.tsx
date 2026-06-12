// Root layout for the application.

'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link' // 🌟 FIXED: Use Link instead of standard anchor tags
import { resetDatabase } from '@/actions/database'
import '@/app/globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Native database reset execution line
  async function handleReset() {
    if (!confirm('Database reset? All unsaved changes will be lost.')) return

    const result = await resetDatabase()
    if (result.success) {
      alert('Database has been reset!')
      // 🌟 FIXED FOREVER: Forces active client-side React state arrays to drop stale data and sync
      window.location.reload()
    } else {
      alert(`The server encountered an error during reset: ${result.error}`)
    }
  }

  // Helper function to check if a navigation item matches the current active route path
  function getTabStyle(routePath: string) {
    const isActive = pathname === routePath
    
    if (isActive) {
      return {
        background: '#ffffff',
        color: '#d9534f', // Red highlight for the current page status
        fontWeight: 'bold',
        borderBottom: '2px solid #d9534f'
      }
    }
    
    return {
      background: '#e0e2e5', // Blends into Chrome's standard tab bar area color
      color: '#4a4a4a',
      fontWeight: 'normal',
      borderBottom: 'none'
    }
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Sunglasses Store - CS340</title>
      </head>
      {/* Background color set to Chrome's light gray tab layout frame accent (#f1f3f4) */}
      <body style={{ 
        margin: 0, 
        fontFamily: 'Arial, sans-serif', 
        backgroundColor: '#f1f3f4', 
        color: '#000000',
        minHeight: '100vh'
      }}>
        
        {/* GOOGLE CHROME STYLE HEADER WINDOW FRAME */}
        <header style={{ 
          backgroundColor: '#dee1e6', 
          paddingTop: '8px',
          borderBottom: '1px solid #cacdd1'
        }}>
          
          {/* APPLICATION IDENTITY AND CONTROL STRIP */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', // 🌟 FIXED: Fixed layout parsing string typo
            alignItems: 'center', 
            padding: '0 16px 8px 16px' 
          }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#202124' }}>
              Rainbow Sunglasses Management Terminal
            </span>
            <button 
              onClick={handleReset}
              style={{
                backgroundColor: '#d9534f',
                color: '#ffffff',
                border: '1px solid #d43f3a',
                borderRadius: '4px',
                padding: '4px 12px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Reset Database
            </button>
          </div>

          {/* CHROME HORIZONTAL TAB BAR NAVIGATION ROW */}
          <nav style={{ 
            display: 'flex', 
            alignItems: 'end', 
            paddingLeft: '8px', 
            gap: '4px' 
          }}>
            {/* 🌟 FIXED: Swapped <a> tags for <Link> tags to utilize Next.js pre-fetching */}
            <Link href="/" style={{ ...getTabStyle('/'), padding: '8px 20px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', textDecoration: 'none', fontSize: '13px', transition: 'all 0.15s' }}>
              Home
            </Link>
            <Link href="/customers" style={{ ...getTabStyle('/customers'), padding: '8px 20px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', textDecoration: 'none', fontSize: '13px', transition: 'all 0.15s' }}>
              Customers
            </Link>
            <Link href="/employees" style={{ ...getTabStyle('/employees'), padding: '8px 20px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', textDecoration: 'none', fontSize: '13px', transition: 'all 0.15s' }}>
              Employees
            </Link>
            <Link href="/invoices" style={{ ...getTabStyle('/invoices'), padding: '8px 20px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', textDecoration: 'none', fontSize: '13px', transition: 'all 0.15s' }}>
              Invoices
            </Link>
            <Link href="/sunglasses" style={{ ...getTabStyle('/sunglasses'), padding: '8px 20px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', textDecoration: 'none', fontSize: '13px', transition: 'all 0.15s' }}>
              Sunglasses
            </Link>
            <Link href="/invoice_sunglasses" style={{ ...getTabStyle('/invoice_sunglasses'), padding: '8px 20px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', textDecoration: 'none', fontSize: '13px', transition: 'all 0.15s' }}>
              Invoice Sunglasses
            </Link>
          </nav>
        </header>

        {/* CHROME WHITE VIEWPORT APPLICATION CANVAS CONTAINER */}
        <main style={{ padding: '24px' }}>
          <div style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '8px', 
            padding: '24px', 
            boxShadow: '0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)',
            minHeight: '75vh'
          }}>
            {children}
          </div>
        </main>

      </body>
    </html>
  )
}