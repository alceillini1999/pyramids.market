import React, { useMemo, useState } from 'react'
import Section from '../components/Section'
import Table from '../components/Table'

const INIT = [
  { id: 1, name: 'Mohamed Adel', phone: '+254700000001', orders: 12, lastOrder: '2025-02-01', points: 120 },
  { id: 2, name: 'Sara Nabil', phone: '+254700000002', orders: 4, lastOrder: '2025-02-03', points: 30 },
  { id: 3, name: 'Omar Ali', phone: '+254700000003', orders: 20, lastOrder: '2025-02-04', points: 220 },
]

export default function ClientsPage() {
  const [rows, setRows] = useState(INIT)
  const [q, setQ] = useState('')

  const filtered = useMemo(
    ()=>rows.filter(r => r.name.toLowerCase().includes(q.toLowerCase()) || r.phone.includes(q)),
    [rows, q]
  )

  const columns = [
    { key: 'name', title: 'Name' },
    { key: 'phone', title: 'Phone' },
    { key: 'orders', title: 'Orders' },
    { key: 'lastOrder', title: 'Last Order' },
    { key: 'points', title: 'Loyalty Points', render: r => (
      <div className="flex items-center gap-2">
        <span>{r.points}</span>
        <button className="btn" onClick={()=>setRows(rows.map(x=>x.id===r.id? {...x, points:x.points+10}:x))}>+10</button>
        <button className="btn" onClick={()=>setRows(rows.map(x=>x.id===r.id? {...x, points:Math.max(0,x.points-10)}:x))}>-10</button>
      </div>
    )},
  ]

  function exportCSV(){
    const header = ['name','phone','orders','lastOrder','points']
    const csv = header.join(',')+'\n'+filtered.map(r=>header.map(h=>r[h]).join(',')).join('\n')
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'})
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='clients.csv'; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Section
        title="Clients"
        actions={
          <div className="flex gap-2">
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search client..." className="rounded-xl border border-line px-3 py-2" />
            <button className="btn" onClick={exportCSV}>Export CSV</button>
          </div>
        }
      >
        <Table columns={columns} data={filtered} />
      </Section>

      <Section title="Client Purchases (demo)">
        <div className="text-mute">Purchase history UI placeholder — to connect with backend later.</div>
      </Section>
    </div>
  )
}
