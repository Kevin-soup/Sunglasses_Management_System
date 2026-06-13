'use client'

import { useEffect, useState } from 'react'
import { getDatabaseVersions, DatabaseVersion } from '@/actions/database'

export default function VersionDropdown() {
  const [versions, setVersions] = useState<DatabaseVersion[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Queries the Neon administrative API on mount
    getDatabaseVersions().then(setVersions)
  }, [])

  return (
    <div className="version-dropdown-container" style={{ position: 'relative', inlineSize: 'max-content' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className="version-trigger-btn"
        style={{
          padding: '4px 12px',
          backgroundColor: '#27272a',
          color: '#ffffff',
          fontSize: '12px',
          borderRadius: '4px',
          border: '1px solid #3f3f46',
          cursor: 'pointer'
        }}
      >
        History Branches ({versions.length})
      </button>

      {isOpen && (
        <div
          className="version-menu-popup"
          style={{
            position: 'absolute',
            insetBlockStart: '100%',
            insetInlineEnd: '0',
            marginTop: '8px',
            inlineSize: '240px',
            backgroundColor: '#18181b',
            border: '1px solid #3f3f46',
            borderRadius: '6px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
            zIndex: 50,
            padding: '4px 0'
          }}
        >
          {versions.length === 0 ? (
            <span style={{ display: 'block', padding: '8px 12px', fontSize: '11px', color: '#71717a' }}>
              No recent backups found
            </span>
          ) : (
            versions.map((version) => (
              <a
                key={version.id}
                href={`https://console.neon.tech/app/projects/ep-summer-moon-ajscab3n/branches/${version.id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  padding: '8px 12px',
                  fontSize: '11px',
                  color: '#e4e4e7',
                  textDecoration: 'none',
                  borderBottom: '1px solid #27272a'
                }}
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