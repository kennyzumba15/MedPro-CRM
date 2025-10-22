import React from 'react'
import PolicyList from './PolicyList'

export default function App(){
  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <header style={{ marginBottom: 20 }}>
        <h1>MedPro CRM</h1>
        <p>Simple policy status dashboard</p>
      </header>
      <PolicyList />
    </div>
  )
}
