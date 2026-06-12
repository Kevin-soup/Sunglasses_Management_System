// Procedure layer for invoices table.

'use server'

import { prisma } from '@/services/prisma'

/**
 * PROCEDURE: sp_invoices_table
 * PURPOSE: Read all invoice records joined with customer and employee names.
 * SELECT i.invoiceID, c.firstName AS customerFirstName, c.lastName AS customerLastName, 
 * e.firstName AS employeeFirstName, e.lastName AS employeeLastName, 
 * DATE_FORMAT(i.invoiceDate, '%Y-%m-%d') AS invoiceDate 
 * FROM Invoices i
 * JOIN Customers c ON i.customerID = c.customerID
 * JOIN Employees e ON i.employeeID = e.employeeID;
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
  } catch {
    throw new Error('ERR_INVOICES_FETCH_FAILED')
  }
}

/**
 * PROCEDURE: sp_customers_dropdown
 * PURPOSE: Populate customer selection dropdown on the invoice creation interface.
 * SELECT customerID, firstName, lastName FROM Customers ORDER BY lastName ASC;
 */
export async function getCustomersDropdown() {
  try {
    return await prisma.customers.findMany({
      select: { customerID: true, firstName: true, lastName: true },
      orderBy: { lastName: 'asc' },
    })
  } catch {
    throw new Error('ERR_CUSTOMERS_DROPDOWN_FAILED')
  }
}

/**
 * PROCEDURE: sp_employees_dropdown
 * PURPOSE: Populate active employee selection dropdown on the invoice creation interface.
 * SELECT employeeID, firstName, lastName FROM Employees WHERE isActive = 1 ORDER BY lastName ASC;
 */
export async function getEmployeesDropdown() {
  try {
    return await prisma.employees.findMany({
      where: { isActive: 1 },
      select: { employeeID: true, firstName: true, lastName: true },
      orderBy: { lastName: 'asc' },
    })
  } catch {
    throw new Error('ERR_EMPLOYEES_DROPDOWN_FAILED')
  }
}

/**
 * PROCEDURE: sp_create_invoice
 * PARAMETERS: p_customerID, p_employeeID, p_invoiceDate
 * INSERT INTO Invoices (customerID, employeeID, invoiceDate) VALUES (:customerID_input, :employeeID_input, :invoiceDate_input);
 */
export async function createInvoice(p_customerID: number, p_employeeID: number, p_invoiceDate: Date) {
  try {
    await prisma.invoices.create({
      data: { customerID: p_customerID, employeeID: p_employeeID, invoiceDate: p_invoiceDate },
    })
    return { success: true }
  } catch {
    return { success: false, error: 'ERR_INVOICE_CREATE_FAILED' }
  }
}

/**
 * PROCEDURE: sp_update_invoice
 * PARAMETERS: p_invoiceID, p_customerID, p_employeeID, p_invoiceDate
 * UPDATE Invoices SET customerID = :customerID_input, employeeID = :employeeID_input, invoiceDate = :invoiceDate_input WHERE invoiceID = :invoiceID_selected_from_invoices_page;
 */
export async function updateInvoice(p_invoiceID: number, p_customerID: number, p_employeeID: number, p_invoiceDate: Date) {
  try {
    await prisma.invoices.update({
      where: { invoiceID: p_invoiceID },
      data: { customerID: p_customerID, employeeID: p_employeeID, invoiceDate: p_invoiceDate },
    })
    return { success: true }
  } catch {
    return { success: false, error: 'ERR_INVOICE_UPDATE_FAILED' }
  }
}

/**
 * PROCEDURE: sp_delete_invoice
 * PARAMETERS: delete_invoice_id
 * TRANSACTION: Handles cascading dependency cleanup for sub-items manually.
 * DELETE FROM InvoiceSunglasses WHERE invoiceID = :delete_invoice_id;
 * DELETE FROM Invoices WHERE invoiceID = :delete_invoice_id;
 */
export async function deleteInvoice(delete_invoice_id: number) {
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.invoiceSunglasses.deleteMany({ where: { invoiceID: delete_invoice_id } })
      await tx.invoices.delete({ where: { invoiceID: delete_invoice_id } })
      return { success: true }
    })
  } catch {
    return { success: false, error: 'ERR_INVOICE_DELETE_FAILED' }
  }
}

/**
 * PROCEDURE: sp_invoice_sunglasses_table
 * PURPOSE: Read all order items grouped together by parent entity records.
 * SELECT i_s.invoiceItemID, i_s.invoiceID, s.itemName, i_s.quantity, c.lastName AS customerLastName 
 * FROM InvoiceSunglasses i_s
 * JOIN Invoices i ON i_s.invoiceID = i.invoiceID
 * JOIN Customers c ON i.customerID = c.customerID
 * JOIN Sunglasses s ON i_s.itemID = s.itemID;
 */
export async function getInvoiceSunglassesTable() {
  try {
    return await prisma.invoiceSunglasses.findMany({
      include: {
        invoices: { include: { customers: true } },
        sunglasses: true,
      },
      orderBy: { invoiceID: 'asc' },
    })
  } catch {
    throw new Error('ERR_INVOICE_SUNGLASSES_FETCH_FAILED')
  }
}

/**
 * PROCEDURE: sp_invoices_dropdown
 * PURPOSE: List generated sales orders for selection maps on dependent setups.
 * SELECT i.invoiceID, c.lastName FROM Invoices i JOIN Customers c ON i.customerID = c.customerID ORDER BY i.invoiceID DESC;
 */
export async function getInvoicesDropdown() {
  try {
    return await prisma.invoices.findMany({
      include: { customers: true },
      orderBy: { invoiceID: 'desc' },
    })
  } catch {
    throw new Error('ERR_INVOICES_DROPDOWN_FAILED')
  }
}

/**
 * PROCEDURE: sp_sunglasses_dropdown
 * PURPOSE: Collect listed merchandise units available for immediate allocation.
 * SELECT itemID, itemName, stockQuantity FROM Sunglasses WHERE isListed = 1;
 */
export async function getSunglassesDropdown() {
  try {
    return await prisma.sunglasses.findMany({
      where: { isListed: 1 },
      select: { itemID: true, itemName: true, stockQuantity: true },
    })
  } catch {
    throw new Error('ERR_SUNGLASSES_DROPDOWN_FAILED')
  }
}

/**
 * PROCEDURE: sp_create_invoice_line_item
 * PARAMETERS: form_invoiceID, form_itemID, form_quantity
 * TRANSACTION: Assesses allocation rules and performs atomic inventory deduction.
 * SELECT stockQuantity FROM Sunglasses WHERE itemID = :form_itemID;
 * INSERT INTO InvoiceSunglasses (invoiceID, itemID, quantity) VALUES (:form_invoiceID, :form_itemID, :form_quantity);
 * UPDATE Sunglasses SET stockQuantity = stockQuantity - :form_quantity WHERE itemID = :form_itemID;
 */
export async function createInvoiceLineItem(form_invoiceID: number, form_itemID: number, form_quantity: number) {
  try {
    return await prisma.$transaction(async (tx) => {
      const product = await tx.sunglasses.findUnique({
        where: { itemID: form_itemID },
        select: { stockQuantity: true },
      })
      if (!product || form_quantity > product.stockQuantity) {
        throw new Error('ERR_STOCK_INSUFFICIENT')
      }
      await tx.invoiceSunglasses.create({
        data: { invoiceID: form_invoiceID, itemID: form_itemID, quantity: form_quantity },
      })
      await tx.sunglasses.update({
        where: { itemID: form_itemID },
        data: { stockQuantity: { decrement: form_quantity } },
      })
      return { success: true }
    })
  } catch (error: any) {
    return { success: false, error: error.message || 'ERR_CREATE_LINE_FAILED' }
  }
}

/**
 * PROCEDURE: sp_update_invoice_line_item
 * PARAMETERS: form_invoiceItemID, form_itemID, form_quantity
 * TRANSACTION: Restores current product balance dynamically before evaluating changes.
 */
export async function updateInvoiceLineItem(form_invoiceItemID: number, form_itemID: number, form_quantity: number) {
  try {
    return await prisma.$transaction(async (tx) => {
      const oldItem = await tx.invoiceSunglasses.findUnique({
        where: { invoiceItemID: form_invoiceItemID },
      })
      if (!oldItem) throw new Error('ERR_LINE_NOT_FOUND')

      const product = await tx.sunglasses.findUnique({
        where: { itemID: form_itemID },
        select: { stockQuantity: true },
      })
      if (!product) throw new Error('ERR_PRODUCT_NOT_FOUND')

      const baseStockOffset = oldItem.itemID === form_itemID ? oldItem.quantity : 0
      if (form_quantity > (product.stockQuantity + baseStockOffset)) {
        throw new Error('ERR_STOCK_INSUFFICIENT')
      }

      await tx.sunglasses.update({
        where: { itemID: oldItem.itemID },
        data: { stockQuantity: { increment: oldItem.quantity } },
      })

      await tx.invoiceSunglasses.update({
        where: { invoiceItemID: form_invoiceItemID },
        data: { itemID: form_itemID, quantity: form_quantity },
      })

      await tx.sunglasses.update({
        where: { itemID: form_itemID },
        data: { stockQuantity: { decrement: form_quantity } },
      })

      return { success: true }
    })
  } catch (error: any) {
    return { success: false, error: error.message || 'ERR_UPDATE_LINE_FAILED' }
  }
}

/**
 * PROCEDURE: sp_delete_invoice_line_item
 * PARAMETERS: pid
 * TRANSACTION: Frees up allocated stock back into inventory on item line removal.
 * SELECT itemID, quantity FROM InvoiceSunglasses WHERE invoiceItemID = :pid;
 * UPDATE Sunglasses SET stockQuantity = stockQuantity + :quantity WHERE itemID = :itemID;
 * DELETE FROM InvoiceSunglasses WHERE invoiceItemID = :pid;
 */
export async function deleteInvoiceLineItem(pid: number) {
  try {
    return await prisma.$transaction(async (tx) => {
      const targetLine = await tx.invoiceSunglasses.findUnique({
        where: { invoiceItemID: pid },
      })
      if (!targetLine) throw new Error('ERR_LINE_NOT_FOUND')

      await tx.sunglasses.update({
        where: { itemID: targetLine.itemID },
        data: { stockQuantity: { increment: targetLine.quantity } },
      })

      await tx.invoiceSunglasses.delete({
        where: { invoiceItemID: pid },
      })

      return { success: true }
    })
  } catch (error: any) {
    return { success: false, error: error.message || 'ERR_DELETE_LINE_FAILED' }
  }
}