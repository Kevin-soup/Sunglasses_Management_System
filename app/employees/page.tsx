'use client'

import React, { useState, useEffect } from 'react'
import { getEmployeesTable, createEmployee, updateEmployee } from '@/actions/employees'

interface EmployeeRecord {
  employeeID: number
  firstName: string
  lastName: string
  hireDate: string | Date
  isActive: number
  terminationDate: string | Date | null
}

export default function EmployeesPage() {
  const [data, setData] = useState<EmployeeRecord[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRecord | null>(null)

  // Helper: Formats date into YYYY-MM-DD for HTML input.
  function formatDateForInput(dateInput: string | Date | undefined | null): string {
    if (!dateInput) return ''
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      return dateInput
    }
    const dateObject = new Date(dateInput)
    if (isNaN(dateObject.getTime())) return ''
    const year = dateObject.getFullYear()
    const month = String(dateObject.getMonth() + 1).padStart(2, '0')
    const day = String(dateObject.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  useEffect(() => {
    let isMounted = true 

    async function loadTable() {
      try {
        const records = await getEmployeesTable()
        if (isMounted) {
          setData(records as EmployeeRecord[])
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

  // READ: Isolated table refresh routine to call safely after mutations
  async function refreshTable() {
    try {
      const records = await getEmployeesTable()
      setData(records as EmployeeRecord[])
    } catch {
      alert('Failed to resync data grid matrix from server.')
    }
  }

  // CREATE: Handle insertion submission pipelines.
  async function handleCreate(formData: FormData) {
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const hireDateString = formData.get('hireDate') as string
    const terminationDateString = (formData.get('terminationDate') as string) || null
    
    // BUSINESS CONSTRAINT: Force active status to 0 (No) if a termination date is present
    const isActiveNumber = terminationDateString 
      ? 0 
      : parseInt(formData.get('isActive') as string, 10)

    if (!hireDateString) {
      alert('A valid hiring date metric is required.')
      return
    }

    const result = await createEmployee(firstName, lastName, hireDateString, isActiveNumber, terminationDateString)
    if (result.success) {
      await refreshTable()
      const createForm = document.getElementById('create-employee-form') as HTMLFormElement
      createForm?.reset()
    } else {
      alert(`Database rejected entity insertion: ${result.error}`)
    }
  }

  // UPDATE: Process changes to active selection records.
  async function handleUpdate(formData: FormData) {
    if (!selectedEmployee) return

    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const hireDateString = formData.get('hireDate') as string
    const terminationDateString = (formData.get('terminationDate') as string) || null

    // BUSINESS CONSTRAINT: Force active status to 0 (No) if a termination date is present
    const isActiveNumber = terminationDateString 
      ? 0 
      : parseInt(formData.get('isActive') as string, 10)

    if (!hireDateString) {
      alert('A valid hiring date metric is required.')
      return
    }

    const result = await updateEmployee(
      selectedEmployee.employeeID,
      firstName,
      lastName,
      hireDateString,
      isActiveNumber,
      terminationDateString
    )

    if (result.success) {
      await refreshTable()
      setSelectedEmployee(null)
    } else {
      alert(`Update processing failure: ${result.error}`)
    }
  }

  // AUTOFILL: Dropdown change handler tracking state mutations.
  function handleDropdownChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const eid = parseInt(e.target.value, 10)
    const match = data.find((emp) => emp.employeeID === eid) || null
    setSelectedEmployee(match)
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Employees</h1>

      {/* READ TABLE */}
      <table border={1} cellPadding={8} style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
        <thead>
          <tr>
            <th>Employee ID</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Hire Date</th>
            <th>Termination Date</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.employeeID}>
              <td>{row.employeeID}</td>
              <td>{row.firstName}</td>
              <td>{row.lastName}</td>
              <td>
                {(() => {
                  const dateStr = typeof row.hireDate === 'string' 
                    ? row.hireDate.split('T')[0] 
                    : new Date(row.hireDate).toISOString().split('T')[0]
                  const [year, month, day] = dateStr.split('-')
                  return `${month}/${day}/${year}`
                })()}
              </td>
              <td>
                {row.terminationDate ? (() => {
                  const dateStr = typeof row.terminationDate === 'string' 
                    ? row.terminationDate.split('T')[0] 
                    : new Date(row.terminationDate).toISOString().split('T')[0]
                  const [year, month, day] = dateStr.split('-')
                  return `${month}/${day}/${year}`
                })() : ''}
              </td>
              <td>{row.isActive === 1 ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* CREATE FORM */}
      <h2>Add Employee</h2>
      <form id="create-employee-form" action={handleCreate}>
        <div className="form-group">
          <label htmlFor="create_firstName">First Name:</label>
          <input type="text" name="firstName" id="create_firstName" maxLength={100} required />
        </div>

        <div className="form-group">
          <label htmlFor="create_lastName">Last Name:</label>
          <input type="text" name="lastName" id="create_lastName" maxLength={100} required />
        </div>

        <div className="form-group">
          <label htmlFor="create_hireDate">Hire Date:</label>
          <input 
            type="date" 
            name="hireDate" 
            id="create_hireDate" 
            placeholder=""
            data-hover-reveal="true" 
            required 
          />
        </div>

        <div className="form-group">
          <label htmlFor="create_terminationDate">Termination Date:</label>
          <input 
            type="date" 
            name="terminationDate" 
            id="create_terminationDate" 
            placeholder=""
            data-hover-reveal="true" 
            onChange={(e) => {
              // UI Syncer: If termination date is chosen, auto-flip dropdown selection to 'No'
              const selectEl = document.getElementById('create_isActive') as HTMLSelectElement
              if (e.target.value && selectEl) {
                selectEl.value = '0'
              }
            }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="create_isActive">Active:</label>
          <select name="isActive" id="create_isActive" defaultValue="" required>
            <option value="" disabled>&nbsp;</option>
            <option value="1">Yes</option>
            <option value="0">No</option>
          </select>
        </div>

        <button type="submit" className="btn btn-save">
          Create Employee
        </button>
      </form>

      <div style={{ marginBottom: '40px', paddingBottom: '20px' }} />

      {/* UPDATE FORM */}
      <h2>Update Employee</h2>
      <form action={handleUpdate}>
        <div className="form-group">
          <label htmlFor="update_employee_id_dropdown">Existing Employee:</label>
          <select 
            id="update_employee_id_dropdown" 
            onChange={handleDropdownChange} 
            value={selectedEmployee?.employeeID || ''} 
            required
          >
            <option value="" disabled>&nbsp;</option>
            {data.map((row) => (
              <option key={row.employeeID} value={row.employeeID}>
                {row.firstName} {row.lastName} (ID: {row.employeeID})
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
            value={selectedEmployee?.firstName || ''} 
            onChange={(e) => setSelectedEmployee(prev => prev ? { ...prev, firstName: e.target.value } : null)} 
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
            value={selectedEmployee?.lastName || ''} 
            onChange={(e) => setSelectedEmployee(prev => prev ? { ...prev, lastName: e.target.value } : null)} 
            maxLength={100} 
            required 
          />
        </div>

        <div className="form-group">
          <label htmlFor="update_hireDate">Hire Date:</label>
          <input 
            type="date" 
            name="hireDate" 
            id="update_hireDate"
            value={selectedEmployee ? formatDateForInput(selectedEmployee.hireDate) : ''} 
            onChange={(e) => setSelectedEmployee(prev => prev ? { ...prev, hireDate: e.target.value } : null)} 
            placeholder=""
            data-hover-reveal="true"
            required 
          />
        </div>

        <div className="form-group">
          <label htmlFor="update_terminationDate">Termination Date:</label>
          <input 
            type="date" 
            name="terminationDate" 
            id="update_terminationDate"
            value={selectedEmployee?.terminationDate ? formatDateForInput(selectedEmployee.terminationDate) : ''} 
            onChange={(e) => {
              const val = e.target.value || null
              setSelectedEmployee(prev => {
                if (!prev) return null
                // UI & State Syncer: Automatically flip active code state to 'No' (0) if there's a termination date string
                return { 
                  ...prev, 
                  terminationDate: val, 
                  isActive: val ? 0 : prev.isActive 
                }
              })
            }} 
            placeholder=""
            data-hover-reveal="true"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="update_isActive">Active:</label>
          <select 
            name="isActive" 
            id="update_isActive"
            value={selectedEmployee !== null ? String(selectedEmployee.isActive) : ''}
            onChange={(e) => setSelectedEmployee(prev => prev ? { ...prev, isActive: parseInt(e.target.value, 10) } : null)}
            required
          >
            <option value="" disabled>&nbsp;</option>
            <option value="1">Yes</option>
            <option value="0">No</option>
          </select>
        </div>

        <button 
          type="submit" 
          className="btn btn-save"
          disabled={!selectedEmployee} 
        >
          Update Employee
        </button>
      </form>
    </div>
  )
}