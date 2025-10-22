import React, { useEffect, useState } from 'react'

export default function PolicyList(){
  const [policies, setPolicies] = useState([])

  useEffect(()=>{
    fetch('/api/policies').then(r=>r.json()).then(setPolicies)

    const es = new EventSource('/events')
    es.addEventListener('policy_update', e => {
      const data = JSON.parse(e.data)
      fetch('/api/policies').then(r=>r.json()).then(setPolicies)
    })
    return ()=> es.close()
  },[])

  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Client</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Carrier</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Policy ID</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Updated</th>
          </tr>
        </thead>
        <tbody>
          {policies.map(p => (
            <tr key={p.id}>
              <td style={{ padding: 8 }}>{p.client_name}</td>
              <td style={{ padding: 8 }}>{p.carrier_name}</td>
              <td style={{ padding: 8 }}>{p.carrier_policy_id}</td>
              <td style={{ padding: 8 }}>{p.current_status}</td>
              <td style={{ padding: 8 }}>{new Date(p.updated_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
