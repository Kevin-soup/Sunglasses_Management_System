// Navigation bar.

'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { resetDatabase } from '@/actions/database'

export default function Navigation() {
  // Track current URL path for active tab styling
  const pathname = usePathname()

  // Handle destructive database purge and re-seed
  async function handleReset() {
    if (!confirm('Database reset? All unsaved changes will be lost.')) return

    const result = await resetDatabase()
    if (result.success) {
      alert('Database has been reset!')
      window.location.reload() // Refresh UI state
    } else {
      alert(`The server encountered an error during reset: ${result.error}`)
    }
  }

  // Assign active CSS class if link matches current path
  function getTabClass(routePath: string) {
    return pathname === routePath ? 'chrome-tab active' : 'chrome-tab'
  }

  return (
    <header className="chrome-header">
      {/* Top identity and control bar */}
      <div className="control-strip">
        <span className="app-title">Sunglasses Management Terminal</span>
        
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

      {/* Navigation tabs */}
      <nav className="chrome-tab-bar">
        <Link href="/" className={getTabClass('/')}>Home</Link>
        <Link href="/customers" className={getTabClass('/customers')}>Customers</Link>
        <Link href="/employees" className={getTabClass('/employees')}>Employees</Link>
        <Link href="/invoices" className={getTabClass('/invoices')}>Invoices</Link>
        <Link href="/sunglasses" className={getTabClass('/sunglasses')}>Sunglasses</Link>
        <Link href="/invoice_sunglasses" className={getTabClass('/invoice_sunglasses')}>Invoice Sunglasses</Link>
      </nav>
    </header>
  )
}