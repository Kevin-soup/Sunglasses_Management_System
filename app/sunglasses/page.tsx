'use client'

import React, { useState, useEffect } from 'react'
import { getSunglassesTable, createSunglasses, updateSunglasses } from '@/actions/sunglasses'

interface SunglassesRecord {
  itemID: number
  itemName: string
  retailPrice: number | string | { toString(): string } 
  stockQuantity: number
  isListed: number
}

export default function SunglassesPage() {
  const [data, setData] = useState<SunglassesRecord[]>([])
  const [selectedItem, setSelectedItem] = useState<SunglassesRecord | null>(null)

  // READ: Hydrate the data grid matrix on mount
  async function loadTable() {
    try {
      const records = await getSunglassesTable()
      setData(records as SunglassesRecord[])
    } catch (error) {
      alert('Failed to sync data grid matrix from server.')
    }
  }

  useEffect(() => {
    loadTable()
  }, [])

  // CREATE: Handle insertion submission pipelines
  async function handleCreate(formData: FormData) {
    const itemName = formData.get('itemName') as string
    const retailPrice = parseFloat(formData.get('retailPrice') as string)
    const stockQuantity = parseInt(formData.get('stockQuantity') as string, 10)
    const isListed = parseInt(formData.get('isListed') as string, 10)

    if (isNaN(retailPrice) || isNaN(stockQuantity)) {
      alert('Retail Price and Stock Quantity must be valid numeric metrics.')
      return
    }

    const result = await createSunglasses(itemName, retailPrice, stockQuantity, isListed)
    if (result.success) {
      loadTable()
      const createForm = document.getElementById('create-sunglasses-form') as HTMLFormElement
      createForm?.reset()
    } else {
      alert(`Database rejected entity insertion: ${result.error}`)
    }
  }

  // UPDATE: Process changes to active selection records
  async function handleUpdate(formData: FormData) {
    if (!selectedItem) return

    const itemName = formData.get('itemName') as string
    const retailPrice = parseFloat(formData.get('retailPrice') as string)
    const stockQuantity = parseInt(formData.get('stockQuantity') as string, 10)
    const isListed = parseInt(formData.get('isListed') as string, 10)

    if (isNaN(retailPrice) || isNaN(stockQuantity)) {
      alert('Retail Price and Stock Quantity must be valid numeric attributes.')
      return
    }

    const result = await updateSunglasses(
      selectedItem.itemID,
      itemName,
      retailPrice,
      stockQuantity,
      isListed
    )

    if (result.success) {
      loadTable()
      setSelectedItem(null)
    } else {
      alert(`Update processing failure: ${result.error}`)
    }
  }

  // AUTOFILL: Dropdown change handler tracking state mutations
  function handleDropdownChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const iid = parseInt(e.target.value, 10)
    const match = data.find((item) => item.itemID === iid) || null
    setSelectedItem(match)
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Sunglasses</h1>

      {/* READ TABLE */}
      <table border={1} cellPadding={8} style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
        <thead>
          <tr>
            <th>Item ID</th>
            <th>Item Name</th>
            <th>Retail Price</th>
            <th>Stock Quantity</th>
            <th>For Sale</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.itemID}>
              <td>{row.itemID}</td>
              <td>{row.itemName}</td>
              <td>{Number(row.retailPrice).toFixed(2)}</td>
              <td>{row.stockQuantity}</td>
              <td>{row.isListed === 1 ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* CREATE FORM */}
      <h2>Add Sunglasses</h2>
      <form id="create-sunglasses-form" action={handleCreate}>
        <div className="form-group">
          <label htmlFor="create_itemName">Item Name:</label>
          <input type="text" name="itemName" id="create_itemName" maxLength={100} required />
        </div>

        <div className="form-group">
          <label htmlFor="create_retailPrice">Retail Price:</label>
          <input type="number" step="0.01" name="retailPrice" id="create_retailPrice" required />
        </div>

        <div className="form-group">
          <label htmlFor="create_stockQuantity">Stock Quantity:</label>
          <input type="number" name="stockQuantity" id="create_stockQuantity" required />
        </div>

        <div className="form-group">
          <label htmlFor="create_isListed">For Sale:</label>
          <select name="isListed" id="create_isListed" defaultValue="" required>
            <option value="" disabled>&nbsp;</option>
            <option value="1">Yes</option>
            <option value="0">No</option>
          </select>
        </div>

        <button type="submit" className="btn btn-save">
          Create Sunglasses
        </button>
      </form>

      <div style={{ marginBottom: '40px', paddingBottom: '20px' }} />

      {/* UPDATE FORM */}
      <h2>Update Sunglasses</h2>
      <form action={handleUpdate}>
        <div className="form-group">
          <label htmlFor="update_item_id_dropdown">Existing Item:</label>
          <select 
            id="update_item_id_dropdown" 
            onChange={handleDropdownChange} 
            value={selectedItem?.itemID || ''} 
            required
          >
            <option value="" disabled>&nbsp;</option>
            {data.map((row) => (
              <option key={row.itemID} value={row.itemID}>
                {row.itemName} (ID: {row.itemID})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="update_itemName">Item Name:</label>
          <input 
            type="text" 
            name="itemName" 
            id="update_itemName"
            value={selectedItem?.itemName || ''} 
            onChange={(e) => setSelectedItem(prev => prev ? { ...prev, itemName: e.target.value } : null)} 
            maxLength={100} 
            required 
          />
        </div>

        <div className="form-group">
          <label htmlFor="update_retailPrice">Retail Price:</label>
          <input 
            type="number" 
            step="0.01" 
            name="retailPrice" 
            id="update_retailPrice"
            value={selectedItem !== null ? String(selectedItem.retailPrice) : ''} 
            onChange={(e) => setSelectedItem(prev => prev ? { ...prev, retailPrice: e.target.value } : null)} 
            required 
          />
        </div>

        <div className="form-group">
          <label htmlFor="update_stockQuantity">Stock Quantity:</label>
          <input 
            type="number" 
            name="stockQuantity" 
            id="update_stockQuantity"
            value={selectedItem !== null ? selectedItem.stockQuantity : ''} 
            onChange={(e) => setSelectedItem(prev => prev ? { ...prev, stockQuantity: parseInt(e.target.value, 10) || 0 } : null)} 
            required 
          />
        </div>

        <div className="form-group">
          <label htmlFor="update_isListed">For Sale:</label>
          <select 
            name="isListed" 
            id="update_isListed"
            /* 🌟 Drop back to an empty string when null so the :invalid CSS rule catches it */
            value={selectedItem !== null ? String(selectedItem.isListed) : ''}
            onChange={(e) => setSelectedItem(prev => prev ? { ...prev, isListed: parseInt(e.target.value, 10) } : null)}
            required
          >
            {/* 🌟 Placeholder option that renders faded when no selection is loaded */}
            <option value="" disabled>&nbsp;</option>
            <option value="1">Yes</option>
            <option value="0">No</option>
          </select>
        </div>

        <button 
          type="submit" 
          className="btn btn-save"
          disabled={!selectedItem} 
        >
          Update Sunglasses
        </button>
      </form>
    </div>
  )
}