'use client'

import React, { useState, useEffect, useRef } from 'react'

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

function formatDateForDisplay(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return ''
  if (typeof dateInput === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateInput)) return dateInput
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const [year, month, day] = dateInput.split('-')
    return `${month}/${day}/${year}`
  }
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) return ''
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`
}

function parseDateInput(value: string): string | null {
  const m = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return null
  return `${m[3]}-${m[1]}-${m[2]}`
}

function validateDate(value: string): string | null {
  if (!value.trim()) return null
  const m = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return 'Date must be in mm/dd/yyyy format.'
  const month = parseInt(m[1], 10)
  const day = parseInt(m[2], 10)
  const year = parseInt(m[3], 10)
  if (month < 1 || month > 12) return `Invalid month "${m[1]}". Must be 01–12.`
  const daysInMonth = new Date(year, month, 0).getDate()
  if (day < 1 || day > daysInMonth) return `Invalid day "${m[2]}" for ${m[1]}/${m[3]}. Must be 01–${String(daysInMonth).padStart(2, '0')}.`
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const entered = new Date(year, month - 1, day)
  if (entered > today) return 'Date cannot be in the future.'
  return null
}

function applyDateMask(digits: string): string {
  const d = digits.slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
}

function DateInput({
  id,
  value,
  onChange,
  placeholder = 'mm/dd/yyyy',
  required,
}: {
  id?: string
  value: string
  onChange: (val: string) => void
  placeholder?: string
  required?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = inputRef.current
    if (!input) return
    const raw = e.target.value
    const cursorPos = input.selectionStart ?? raw.length
    const digits = raw.replace(/\//g, '')
    if (digits.length > 8) return
    const newVal = applyDateMask(digits)
    onChange(newVal)
    requestAnimationFrame(() => {
      if (!inputRef.current) return
      let digitCount = 0
      for (let i = 0; i < cursorPos; i++) {
        if (raw[i] && raw[i] !== '/') digitCount++
      }
      let count = 0
      let newPos = newVal.length
      for (let i = 0; i < newVal.length; i++) {
        if (newVal[i] !== '/') count++
        if (count === digitCount) { newPos = i + 1; break }
      }
      inputRef.current.setSelectionRange(newPos, newPos)
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const input = inputRef.current
    if (!input || e.key !== 'Backspace') return
    e.preventDefault()
    const pos = input.selectionStart ?? value.length
    const digits = value.replace(/\//g, '')
    let digitsBefore = 0
    for (let i = 0; i < pos; i++) {
      if (value[i] !== '/') digitsBefore++
    }
    if (digitsBefore === 0) return
    const newDigits = digits.slice(0, digitsBefore - 1) + digits.slice(digitsBefore)
    const newVal = applyDateMask(newDigits)
    onChange(newVal)
    requestAnimationFrame(() => {
      if (!inputRef.current) return
      let count = 0
      let newPos = 0
      for (let i = 0; i < newVal.length; i++) {
        if (newVal[i] !== '/') count++
        if (count === digitsBefore - 1) { newPos = i + 1; break }
      }
      inputRef.current.setSelectionRange(newPos, newPos)
    })
  }

  return (
    <input
      ref={inputRef}
      type="text"
      id={id}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      required={required}
    />
  )
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([])
  const [customers, setCustomers] = useState<CustomerRecord[]>([])
  const [employees, setEmployees] = useState<EmployeeRecord[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null)

  const [createInvoiceDate, setCreateInvoiceDate] = useState('')
  const [updateInvoiceDate, setUpdateInvoiceDate] = useState('')

  useEffect(() => {
    setUpdateInvoiceDate(selectedInvoice ? formatDateForDisplay(selectedInvoice.invoiceDate) : '')
  }, [selectedInvoice?.invoiceID])

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

    const invoiceDateError = validateDate(createInvoiceDate) ?? (!createInvoiceDate.trim() ? 'Invoice date is required.' : null)
    if (invoiceDateError) { alert(`Invoice Date: ${invoiceDateError}`); return }

    if (!customerID || !employeeID) {
      alert('All attributes are required to complete an invoice log registration.')
      return
    }

    const invoiceDateString = parseDateInput(createInvoiceDate)!
    const result = await createInvoice(customerID, employeeID, invoiceDateString)
    
    if (result.success) {
      await refreshPageData()
      setCreateInvoiceDate('')
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

    const invoiceDateError = validateDate(updateInvoiceDate) ?? (!updateInvoiceDate.trim() ? 'Invoice date is required.' : null)
    if (invoiceDateError) { alert(`Invoice Date: ${invoiceDateError}`); return }

    if (!customerID || !employeeID) {
      alert('Please fill out all operational input variables before submitting updates.')
      return
    }

    const invoiceDateString = parseDateInput(updateInvoiceDate)!
    const result = await updateInvoice(
      selectedInvoice.invoiceID,
      customerID,
      employeeID,
      invoiceDateString
    )

    if (result.success) {
      await refreshPageData()
      setSelectedInvoice(null)
      setUpdateInvoiceDate('')
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
          <DateInput id="create_date_input" value={createInvoiceDate} onChange={setCreateInvoiceDate} required />
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
          <DateInput id="update_date_input" value={updateInvoiceDate} onChange={setUpdateInvoiceDate} required />
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