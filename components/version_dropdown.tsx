'use client'

import { useEffect, useState } from 'react'
import { getDatabaseVersions, DatabaseVersion } from '@/actions/database'

export default function VersionDropdown() {
  const [versions, setVersions] = useState<DatabaseVersion[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    getDatabaseVersions().then(setVersions)
  }, [])

  return (
    <div className="version-dropdown-container">
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className="version-trigger-btn"
      >
        Database Rollback ({versions.length})
      </button>

      {isOpen && (
        <div className="version-menu-popup">
          {versions.length === 0 ? (
            <span className="version-no-backups">
              No recent backups found
            </span>
          ) : (
            versions.map((version) => (
              <a
                key={version.id}
                href={`https://console.neon.tech/app/projects/ep-summer-moon-ajscab3n/branches/${version.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="version-item-link"
              >
                {version.name}
              </a>
            ))
          )}
        </div>
      )}
    </div>
  )
}