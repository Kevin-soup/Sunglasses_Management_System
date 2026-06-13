// Seed for Neon database.

const supabaseUrl = process.env.SUPABASE_URL
const bucketUrl = `${supabaseUrl}/storage/v1/object/public/images`

export async function runSeed(tx: any) {
  // Reset auto-increment IDs.
  await tx.$executeRawUnsafe(`TRUNCATE TABLE "InvoiceSunglasses" RESTART IDENTITY CASCADE;`)
  await tx.$executeRawUnsafe(`TRUNCATE TABLE "Invoices" RESTART IDENTITY CASCADE;`)
  await tx.$executeRawUnsafe(`TRUNCATE TABLE "Sunglasses" RESTART IDENTITY CASCADE;`)
  await tx.$executeRawUnsafe(`TRUNCATE TABLE "Employees" RESTART IDENTITY CASCADE;`)
  await tx.$executeRawUnsafe(`TRUNCATE TABLE "Customers" RESTART IDENTITY CASCADE;`)

  // Populate tables.
  await tx.customers.createMany({
    data: [
      { firstName: 'Ava', lastName: 'Nguyen', email: 'ava@example.com', phoneNumber: '503-555-0101' },
      { firstName: 'Leo', lastName: 'Martinez', email: null, phoneNumber: '431-645-0102' },
      { firstName: 'Kevin', lastName: 'Lin', email: 'kevin@example.com', phoneNumber: '713-899-0103' },
      { firstName: 'Maya', lastName: 'Chen', email: 'maya@example.com', phoneNumber: '385-786-0104' },
    ],
  })

  await tx.employees.createMany({
    data: [
      { firstName: 'Steve', lastName: 'Adams', hireDate: new Date('2022-03-23'), isActive: 0, terminationDate: new Date('2024-05-10') },
      { firstName: 'Jonny', lastName: 'Patel', hireDate: new Date('2023-01-15'), isActive: 1, terminationDate: null },
      { firstName: 'Jordan', lastName: 'Guy', hireDate: new Date('2024-06-01'), isActive: 1, terminationDate: null },
      { firstName: 'Sasha', lastName: 'Reed', hireDate: new Date('2025-11-20'), isActive: 1, terminationDate: null }
    ]
  })
  
  const dbCustomers = await tx.customers.findMany({ orderBy: { customerID: 'asc' } })
  const dbEmployees = await tx.employees.findMany({ orderBy: { employeeID: 'asc' } })

  await tx.sunglasses.createMany({
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

  const dbSunglasses = await tx.sunglasses.findMany({ orderBy: { itemID: 'asc' } })

  // Create invoices.
  const invoice1 = await tx.invoices.create({
    data: { customerID: dbCustomers[0].customerID, employeeID: dbEmployees[1].employeeID, invoiceDate: new Date('2026-02-01') }
  })
  const invoice2 = await tx.invoices.create({
    data: { customerID: dbCustomers[1].customerID, employeeID: dbEmployees[2].employeeID, invoiceDate: new Date('2026-02-02') }
  })
  const invoice3 = await tx.invoices.create({
    data: { customerID: dbCustomers[2].customerID, employeeID: dbEmployees[3].employeeID, invoiceDate: new Date('2026-02-03') }
  })
  const invoice4 = await tx.invoices.create({
    data: { customerID: dbCustomers[3].customerID, employeeID: dbEmployees[1].employeeID, invoiceDate: new Date('2026-03-04') }
  })

  // Map sunglasses items to invoices.
  await tx.invoiceSunglasses.createMany({
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