// Resets database state.

'use server'

import { prisma } from '../services/prisma'
import { Prisma } from '@prisma/client'
import { exec } from 'child_process'
import { promisify } from 'util'
import { revalidatePath } from 'next/cache' 

const execAsync = promisify(exec)

/**
 * PROCEDURE: Reset and Seed Database
 * PURPOSE: Sequentially purges data and cleanly shells out to the standalone seeder.
 */
export async function resetDatabase() {
  try {
    // Wipe existing data.
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.invoiceSunglasses.deleteMany({})
      await tx.invoices.deleteMany({})
      await tx.customers.deleteMany({})
      await tx.employees.deleteMany({})
      await tx.sunglasses.deleteMany({})
    })

    // Executes script using locally cached node binaries.
    await execAsync('npx ts-node prisma/seed.ts')

    revalidatePath('/customers')
    revalidatePath('/employees')
    revalidatePath('/invoices')

    return { success: true, error: null }
  } catch (error) {
    console.error('Database Reset Pipeline Failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown database error' }
  }
}