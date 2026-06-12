// Default page for application.
'use client'

import React from 'react'

export default function HomePage() {
  return (
    <div style={{ textAlign: 'center', marginTop: '40px', fontFamily: 'sans-serif' }}>
      <h1>Rainbow Sunglasses</h1>
      
      <div style={{ margin: '20px 0', fontSize: '1.1rem', color: '#666' }}>
        <p>Welcome to the Sunglasses Retail Management System!</p>
        <p>Use the navigation bar above to manage your store tables securely.</p>
      </div>

      <div style={{ 
        marginTop: '40px', 
        padding: '20px', 
        borderTop: '1px solid #ddd', 
        display: 'inline-block' 
      }}>
        <h2>Developed by Kevin Lin</h2>
      </div>
    </div>
  )
}