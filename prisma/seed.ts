import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import PrismaClientPkg from '@prisma/client/index.js'

// Create pool for database connection.
const pool = new Pool({ connectionString: process.env.DIRECT_URL })

// Add adapter into the Prisma constructor.
const adapter = new PrismaPg(pool)
const prisma = new PrismaClientPkg.PrismaClient({ adapter })

async function main() {

  // Remove existing tables.
  await prisma.invoiceSunglasses.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.sunglasses.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.employee.deleteMany()

  // Seed Data - Customers.
  const c1 = await prisma.customer.create({ data: { firstName: 'Ava', lastName: 'Nguyen', email: 'ava@example.com', phoneNumber: '503-555-0101' } })
  const c2 = await prisma.customer.create({ data: { firstName: 'Leo', lastName: 'Martinez', email: null, phoneNumber: '431-645-0102' } })
  const c3 = await prisma.customer.create({ data: { firstName: 'Kevin', lastName: 'Lin', email: 'kevin@example.com', phoneNumber: '713-899-0103' } })
  const c4 = await prisma.customer.create({ data: { firstName: 'Maya', lastName: 'Chen', email: 'maya@example.com', phoneNumber: '385-786-0104' } })

  // Seed Data - Employees.
  const e1 = await prisma.employee.create({ data: { firstName: 'Steve', lastName: 'Adams', hireDate: new Date('2022-03-23'), isActive: false } })
  const e2 = await prisma.employee.create({ data: { firstName: 'Jonny', lastName: 'Patel', hireDate: new Date('2023-01-15'), isActive: true } })
  const e3 = await prisma.employee.create({ data: { firstName: 'Jordan', lastName: 'Guy', hireDate: new Date('2024-06-01'), isActive: true } })
  const e4 = await prisma.employee.create({ data: { firstName: 'Sasha', lastName: 'Reed', hireDate: new Date('2025-11-20'), isActive: true } })

  // Seed Data - Sunglasses.
  const s1 = await prisma.sunglasses.create({ data: { itemName: 'Oakley', retailPrice: 179.99, stockQuantity: 0, isListed: false } })
  const s2 = await prisma.sunglasses.create({ data: { itemName: 'Rayban', retailPrice: 129.99, stockQuantity: 12, isListed: true } })
  const s3 = await prisma.sunglasses.create({ data: { itemName: 'Aviator', retailPrice: 159.99, stockQuantity: 8, isListed: true } })
  const s4 = await prisma.sunglasses.create({ data: { itemName: 'Wayfarer', retailPrice: 135.99, stockQuantity: 6, isListed: true } })
  const s5 = await prisma.sunglasses.create({ data: { itemName: 'Retro Square', retailPrice: 100.99, stockQuantity: 7, isListed: true } })
  const s6 = await prisma.sunglasses.create({ data: { itemName: 'Titanium Elite', retailPrice: 299.99, stockQuantity: 10, isListed: true } })
  const s7 = await prisma.sunglasses.create({ data: { itemName: 'ClownGlasses', retailPrice: 80.00, stockQuantity: 5, isListed: true } })

  // Seed Data - Invoices.
  const inv1 = await prisma.invoice.create({ data: { customerID: c1.customerID, employeeID: e2.employeeID, invoiceDate: new Date('2026-02-01') } })
  const inv2 = await prisma.invoice.create({ data: { customerID: c2.customerID, employeeID: e3.employeeID, invoiceDate: new Date('2026-02-02') } })
  const inv3 = await prisma.invoice.create({ data: { customerID: c3.customerID, employeeID: e4.employeeID, invoiceDate: new Date('2026-02-03') } })
  const inv4 = await prisma.invoice.create({ data: { customerID: c4.customerID, employeeID: e2.employeeID, invoiceDate: new Date('2026-03-04') } })

  // Seed Data - Invoice Sunglasses.
  await prisma.invoiceSunglasses.create({ data: { invoiceID: inv1.invoiceID, itemID: s2.itemID, quantity: 3 } })
  await prisma.invoiceSunglasses.create({ data: { invoiceID: inv1.invoiceID, itemID: s3.itemID, quantity: 5 } })
  await prisma.invoiceSunglasses.create({ data: { invoiceID: inv2.invoiceID, itemID: s2.itemID, quantity: 7 } })
  await prisma.invoiceSunglasses.create({ data: { invoiceID: inv3.invoiceID, itemID: s6.itemID, quantity: 1 } })
  await prisma.invoiceSunglasses.create({ data: { invoiceID: inv4.invoiceID, itemID: s5.itemID, quantity: 1 } })
  await prisma.invoiceSunglasses.create({ data: { invoiceID: inv4.invoiceID, itemID: s7.itemID, quantity: 2 } })
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { 
    await prisma.$disconnect()
    // Shut down pool connection.
    await pool.end() 
  })