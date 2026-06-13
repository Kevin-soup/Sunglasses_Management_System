'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { getEmployeesTable, createEmployee, updateEmployee } from '@/actions/employees'

interface EmployeeRecord {
  employeeID: number
  firstName: string
  lastName: string
  hireDate: string | Date
  isActive: number
  terminationDate: string | Date | null
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

// Returns an error string if invalid, or null if valid
function validateDate(value: string): string | null {
  if (!value.trim()) return null // empty is handled separately by required checks
  const m = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return 'Date must be in mm/dd/yyyy format.'
  const month = parseInt(m[1], 10)
  const day = parseInt(m[2], 10)
  const year = parseInt(m[3], 10)
  if (month < 1 || month > 12) return `Invalid month "${m[1]}". Must be 01–12.`
  const daysInMonth = new Date(year, month, 0).getDate() // day 0 of next month = last day of this month
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

// Self-contained date input — owns a ref and exposes value+handlers via a stable interface
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

export default function EmployeesPage() {
  const [data, setData] = useState<EmployeeRecord[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRecord | null>(null)

  const [createHireDate, setCreateHireDate] = useState('')
  const [createTermDate, setCreateTermDate] = useState('')
  const [updateHireDate, setUpdateHireDate] = useState('')
  const [updateTermDate, setUpdateTermDate] = useState('')

  // Sync update date fields only when selected employee ID changes
  useEffect(() => {
    setUpdateHireDate(selectedEmployee ? formatDateForDisplay(selectedEmployee.hireDate) : '')
    setUpdateTermDate(selectedEmployee?.terminationDate ? formatDateForDisplay(selectedEmployee.terminationDate) : '')
  }, [selectedEmployee?.employeeID])

  useEffect(() => {
    let isMounted = true
    async function loadTable() {
      try {
        const records = await getEmployeesTable()
        if (isMounted) setData(records as EmployeeRecord[])
      } catch {
        alert('Failed to sync data grid matrix from server.')
      }
    }
    loadTable()
    return () => { isMounted = false }
  }, [])

  async function refreshTable() {
    try {
      const records = await getEmployeesTable()
      setData(records as EmployeeRecord[])
    } catch {
      alert('Failed to resync data grid matrix from server.')
    }
  }

  async function handleCreate(formData: FormData) {
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const hireDateError = validateDate(createHireDate) ?? (!createHireDate.trim() ? 'Hire date is required.' : null)
    if (hireDateError) { alert(`Hire Date: ${hireDateError}`); return }
    const termDateError = createTermDate.trim() ? validateDate(createTermDate) : null
    if (termDateError) { alert(`Termination Date: ${termDateError}`); return }
    const hireDateString = parseDateInput(createHireDate)!
    const terminationDateString = parseDateInput(createTermDate)
    const isActiveNumber = terminationDateString ? 0 : parseInt(formData.get('isActive') as string, 10)
    const result = await createEmployee(firstName, lastName, hireDateString, isActiveNumber, terminationDateString)
    if (result.success) {
      await refreshTable()
      setCreateHireDate('')
      setCreateTermDate('')
      const createForm = document.getElementById('create-employee-form') as HTMLFormElement
      createForm?.reset()
    } else {
      alert(`Database rejected entity insertion: ${result.error}`)
    }
  }

  async function handleUpdate(formData: FormData) {
    if (!selectedEmployee) return
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const hireDateError = validateDate(updateHireDate) ?? (!updateHireDate.trim() ? 'Hire date is required.' : null)
    if (hireDateError) { alert(`Hire Date: ${hireDateError}`); return }
    const termDateError = updateTermDate.trim() ? validateDate(updateTermDate) : null
    if (termDateError) { alert(`Termination Date: ${termDateError}`); return }
    const hireDateString = parseDateInput(updateHireDate)!
    const terminationDateString = parseDateInput(updateTermDate)
    const isActiveNumber = terminationDateString ? 0 : parseInt(formData.get('isActive') as string, 10)
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
      setUpdateHireDate('')
      setUpdateTermDate('')
    } else {
      alert(`Update processing failure: ${result.error}`)
    }
  }

  function handleDropdownChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const eid = parseInt(e.target.value, 10)
    const match = data.find((emp) => emp.employeeID === eid) || null
    setSelectedEmployee(match)
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Employees</h1>

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
          <DateInput id="create_hireDate" value={createHireDate} onChange={setCreateHireDate} required />
        </div>
        <div className="form-group">
          <label htmlFor="create_terminationDate">Termination Date:</label>
          <DateInput id="create_terminationDate" value={createTermDate} onChange={setCreateTermDate} />
        </div>
        <div className="form-group">
          <label htmlFor="create_isActive">Active:</label>
          <select name="isActive" id="create_isActive" defaultValue="" required>
            <option value="" disabled>&nbsp;</option>
            <option value="1">Yes</option>
            <option value="0">No</option>
          </select>
        </div>
        <button type="submit" className="btn btn-save">Create Employee</button>
      </form>

      <div style={{ marginBottom: '40px', paddingBottom: '20px' }} />

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
          <DateInput id="update_hireDate" value={updateHireDate} onChange={setUpdateHireDate} required />
        </div>
        <div className="form-group">
          <label htmlFor="update_terminationDate">Termination Date:</label>
          <DateInput
            id="update_terminationDate"
            value={updateTermDate}
            onChange={(val) => {
              setUpdateTermDate(val)
              setSelectedEmployee(prev => prev ? { ...prev, isActive: val ? 0 : prev.isActive } : null)
            }}
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
        <button type="submit" className="btn btn-save" disabled={!selectedEmployee}>
          Update Employee
        </button>
      </form>
    </div>
  )
}