// Active Neon database connection.

import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import PrismaClientPkg from '@prisma/client'

// Extract connection string.
const connectionString = process.env.DATABASE_URL

// Initialize connection runner.
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

// Attach to global memory. Prevent multiple instances in development. 
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientPkg.PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ?? new PrismaClientPkg.PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma