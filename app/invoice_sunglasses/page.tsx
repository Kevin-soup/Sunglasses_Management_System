'use client'

import React, { useState, useEffect } from 'react'
import { 
  getInvoiceSunglassesTable, 
  getInvoicesDropdown, 
  getSunglassesDropdown, 
  createInvoiceLineItem, 
  updateInvoiceLineItem, 
  deleteInvoiceLineItem 
} from '@/actions/invoices'

interface LineItemRecord {
  invoiceItemID: number
  invoiceID: number
  itemID: number
  quantity: number
  invoices?: {
    customers?: {
      firstName: string
      lastName: string
    }
  }
  sunglasses?: {
    itemName: string
  }
}

interface InvoiceDropdownRecord {
  invoiceID: number
  customers?: {
    firstName: string
    lastName: string
  }
}

interface SunglassesDropdownRecord {
  itemID: number
  itemName: string
  stockQuantity: number
}

interface PageState {
  data: LineItemRecord[]
  invoices: InvoiceDropdownRecord[]
  sunglasses: SunglassesDropdownRecord[]
}

export default function InvoiceSunglassesPage() {
  const [state, setState] = useState<PageState>({
    data: [],
    invoices: [],
    sunglasses: []
  })
  const [selectedLine, setSelectedLine] = useState<LineItemRecord | null>(null)

  useEffect(() => {
    let isMounted = true 

    async function loadPageData() {
      try {
        const [tableRecords, invoiceRecords, productRecords] = await Promise.all([
          getInvoiceSunglassesTable(),
          getInvoicesDropdown(),
          getSunglassesDropdown()
        ])
        
        if (isMounted) {
          setState({
            data: tableRecords as LineItemRecord[],
            invoices: invoiceRecords as InvoiceDropdownRecord[],
            sunglasses: productRecords as SunglassesDropdownRecord[]
          })
        }
      } catch {
        alert('Failed to sync intersection relational grid records from server.')
      }
    }

    loadPageData()

    return () => {
      isMounted = false 
    }
  }, [])

  async function refreshPageData() {
    try {
      const [tableRecords, invoiceRecords, productRecords] = await Promise.all([
        getInvoiceSunglassesTable(),
        getInvoicesDropdown(),
        getSunglassesDropdown()
      ])
      setState({
        data: tableRecords as LineItemRecord[],
        invoices: invoiceRecords as InvoiceDropdownRecord[],
        sunglasses: productRecords as SunglassesDropdownRecord[]
      })
    } catch {
      alert('Failed to resync interface matrix datasets.')
    }
  }

  async function handleCreate(formData: FormData) {
    const invoiceID = parseInt(formData.get('invoiceID') as string, 10)
    const itemID = parseInt(formData.get('itemID') as string, 10)
    const quantity = parseInt(formData.get('quantity') as string, 10)

    if (!invoiceID || !itemID || !quantity) {
      alert('All structural attributes are required.')
      return
    }

    const result = await createInvoiceLineItem(invoiceID, itemID, quantity)
    if (result.success) {
      await refreshPageData()
      const createForm = document.getElementById('create-line-form') as HTMLFormElement
      createForm?.reset()
    } else {
      alert(`Transaction dropped by validation rules: ${result.error}`)
    }
  }

  async function handleUpdate(formData: FormData) {
    if (!selectedLine) return

    const itemID = parseInt(formData.get('itemID') as string, 10)
    const quantity = parseInt(formData.get('quantity') as string, 10)

    if (!itemID || !quantity) {
      alert('All fields must be valid attributes.')
      return
    }

    const result = await updateInvoiceLineItem(selectedLine.invoiceItemID, itemID, quantity)
    if (result.success) {
      await refreshPageData()
      setSelectedLine(null)
    } else {
      alert(`Update rejected: ${result.error}`)
    }
  }

  async function handleDelete(invoiceItemID: number) {
    if (!confirm('Are you sure you want to remove this line item? Stock quantities will be adjusted.')) return

    const result = await deleteInvoiceLineItem(invoiceItemID)
    if (result.success) {
      await refreshPageData()
      if (selectedLine?.invoiceItemID === invoiceItemID) {
        setSelectedLine(null)
      }
    } else {
      alert(`Deletion processing failure: ${result.error}`)
    }
  }

  function handleDropdownChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = parseInt(e.target.value, 10)
    const match = state.data.find((line) => line.invoiceItemID === id) || null
    setSelectedLine(match)
  }

  return (
    <div className="page-container">
      <h1>Invoice Sunglasses (Line Items)</h1>

      {/* READ TABLE */}
      <table border={1} cellPadding={8} className="data-table">
        <thead>
          <tr>
            <th>Line ID</th>
            <th>Invoice ID</th>
            <th>Customer Name</th>
            <th>Sunglasses</th>
            <th>Quantity Ordered</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {state.data.map((row) => (
            <tr key={row.invoiceItemID}>
              <td>{row.invoiceItemID}</td>
              <td>{row.invoiceID}</td>
              <td>{row.invoices?.customers ? `${row.invoices.customers.firstName} ${row.invoices.customers.lastName}` : 'N/A'}</td>
              <td>{row.sunglasses?.itemName || 'N/A'}</td>
              <td>{row.quantity}</td>
              <td>
                <button 
                  type="button" 
                  onClick={() => handleDelete(row.invoiceItemID)}
                  className="btn btn-delete"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* CREATE FORM */}
      <h2>Add Item to Invoice</h2>
      <form id="create-line-form" action={handleCreate}>
        <div className="form-group">
          <label htmlFor="create_invoice_id">Invoice:</label>
          <select name="invoiceID" id="create_invoice_id" defaultValue="" required>
            <option value="" disabled>&nbsp;</option>
            {state.invoices.map((inv) => (
              <option key={inv.invoiceID} value={inv.invoiceID}>
                Invoice #{inv.invoiceID} ({inv.customers ? `${inv.customers.firstName} ${inv.customers.lastName}` : 'N/A'})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="create_item_id">Sunglasses:</label>
          <select name="itemID" id="create_item_id" defaultValue="" required>
            <option value="" disabled>&nbsp;</option>
            {state.sunglasses.map((sun) => (
              <option key={sun.itemID} value={sun.itemID}>
                {sun.itemName} (Available: {sun.stockQuantity})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="create_quantity">Quantity:</label>
          <input type="number" min={1} name="quantity" id="create_quantity" required />
        </div>

        <button type="submit" className="btn btn-save">
          Add Item
        </button>
      </form>

      <div className="form-spacer" />

      {/* UPDATE FORM */}
      <h2>Update Item</h2>
      <form action={handleUpdate}>
        <div className="form-group">
          <label htmlFor="update_line_id_dropdown">Ledger Entry:</label>
          <select 
            id="update_line_id_dropdown" 
            onChange={handleDropdownChange} 
            value={selectedLine?.invoiceItemID || ''} 
            required
          >
            <option value="" disabled>&nbsp;</option>
            {state.data.map((row) => (
              <option key={row.invoiceItemID} value={row.invoiceItemID}>
                Line #{row.invoiceItemID} (Inv #{row.invoiceID} - {row.sunglasses?.itemName})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="update_item_id">Sunglasses:</label>
          <select 
            name="itemID" 
            id="update_item_id"
            value={selectedLine?.itemID || ''}
            onChange={(e) => setSelectedLine(prev => prev ? { ...prev, itemID: parseInt(e.target.value, 10) } : null)}
            required
          >
            <option value="" disabled>&nbsp;</option>
            {state.sunglasses.map((sun) => (
              <option key={sun.itemID} value={sun.itemID}>
                {sun.itemName} (Available: {sun.stockQuantity})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="update_quantity">Quantity:</label>
          <input
            type="number"
            min={1}
            name="quantity"
            id="update_quantity"
            value={selectedLine?.quantity ?? ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSelectedLine(prev =>
                prev
                  ? {
                      ...prev,
                      quantity: Number(e.target.value)
                    }
                  : null
              )
            }
            required
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-save"
          disabled={!selectedLine}
        >
          Update Item
        </button>
      </form>
    </div>
  )
}