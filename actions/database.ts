// Resets database state and manages cloud backup history.

'use server'

import { prisma } from '../services/prisma'
import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache' 
import { runSeed } from '../prisma/seed'

export interface DatabaseVersion {
  id: string
  name: string
  createdAt: string
}

/**
 * PROCEDURE: Fetch Database Versions
 */
export async function getDatabaseVersions(): Promise<DatabaseVersion[]> {
  const apiKey = process.env.NEON_API_KEY
  const projectId = process.env.NEON_PROJECT_ID

  if (!apiKey || !projectId) return []

  try {
    const response = await fetch(`https://console.neon.tech/api/v2/projects/${projectId}/branches`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      },
      next: { revalidate: 0 }
    })

    if (!response.ok) return []
    const data = await response.json()
    
    return data.branches
      .filter((b: any) => b.name.startsWith('backup-before-reset-'))
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((b: any) => {
        const rawDate = b.name.replace('backup-before-reset-', '')
        const cleanName = rawDate.split('T')[0] + ' ' + (rawDate.split('T')[1]?.substring(0, 5) || '')
        return { id: b.id, name: `Backup (${cleanName.trim()})`, createdAt: b.created_at }
      })
  } catch (error) {
    return []
  }
}

/**
 * PROCEDURE: Reset and Seed Database
 */
export async function resetDatabase() {
  const apiKey = process.env.NEON_API_KEY
  const projectId = process.env.NEON_PROJECT_ID

  try {
    // 1. Neon API Timeline Backup Snapshot
    if (apiKey && projectId) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      await fetch(`https://console.neon.tech/api/v2/projects/${projectId}/branches`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ branch: { name: `backup-before-reset-${timestamp}` } })
      })

      // 5-version rolling limit cleanup logic
      const listResponse = await fetch(`https://console.neon.tech/api/v2/projects/${projectId}/branches`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      })

      if (listResponse.ok) {
        const data = await listResponse.json()
        const backupBranches = data.branches
          .filter((b: any) => b.name.startsWith('backup-before-reset-'))
          .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

        if (backupBranches.length > 5) {
          await fetch(`https://console.neon.tech/api/v2/projects/${projectId}/branches/${backupBranches[0].id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${apiKey}` }
          })
        }
      }
    }

    // 2. Clear out data rows and execute imported seed file natively
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.invoiceSunglasses.deleteMany({})
      await tx.invoices.deleteMany({})
      await tx.customers.deleteMany({})
      await tx.employees.deleteMany({})
      await tx.sunglasses.deleteMany({})

      // 🌟 Calls your real seed.ts logic directly inside the web request transaction loop
      await runSeed(tx)
    })

    revalidatePath('/customers')
    revalidatePath('/employees')
    revalidatePath('/invoices')

    return { success: true, error: null }
  } catch (error) {
    console.error('Database Reset Pipeline Failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown database error' }
  }
}