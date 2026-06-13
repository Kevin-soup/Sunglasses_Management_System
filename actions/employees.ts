// Procedure layer for employees table.

'use server'

import { prisma } from '@/services/prisma'
import { revalidatePath } from 'next/cache'

/**
 * PROCEDURE: sp_employees_table
 * PURPOSE: Read all employee attributes, sorting by primary key.
 * SELECT employeeID, firstName, lastName, DATE_FORMAT(hireDate, '%Y-%m-%d') AS hireDate, isActive, DATE_FORMAT(terminationDate, '%Y-%m-%d') AS terminationDate FROM Employees;
 */
export async function getEmployeesTable() {
  try {
    return await prisma.employees.findMany({
      orderBy: { employeeID: 'asc' },
    })
  } catch {
    throw new Error('ERR_EMPLOYEES_FETCH_FAILED')
  }
}

/**
 * PROCEDURE: sp_create_employee
 * PARAMETERS: p_firstName, p_lastName, p_hireDateStr, p_isActive, p_terminationDateStr
 * INSERT INTO Employees (firstName, lastName, hireDate, isActive, terminationDate) VALUES (:firstName_input, :lastName_input, :hireDate_input, :isActive_input, :terminationDate_input);
 */
export async function createEmployee(
  p_firstName: string,
  p_lastName: string,
  p_hireDateStr: string, 
  p_isActive: number,
  p_terminationDateStr: string | null // Accepts null for active employees
) {
  try {
    const hireDate = new Date(p_hireDateStr + 'T00:00:00')
    const terminationDate = p_terminationDateStr ? new Date(p_terminationDateStr + 'T00:00:00') : null

    await prisma.employees.create({
      data: {
        firstName: p_firstName,
        lastName: p_lastName,
        hireDate: hireDate,
        isActive: p_isActive,
        terminationDate: terminationDate,
      },
    })

    revalidatePath('/employees')
    return { success: true, error: null }
  } catch {
    return { success: false, error: 'ERR_EMPLOYEE_CREATE_FAILED' }
  }
}

/**
 * PROCEDURE: sp_update_employee
 * PARAMETERS: p_employeeID, p_firstName, p_lastName, p_hireDateStr, p_isActive, p_terminationDateStr
 * UPDATE Employees SET firstName = :firstName_input, lastName = :lastName_input, hireDate = :hireDate_input, isActive = :isActive_input, terminationDate = :terminationDate_input WHERE employeeID = :employeeID_selected_from_employees_page;
 */
export async function updateEmployee(
  p_employeeID: number,
  p_firstName: string,
  p_lastName: string,
  p_hireDateStr: string, 
  p_isActive: number,
  p_terminationDateStr: string | null // Accepts null if removing a termination date
) {
  try {
    const hireDate = new Date(p_hireDateStr + 'T00:00:00')
    const terminationDate = p_terminationDateStr ? new Date(p_terminationDateStr + 'T00:00:00') : null

    await prisma.employees.update({
      where: { employeeID: p_employeeID },
      data: {
        firstName: p_firstName,
        lastName: p_lastName,
        hireDate: hireDate,
        isActive: p_isActive,
        terminationDate: terminationDate,
      },
    })

    revalidatePath('/employees')
    return { success: true, error: null }
  } catch {
    return { success: false, error: 'ERR_EMPLOYEE_UPDATE_FAILED' }
  }
}