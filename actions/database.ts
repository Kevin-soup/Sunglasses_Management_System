// Resets database state.

'use server'

import { prisma } from '../services/prisma'
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
    await prisma.$transaction(async (tx: any) => {
      await tx.invoiceSunglasses.deleteMany({})
      await tx.invoices.deleteMany({})
      await tx.customers.deleteMany({})
      await tx.employees.deleteMany({})
      await tx.sunglasses.deleteMany({})
    })

    // Insert original seed data.
    await execAsync('npx prisma db seed')

    revalidatePath('/customers')
    revalidatePath('/employees')
    revalidatePath('/invoices')

    return { success: true, error: null }
  } catch (error: any) {
    console.error('Database Reset Pipeline Failed:', error)
    return { 
      success: false, 
      error: error.message || 'ERR_DATABASE_RESET_AND_SEED_FAILED' 
    }
  }
}