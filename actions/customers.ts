// Procedure layer for customers table.

'use server'

import { prisma } from '@/services/prisma'

/**
 * PROCEDURE: sp_customers_table
 * PURPOSE: Read all customer records, sorting by primary key.
 * SELECT customerID, firstName, lastName, email, phoneNumber FROM Customers;
 */
export async function getCustomersTable() {
  try {
    const records = await prisma.customers.findMany({
      orderBy: { customerID: 'asc' },
    })
    return records.map((customer) => ({
      ...customer,
      email: customer.email ?? 'N/A',
    }))
  } catch {
    throw new Error('ERR_CUSTOMERS_FETCH_FAILED')
  }
}

/**
 * PROCEDURE: sp_create_customer
 * PARAMETERS: p_firstName, p_lastName, p_email, p_phoneNumber
 * INSERT INTO Customers (firstName, lastName, email, phoneNumber) VALUES (:firstName_input, :lastName_input, :email_input, :phoneNumber_input);
 */
export async function createCustomer(
  p_firstName: string,
  p_lastName: string,
  p_email: string | null,
  p_phoneNumber: string
) {
  try {
    await prisma.customers.create({
      data: {
        firstName: p_firstName,
        lastName: p_lastName,
        email: p_email === '' ? null : p_email,
        phoneNumber: p_phoneNumber,
      },
    })
    return { success: true }
  } catch {
    return { success: false, error: 'ERR_CUSTOMER_CREATE_FAILED' }
  }
}

/**
 * PROCEDURE: sp_update_customer
 * PARAMETERS: p_customerID, p_firstName, p_lastName, p_email, p_phoneNumber
 * UPDATE Customers SET firstName = :firstName_input, lastName = :lastName_input, email = :email_input, phoneNumber = :phoneNumber_input WHERE customerID = :customerID_selected_from_customers_page;
 */
export async function updateCustomer(
  p_customerID: number,
  p_firstName: string,
  p_lastName: string,
  p_email: string | null,
  p_phoneNumber: string
) {
  try {
    await prisma.customers.update({
      where: { customerID: p_customerID },
      data: {
        firstName: p_firstName,
        lastName: p_lastName,
        email: p_email === '' ? null : p_email,
        phoneNumber: p_phoneNumber,
      },
    })
    return { success: true }
  } catch {
    return { success: false, error: 'ERR_CUSTOMER_UPDATE_FAILED' }
  }
}