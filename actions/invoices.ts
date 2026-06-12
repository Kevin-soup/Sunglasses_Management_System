// Procedure layer for invoices table.
'use server'

import { prisma } from '../services/prisma'
import { revalidatePath } from 'next/cache'

/* ==========================================================================
   SECTION 1: CORE INVOICE CRUD (For app/invoices/page.tsx)
   ========================================================================== */

/**
 * PROCEDURE: sp_invoices_table
 * PURPOSE: Fetch all parent sales invoices with customer and employee relations
 */
export async function getInvoicesTable() {
  try {
    return await prisma.invoices.findMany({
      include: {
        customers: true,
        employees: true,
      },
      orderBy: { invoiceID: 'asc' },
    })
  } catch (error) {
    console.error('Fetch invoices error:', error)
    throw new Error('ERR_INVOICES_FETCH_FAILED')
  }
}

/**
 * PROCEDURE: sp_get_customers_dropdown
 * PURPOSE: Hydrate customer lookup components
 */
export async function getCustomersDropdown() {
  try {
    return await prisma.customers.findMany({
      orderBy: { customerID: 'asc' },
    })
  } catch (error) {
    console.error('Fetch customers dropdown error:', error)
    throw new Error('ERR_CUSTOMERS_DROPDOWN_FAILED')
  }
}

/**
 * PROCEDURE: sp_get_employees_dropdown
 * PURPOSE: Hydrate employee lookup components
 */
export async function getEmployeesDropdown() {
  try {
    return await prisma.employees.findMany({
      orderBy: { employeeID: 'asc' },
    })
  } catch (error) {
    console.error('Fetch employees dropdown error:', error)
    throw new Error('ERR_EMPLOYEES_DROPDOWN_FAILED')
  }
}

/**
 * PROCEDURE: sp_create_invoice
 * PURPOSE: Insert a new parent invoice ledger record (Without totalAmount)
 */
export async function createInvoice(
  customerID: number,
  employeeID: number,
  invoiceDateStr: string // 🌟 FIXED: Expect clean raw string from form data
) {
  try {
    // 🌟 FIXED: Force server environment to instantiate at local midnight
    const invoiceDate = new Date(invoiceDateStr + 'T00:00:00')

    await prisma.invoices.create({
      data: {
        customerID,
        employeeID,
        invoiceDate,
      },
    })
    
    revalidatePath('/invoices')
    return { success: true, error: null }
  } catch (error) {
    console.error('Create invoice error:', error)
    return { success: false, error: 'ERR_INVOICE_CREATE_FAILED' }
  }
}

/**
 * PROCEDURE: sp_update_invoice
 * PURPOSE: Modify attributes of an existing parent sales ledger entry (Without totalAmount)
 */
export async function updateInvoice(
  invoiceID: number,
  customerID: number,
  employeeID: number,
  invoiceDateStr: string // 🌟 FIXED: Expect clean raw string from form data
) {
  try {
    // 🌟 FIXED: Force server environment to instantiate at local midnight
    const invoiceDate = new Date(invoiceDateStr + 'T00:00:00')

    await prisma.invoices.update({
      where: { invoiceID },
      data: {
        customerID,
        employeeID,
        invoiceDate,
      },
    })

    revalidatePath('/invoices')
    return { success: true, error: null }
  } catch (error) {
    console.error('Update invoice error:', error)
    return { success: false, error: 'ERR_INVOICE_UPDATE_FAILED' }
  }
}

/**
 * PROCEDURE: sp_delete_invoice
 * PURPOSE: Drop an invoice row entry entirely
 */
export async function deleteInvoice(invoiceID: number) {
  try {
    await prisma.invoices.delete({
      where: { invoiceID },
    })
    
    revalidatePath('/invoices')
    return { success: true, error: null }
  } catch (error) {
    console.error('Delete invoice error:', error)
    return { success: false, error: 'ERR_INVOICE_DELETE_FAILED' }
  }
}


/* ==========================================================================
   SECTION 2: MANY-TO-MANY INTERSECTION CRUD (For app/invoice_sunglasses/page.tsx)
   ========================================================================== */

/**
 * PROCEDURE: sp_invoice_sunglasses_table
 * PURPOSE: Fetch many-to-many child rows, converting product prices to plain strings
 */
export async function getInvoiceSunglassesTable() {
  try {
    const lines = await prisma.invoiceSunglasses.findMany({
      include: {
        invoices: {
          include: {
            customers: true
          }
        },
        sunglasses: true
      },
      orderBy: { invoiceItemID: 'asc' }
    })

    return lines.map(line => {
      if (line.sunglasses) {
        return {
          ...line,
          sunglasses: {
            ...line.sunglasses,
            retailPrice: line.sunglasses.retailPrice.toString()
          }
        }
      }
      return line
    })
  } catch (error) {
    console.error('Fetch intersection table error:', error)
    throw new Error('ERR_INTERSECTION_FETCH_FAILED')
  }
}

/**
 * PROCEDURE: sp_get_invoices_dropdown
 * PURPOSE: Hydrate parent transaction lookup parameters safely
 */
export async function getInvoicesDropdown() {
  try {
    return await prisma.invoices.findMany({
      include: {
        customers: true
      },
      orderBy: { invoiceID: 'asc' }
    })
  } catch (error) {
    console.error('Fetch invoices dropdown error:', error)
    throw new Error('ERR_INVOICES_DROPDOWN_FAILED')
  }
}

/**
 * PROCEDURE: sp_get_sunglasses_dropdown
 * PURPOSE: Hydrate product catalog line options, converting pricing to strings
 */
export async function getSunglassesDropdown() {
  try {
    const products = await prisma.sunglasses.findMany({
      orderBy: { itemID: 'asc' }
    })

    return products.map(item => ({
      ...item,
      retailPrice: item.retailPrice.toString()
    }))
  } catch (error) {
    console.error('Fetch sunglasses dropdown error:', error)
    throw new Error('ERR_SUNGLASSES_DROPDOWN_FAILED')
  }
}

/**
 * PROCEDURE: sp_create_invoice_line_item
 * PURPOSE: Link an inventory product line cleanly to a target customer receipt order
 */
export async function createInvoiceLineItem(invoiceID: number, itemID: number, quantity: number) {
  try {
    await prisma.invoiceSunglasses.create({
      data: {
        invoiceID,
        itemID,
        quantity
      }
    })
    
    revalidatePath('/invoice_sunglasses')
    return { success: true, error: null }
  } catch (error) {
    console.error('Create intersection line error:', error)
    return { success: false, error: 'ERR_LINE_ITEM_CREATE_FAILED' }
  }
}

/**
 * PROCEDURE: sp_update_invoice_line_item
 * PURPOSE: Recalculate and modify properties of an active order row line link
 */
export async function updateInvoiceLineItem(invoiceItemID: number, itemID: number, quantity: number) {
  try {
    await prisma.invoiceSunglasses.update({
      where: { invoiceItemID },
      data: {
        itemID,
        quantity
      }
    })
    
    revalidatePath('/invoice_sunglasses')
    return { success: true, error: null }
  } catch (error) {
    console.error('Update intersection line error:', error)
    return { success: false, error: 'ERR_LINE_ITEM_UPDATE_FAILED' }
  }
}

/**
 * PROCEDURE: sp_delete_invoice_line_item
 * PURPOSE: Sever the specific product linkage row link from a transactional sales document
 */
export async function deleteInvoiceLineItem(invoiceItemID: number) {
  try {
    await prisma.invoiceSunglasses.delete({
      where: { invoiceItemID }
    })
    
    revalidatePath('/invoice_sunglasses')
    return { success: true, error: null }
  } catch (error) {
    console.error('Delete intersection line error:', error)
    return { success: false, error: 'ERR_LINE_ITEM_DELETE_FAILED' }
  }
}