'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { getDatabaseVersions, DatabaseVersion, restoreDatabaseToVersion } from '@/actions/database'

export default function VersionDropdown() {
  const [versions, setVersions] = useState<DatabaseVersion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchVersions = useCallback(() => {
    getDatabaseVersions().then(setVersions)
  }, [])

  useEffect(() => {
    fetchVersions()

    // Poll for changes or listen for custom reset events from the reset button
    window.addEventListener('databaseRefreshed', fetchVersions)
    return () => {
      window.removeEventListener('databaseRefreshed', fetchVersions)
    }
  }, [fetchVersions])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
    }
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  async function handleVersionClick(branchId: string, versionName: string) {
    const confirmed = window.confirm(`Are you sure you want to rollback the application data to ${versionName}?`)
    if (!confirmed) return

    setIsRestoring(true)
    try {
      const result = await restoreDatabaseToVersion(branchId)
      if (result.success) {
        alert(`Application data rolled back to ${versionName}`)
        window.location.reload()
      } else {
        alert(`Rollback failed: ${result.error}`)
      }
    } catch (err) {
      alert('An error occurred during snapshot rollback execution.')
    } finally {
      setIsRestoring(false)
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="version-dropdown-container">
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        disabled={isRestoring}
        className="version-trigger-btn"
      >
        {isRestoring ? 'Restoring...' : `Database Rollback (${versions.length})`}
      </button>

      <div className={`version-menu-popup ${isOpen ? 'is-open' : ''}`}>
        {versions.length === 0 ? (
          <span className="version-no-backups">
            No recent backups found
          </span>
        ) : (
          versions.map((version) => (
            <button
              key={version.id}
              type="button"
              onClick={() => handleVersionClick(version.id, version.name)}
              className="version-item-link"
              style={{ 
                width: '100%', 
                textAlign: 'left', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                display: 'block'
              }}
            >
              {version.name}
            </button>
          ))
        )}
      </div>
    </div>
  )
}