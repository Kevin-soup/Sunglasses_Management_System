'use client'

import React, { useState, useEffect } from 'react'
import { getCustomersTable, createCustomer, updateCustomer } from '@/actions/customers'

interface CustomerRecord {
  customerID: number
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
}

export default function CustomersPage() {
  const [data, setData] = useState<CustomerRecord[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null)

  useEffect(() => {
    let isMounted = true 

    async function loadTable() {
      try {
        const records = await getCustomersTable()
        if (isMounted) {
          setData(records as CustomerRecord[])
        }
      } catch {
        alert('Failed to sync data grid matrix from server.')
      }
    }

    loadTable()

    return () => {
      isMounted = false 
    }
  }, [])

  // READ: Helper routine to manual refresh data grid views after updates
  async function refreshTable() {
    try {
      const records = await getCustomersTable()
      setData(records as CustomerRecord[])
    } catch {
      alert('Failed to resync data grid matrix from server.')
    }
  }

  // CREATE: Handle insertion submission pipelines.
  async function handleCreate(formData: FormData) {
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const email = formData.get('email') as string
    const phoneNumber = formData.get('phoneNumber') as string

    const result = await createCustomer(firstName, lastName, email, phoneNumber)
    if (result.success) {
      await refreshTable()
      const createForm = document.getElementById('create-customer-form') as HTMLFormElement
      createForm?.reset()
    } else {
      alert(`Database rejected entity insertion: ${result.error}`)
    }
  }

  // UPDATE: Process changes to active selection records.
  async function handleUpdate(formData: FormData) {
    if (!selectedCustomer) return

    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const email = formData.get('email') as string
    const phoneNumber = formData.get('phoneNumber') as string

    const result = await updateCustomer(
      selectedCustomer.customerID,
      firstName,
      lastName,
      email,
      phoneNumber
    )

    if (result.success) {
      await refreshTable()
      setSelectedCustomer(null)
    } else {
      alert(`Update processing failure: ${result.error}`)
    }
  }

  // AUTOFILL: Dropdown change handler tracking state mutations.
  function handleDropdownChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const cid = parseInt(e.target.value, 10)
    const match = data.find((c) => c.customerID === cid) || null
    setSelectedCustomer(match)
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Customers</h1>

      {/* READ TABLE */}
      <table border={1} cellPadding={8} style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
        <thead>
          <tr>
            <th>Customer ID</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Email</th>
            <th>Phone Number</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.customerID}>
              <td>{row.customerID}</td>
              <td>{row.firstName}</td>
              <td>{row.lastName}</td>
              <td>{row.email || 'N/A'}</td>
              <td>{row.phoneNumber}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* CREATE FORM */}
      <h2>Add Customer</h2>
      <form id="create-customer-form" action={handleCreate}>
        <div className="form-group">
          <label htmlFor="create_firstName">First Name:</label>
          <input type="text" name="firstName" id="create_firstName" maxLength={100} required />
        </div>

        <div className="form-group">
          <label htmlFor="create_lastName">Last Name:</label>
          <input type="text" name="lastName" id="create_lastName" maxLength={100} required />
        </div>

        <div className="form-group">
          <label htmlFor="create_email">Email:</label>
          <input type="text" name="email" id="create_email" placeholder="sample@example.com" />
        </div>

        <div className="form-group">
          <label htmlFor="create_phoneNumber">Phone Number:</label>
          <input 
            type="text" 
            name="phoneNumber" 
            id="create_phoneNumber" 
            placeholder="123-456-7890" 
            pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}" 
            required 
          />
        </div>

        <button type="submit" className="btn btn-save">
          Create Customer
        </button>
      </form>

      <div style={{ marginBottom: '40px', paddingBottom: '20px' }} />

      {/* UPDATE FORM */}
      <h2>Update Customer</h2>
      <form action={handleUpdate}>
        <div className="form-group">
          <label htmlFor="update_customer_id_dropdown">Existing Customer:</label>
          <select 
            id="update_customer_id_dropdown" 
            onChange={handleDropdownChange} 
            value={selectedCustomer?.customerID || ''} 
            required
          >
            <option value="" disabled>&nbsp;</option>
            {data.map((row) => (
              <option key={row.customerID} value={row.customerID}>
                {row.firstName} {row.lastName} (ID: {row.customerID})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="update_firstName">First Name:</label>
          <input 
            type="text" 
            name="firstName" 
            id="update_firstName"
            value={selectedCustomer?.firstName || ''} 
            onChange={(e) => setSelectedCustomer(prev => prev ? { ...prev, firstName: e.target.value } : null)} 
            maxLength={100} 
            required 
          />
        </div>

        <div className="form-group">
          <label htmlFor="update_lastName">Last Name:</label>
          <input 
            type="text" 
            name="lastName" 
            id="update_lastName"
            value={selectedCustomer?.lastName || ''} 
            onChange={(e) => setSelectedCustomer(prev => prev ? { ...prev, lastName: e.target.value } : null)} 
            maxLength={100} 
            required 
          />
        </div>

        <div className="form-group">
          <label htmlFor="update_email">Email:</label>
          <input 
            type="text" 
            name="email" 
            id="update_email"
            value={selectedCustomer?.email || ''} 
            onChange={(e) => setSelectedCustomer(prev => prev ? { ...prev, email: e.target.value } : null)} 
            placeholder="sample@example.com"
          />
        </div>

        <div className="form-group">
          <label htmlFor="update_phoneNumber">Phone Number:</label>
          <input 
            type="text" 
            name="phoneNumber" 
            id="update_phoneNumber"
            value={selectedCustomer?.phoneNumber || ''} 
            onChange={(e) => setSelectedCustomer(prev => prev ? { ...prev, phoneNumber: e.target.value } : null)} 
            placeholder="123-456-7890"
            pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
            required 
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-save"
          disabled={!selectedCustomer} 
        >
          Update Customer
        </button>
      </form>
    </div>
  )
}