// Resets database state and manages cloud backup history.

'use server'

import { prisma } from '../services/prisma'
import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache' 
import { runSeed } from '../prisma/seed'
import { Client } from 'pg' 

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
    if (apiKey && projectId) {
      const listResponse = await fetch(`https://console.neon.tech/api/v2/projects/${projectId}/branches`, {
        headers: { 
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        },
        next: { revalidate: 0 }
      })

      if (!listResponse.ok) {
        return { success: false, error: `Failed to fetch project branches: ${listResponse.statusText}` }
      }

      const listData = await listResponse.json()
      const defaultBranch = listData.branches.find((b: any) => b.default === true || b.name === 'production')
      
      if (!defaultBranch) {
        return { success: false, error: 'Could not resolve default production branch ID on Neon' }
      }

      const parentBranchInternalId = defaultBranch.id
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

      console.log(`[Neon] Creating branch from parent ID: ${parentBranchInternalId}`)

      const createResponse = await fetch(`https://console.neon.tech/api/v2/projects/${projectId}/branches`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          branch: { 
            name: `backup-before-reset-${timestamp}`,
            parent_id: parentBranchInternalId
          },
          endpoints: [
            {
              type: 'read_write',
              autoscaling_limit_min_cu: 0.25,
              autoscaling_limit_max_cu: 0.25,
              disabled: false
            }
          ]
        })
      })

      if (!createResponse.ok) {
        const errorDetails = await createResponse.json().catch(() => ({}))
        console.error('[Neon] API Branch Creation Failed:', JSON.stringify(errorDetails, null, 2))
        return { success: false, error: `Neon Branching Error: ${createResponse.statusText}` }
      }

      const freshListResponse = await fetch(`https://console.neon.tech/api/v2/projects/${projectId}/branches`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
        next: { revalidate: 0 }
      })
      
      if (freshListResponse.ok) {
        const freshData = await freshListResponse.json()
        const backupBranches = freshData.branches
          .filter((b: any) => b.name.startsWith('backup-before-reset-'))
          .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

        if (backupBranches.length > 5) {
          console.log(`[Neon] Deleting oldest backup branch: ${backupBranches[0].name}`)
          await fetch(`https://console.neon.tech/api/v2/projects/${projectId}/branches/${backupBranches[0].id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${apiKey}` }
          })
        }
      }
    } else {
      return { success: false, error: 'Missing environment configuration variables' }
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.invoiceSunglasses.deleteMany({})
      await tx.invoices.deleteMany({})
      await tx.customers.deleteMany({})
      await tx.employees.deleteMany({})
      await tx.sunglasses.deleteMany({})

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

/**
 * PROCEDURE: Restore Database using clean SQL client
 */
export async function restoreDatabaseToVersion(branchId: string) {
  const apiKey = process.env.NEON_API_KEY
  const projectId = process.env.NEON_PROJECT_ID

  if (!apiKey || !projectId) {
    return { success: false, error: 'Missing environment configuration variables' }
  }

  try {
    // Get branch host string from Neon.
    const endpointsResponse = await fetch(`https://console.neon.tech/api/v2/projects/${projectId}/endpoints`, {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' },
      next: { revalidate: 0 }
    })
    
    if (!endpointsResponse.ok) {
      return { success: false, error: 'Failed to retrieve project endpoints from Neon API' }
    }
    
    const endpointsData = await endpointsResponse.json()
    const branchEndpoint = endpointsData.endpoints.find((e: any) => e.branch_id === branchId)

    if (!branchEndpoint) {
      return { success: false, error: 'Active compute node warming up. Please try again in 3 seconds.' }
    }

    // Build connection URL.
    const baseDbUrl = process.env.DATABASE_URL || ''
    const passwordMatch = baseDbUrl.match(/:\/\/([^:]+):([^@]+)@/)
    const dbUser = passwordMatch ? passwordMatch[1] : 'neondb_owner'
    const dbPass = passwordMatch ? passwordMatch[2] : ''
    const backupBranchUrl = `postgresql://${dbUser}:${dbPass}@${branchEndpoint.host}/neondb?sslmode=require`

    // Fetch data using PG client.
    const client = new Client({ connectionString: backupBranchUrl })
    await client.connect()

    const { rows: backupSunglasses } = await client.query('SELECT * FROM "Sunglasses"')
    const { rows: backupEmployees } = await client.query('SELECT * FROM "Employees"')
    const { rows: backupCustomers } = await client.query('SELECT * FROM "Customers"')
    const { rows: backupInvoices } = await client.query('SELECT * FROM "Invoices"')
    const { rows: backupInvoiceSunglasses } = await client.query('SELECT * FROM "InvoiceSunglasses"')

    await client.end()

    // Overwrite production using main Prisma client.
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.invoiceSunglasses.deleteMany({})
      await tx.invoices.deleteMany({})
      await tx.customers.deleteMany({})
      await tx.employees.deleteMany({})
      await tx.sunglasses.deleteMany({})

      if (backupSunglasses.length > 0) await tx.sunglasses.createMany({ data: backupSunglasses })
      if (backupEmployees.length > 0) await tx.employees.createMany({ data: backupEmployees })
      if (backupCustomers.length > 0) await tx.customers.createMany({ data: backupCustomers })
      if (backupInvoices.length > 0) await tx.invoices.createMany({ data: backupInvoices })
      if (backupInvoiceSunglasses.length > 0) await tx.invoiceSunglasses.createMany({ data: backupInvoiceSunglasses })
    })

    revalidatePath('/customers')
    revalidatePath('/employees')
    revalidatePath('/invoices')

    return { success: true, error: null }
  } catch (error) {
    console.error('Data copy rollback operation failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown database error' }
  }
}