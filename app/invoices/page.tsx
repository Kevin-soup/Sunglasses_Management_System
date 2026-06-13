'use client'

import React, { useState, useEffect } from 'react'

import {
  getInvoicesTable,
  getCustomersDropdown,
  getEmployeesDropdown,
  createInvoice,
  updateInvoice,
  deleteInvoice
} from '@/actions/invoices'

interface CustomerRecord {
  customerID: number
  firstName: string
  lastName: string
}

interface EmployeeRecord {
  employeeID: number
  firstName: string
  lastName: string
}

interface InvoiceRecord {
  invoiceID: number
  customerID: number
  employeeID: number
  invoiceDate: Date | string
  customers?: CustomerRecord
  employees?: EmployeeRecord
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([])
  const [customers, setCustomers] = useState<CustomerRecord[]>([])
  const [employees, setEmployees] = useState<EmployeeRecord[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadPageData() {
      try {
        const [invoiceRows, customerRows, employeeRows] = await Promise.all([
          getInvoicesTable(),
          getCustomersDropdown(),
          getEmployeesDropdown()
        ])
        
        if (isMounted) {
          setInvoices(invoiceRows as InvoiceRecord[])
          setCustomers(customerRows as CustomerRecord[])
          setEmployees(employeeRows as EmployeeRecord[])
        }
      } catch {
        alert('Failed to sync master ledger records from database backend server.')
      }
    }

    loadPageData()

    return () => {
      isMounted = false
    }
  }, [])

  async function refreshPageData() {
    try {
      const [invoiceRows, customerRows, employeeRows] = await Promise.all([
        getInvoicesTable(),
        getCustomersDropdown(),
        getEmployeesDropdown()
      ])
      setInvoices(invoiceRows as InvoiceRecord[])
      setCustomers(customerRows as CustomerRecord[])
      setEmployees(employeeRows as EmployeeRecord[])
    } catch {
      alert('Failed to resync master ledger records from database backend server.')
    }
  }

  async function handleCreate(formData: FormData) {
    const customerID = parseInt(formData.get('customerID') as string, 10)
    const employeeID = parseInt(formData.get('employeeID') as string, 10)
    const rawDate = formData.get('invoiceDate') as string

    if (!customerID || !employeeID || !rawDate) {
      alert('All attributes are required to complete an invoice log registration.')
      return
    }

    const result = await createInvoice(customerID, employeeID, rawDate)
    
    if (result.success) {
      await refreshPageData()
      const formElement = document.getElementById('create-invoice-form') as HTMLFormElement
      formElement?.reset()
    } else {
      alert(`Transaction rejected: ${result.error}`)
    }
  }

  async function handleUpdate(formData: FormData) {
    if (!selectedInvoice) return

    const customerID = parseInt(formData.get('customerID') as string, 10)
    const employeeID = parseInt(formData.get('employeeID') as string, 10)
    const rawDate = formData.get('invoiceDate') as string

    if (!customerID || !employeeID || !rawDate) {
      alert('Please fill out all operational input variables before submitting updates.')
      return
    }

    const result = await updateInvoice(
      selectedInvoice.invoiceID,
      customerID,
      employeeID,
      rawDate
    )

    if (result.success) {
      await refreshPageData()
      setSelectedInvoice(null)
    } else {
      alert(`Update processing error: ${result.error}`)
    }
  }

  async function handleDelete(invoiceID: number) {
    if (!confirm('Are you sure you want to delete this invoice? Related lines will be checked.')) return

    const result = await deleteInvoice(invoiceID)
    if (result.success) {
      await refreshPageData()
      if (selectedInvoice?.invoiceID === invoiceID) {
        setSelectedInvoice(null)
      }
    } else {
      alert(`Deletion blocked by database safety constraints: ${result.error}`)
    }
  }

  function handleSelectionChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = parseInt(e.target.value, 10)
    const match = invoices.find((inv) => inv.invoiceID === id) || null
    setSelectedInvoice(match)
  }

  function formatDateForInput(dateVal: Date | string | undefined): string {
    if (!dateVal) return ''
    
    if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
      return dateVal
    }

    const d = new Date(dateVal)
    if (isNaN(d.getTime())) return ''
    
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    
    return `${year}-${month}-${day}`
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Invoices Log</h1>

      {/* MASTER GRID VIEW */}
      <table border={1} cellPadding={8} style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
        <thead>
          <tr>
            <th>Invoice ID</th>
            <th>Customer Name</th>
            <th>Assigned Employee</th>
            <th>Transaction Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((row) => (
            <tr key={row.invoiceID}>
              <td>{row.invoiceID}</td>
              <td>
                {row.customers 
                  ? `${row.customers.firstName} ${row.customers.lastName}` 
                  : `ID: ${row.customerID}`}
              </td>
              <td>
                {row.employees 
                  ? `${row.employees.firstName} ${row.employees.lastName}` 
                  : `ID: ${row.employeeID}`}
              </td>
              <td>
                {(() => {
                  const dateStr = typeof row.invoiceDate === 'string' 
                    ? row.invoiceDate.split('T')[0] 
                    : new Date(row.invoiceDate).toISOString().split('T')[0]
                  
                  const [year, month, day] = dateStr.split('-')
                  
                  return `${month}/${day}/${year}`
                })()}
              </td>
              <td>
                <button
                  type="button"
                  onClick={() => handleDelete(row.invoiceID)}
                  className="btn btn-delete"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* CREATE: FORM */}
      <h2>Create New Invoice</h2>
      <form id="create-invoice-form" action={handleCreate}>
        <div className="form-group">
          <label htmlFor="create_cust_select">Customer:</label>
          <select name="customerID" id="create_cust_select" defaultValue="" required>
            <option value="" disabled>&nbsp;</option>
            {customers.map((c) => (
              <option key={c.customerID} value={c.customerID}>
                {c.firstName} {c.lastName} (ID: {c.customerID})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="create_emp_select">Employee:</label>
          <select name="employeeID" id="create_emp_select" defaultValue="" required>
            <option value="" disabled>&nbsp;</option>
            {employees.map((e) => (
              <option key={e.employeeID} value={e.employeeID}>
                {e.firstName} {e.lastName} (ID: {e.employeeID})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="create_date_input">Invoice Date:</label>
          <input type="date" name="invoiceDate" id="create_date_input" required />
        </div>

        <button type="submit" className="btn btn-save">
          Create Invoice
        </button>
      </form>

      <div style={{ marginBottom: '40px', paddingBottom: '20px' }} />

      {/* UPDATE: FORM */}
      <h2>Modify Existing Record</h2>
      <form action={handleUpdate}>
        <div className="form-group">
          <label htmlFor="update_invoice_dropdown">Active Invoice:</label>
          <select 
            id="update_invoice_dropdown"
            onChange={handleSelectionChange}
            value={selectedInvoice?.invoiceID || ''}
            required
          >
            <option value="" disabled>&nbsp;</option>
            {invoices.map((inv) => (
              <option key={inv.invoiceID} value={inv.invoiceID}>
                Invoice Log #{inv.invoiceID} ({inv.customers?.lastName || 'ID: ' + inv.customerID})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="update_cust_select">Reassign Customer:</label>
          <select 
            name="customerID"
            id="update_cust_select"
            value={selectedInvoice ? selectedInvoice.customerID : ''}
            onChange={(e) => setSelectedInvoice(prev => prev ? { ...prev, customerID: parseInt(e.target.value, 10) } : null)}
            required
          >
            <option value="" disabled>&nbsp;</option>
            {customers.map((c) => (
              <option key={c.customerID} value={c.customerID}>
                {c.firstName} {c.lastName} (ID: {c.customerID})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="update_emp_select">Reassign Employee:</label>
          <select 
            name="employeeID"
            id="update_emp_select"
            value={selectedInvoice ? selectedInvoice.employeeID : ''}
            onChange={(e) => setSelectedInvoice(prev => prev ? { ...prev, employeeID: parseInt(e.target.value, 10) } : null)}
            required
          >
            <option value="" disabled>&nbsp;</option>
            {employees.map((e) => (
              <option key={e.employeeID} value={e.employeeID}>
                {e.firstName} {e.lastName} (ID: {e.employeeID})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="update_date_input">Adjust Date:</label>
          <input 
            type="date" 
            name="invoiceDate"
            id="update_date_input"
            value={selectedInvoice ? formatDateForInput(selectedInvoice.invoiceDate) : ''}
            onChange={(e) => setSelectedInvoice(prev => prev ? { ...prev, invoiceDate: e.target.value } : null)}
            required
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-save"
          disabled={!selectedInvoice}
        >
          Update Record
        </button>
      </form>
    </div>
  )
}