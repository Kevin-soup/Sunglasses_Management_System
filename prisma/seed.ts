import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import PrismaClientPkg from '@prisma/client/index.js'

// Create pool for database connection.
const pool = new Pool({ connectionString: process.env.DIRECT_URL })

// Add adapter to Prisma constructor.
const adapter = new PrismaPg(pool)
const prisma = new PrismaClientPkg.PrismaClient({ adapter })

// Path to public Supabase bucket.
const supabaseUrl = process.env.SUPABASE_URL
const bucketUrl = `${supabaseUrl}/storage/v1/object/public/images`

export async function main() {
  // Lowercase properties to match Prisma keys.
  await prisma.invoiceSunglasses.deleteMany()
  await prisma.invoices.deleteMany()
  await prisma.sunglasses.deleteMany()
  await prisma.employees.deleteMany()
  await prisma.customers.deleteMany()

  // Reset all auto increment sequences back to 1.
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "InvoiceSunglasses" RESTART IDENTITY CASCADE;`)
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Invoices" RESTART IDENTITY CASCADE;`)
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Sunglasses" RESTART IDENTITY CASCADE;`)
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Employees" RESTART IDENTITY CASCADE;`)
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Customers" RESTART IDENTITY CASCADE;`)

  await prisma.customers.createMany({
    data: [
      { firstName: 'Ava', lastName: 'Nguyen', email: 'ava@example.com', phoneNumber: '503-555-0101' },
      { firstName: 'Leo', lastName: 'Martinez', email: null, phoneNumber: '431-645-0102' },
      { firstName: 'Kevin', lastName: 'Lin', email: 'kevin@example.com', phoneNumber: '713-899-0103' },
      { firstName: 'Maya', lastName: 'Chen', email: 'maya@example.com', phoneNumber: '385-786-0104' },
    ],
  })

  await prisma.employees.createMany({
    data: [
      { firstName: 'Steve', lastName: 'Adams', hireDate: new Date('2022-03-23'), isActive: 0 },
      { firstName: 'Jonny', lastName: 'Patel', hireDate: new Date('2023-01-15'), isActive: 1 },
      { firstName: 'Jordan', lastName: 'Guy', hireDate: new Date('2024-06-01'), isActive: 1 },
      { firstName: 'Sasha', lastName: 'Reed', hireDate: new Date('2025-11-20'), isActive: 1 },
    ],
  })

  const dbCustomers = await prisma.customers.findMany({ orderBy: { customerID: 'asc' } })
  const dbEmployees = await prisma.employees.findMany({ orderBy: { employeeID: 'asc' } })

  await prisma.sunglasses.createMany({
    data: [
      { itemName: 'Round', retailPrice: 179.99, stockQuantity: 0, isListed: 0, imagePath: `${bucketUrl}/round.png` },
      { itemName: 'Wayfarer', retailPrice: 129.99, stockQuantity: 12, isListed: 1, imagePath: `${bucketUrl}/wayfarer.png` },
      { itemName: 'Aviator', retailPrice: 159.99, stockQuantity: 8, isListed: 1, imagePath: `${bucketUrl}/aviator.png` },
      { itemName: 'Athletic', retailPrice: 135.99, stockQuantity: 6, isListed: 1, imagePath: `${bucketUrl}/athletic.png` },
      { itemName: 'Cat Eye', retailPrice: 100.99, stockQuantity: 7, isListed: 1, imagePath: `${bucketUrl}/cateye.png` },
      { itemName: 'Square', retailPrice: 299.99, stockQuantity: 10, isListed: 1, imagePath: `${bucketUrl}/square.png` },
      { itemName: 'ClownGlasses', retailPrice: 80.00, stockQuantity: 5, isListed: 1, imagePath: `${bucketUrl}/clown_sunglasses.png` },
    ],
  })

  const dbSunglasses = await prisma.sunglasses.findMany({ orderBy: { itemID: 'asc' } })

  const invoice1 = await prisma.invoices.create({
    data: { customerID: dbCustomers[0].customerID, employeeID: dbEmployees[1].employeeID, invoiceDate: new Date('2026-02-01') }
  })
  const invoice2 = await prisma.invoices.create({
    data: { customerID: dbCustomers[1].customerID, employeeID: dbEmployees[2].employeeID, invoiceDate: new Date('2026-02-02') }
  })
  const invoice3 = await prisma.invoices.create({
    data: { customerID: dbCustomers[2].customerID, employeeID: dbEmployees[3].employeeID, invoiceDate: new Date('2026-02-03') }
  })
  const invoice4 = await prisma.invoices.create({
    data: { customerID: dbCustomers[3].customerID, employeeID: dbEmployees[1].employeeID, invoiceDate: new Date('2026-03-04') }
  })

  await prisma.invoiceSunglasses.createMany({
    data: [
      { invoiceID: invoice1.invoiceID, itemID: dbSunglasses[1].itemID, quantity: 3 },
      { invoiceID: invoice1.invoiceID, itemID: dbSunglasses[2].itemID, quantity: 5 },
      { invoiceID: invoice2.invoiceID, itemID: dbSunglasses[1].itemID, quantity: 7 },
      { invoiceID: invoice3.invoiceID, itemID: dbSunglasses[5].itemID, quantity: 1 },
      { invoiceID: invoice4.invoiceID, itemID: dbSunglasses[4].itemID, quantity: 1 },
      { invoiceID: invoice4.invoiceID, itemID: dbSunglasses[6].itemID, quantity: 2 },
    ],
  })
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { 
    await prisma.$disconnect()
    // Shut down pool connection.
    await pool.end() 
  })