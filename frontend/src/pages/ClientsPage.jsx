// frontend/src/pages/ClientsPage.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import Section from '../components/Section'
import Table from '../components/Table'
import ActionMenu from '../components/ActionMenu'
import { loadClients, saveClients } from '../lib/store'
import { readExcelRows, mapRowByAliases, exportRowsToExcel } from "../lib/excel"

const CLIENT_ALIASES = {
  id: ["id", "clientid", "key", "ID"],
  name: ["name", "client", "customer", "client name"],
  phone: ["phone", "mobile", "msisdn", "tel", "Phone"],
  orders: ["orders", "ordercount", "total orders", "Orders"],
  lastOrder: ["lastorder", "last order", "lastorderdate", "Last Order"],
  points: ["points", "loyalty", "score", "Points"],
}

// Normalize phone for matching: keep digits only to avoid Excel removing '+' or spaces
function normPhone(p){
  const digits = String(p ?? "").replace(/[^0-9]/g, "");
  return digits; // e.g., "+254 700 000 001" -> "254700000001"
}

export default function ClientsPage() {
  const [rows, setRows] = useState(loadClients())
  const [q, setQ]       = useState('')
  const fileRef = useRef(null)

  useEffect(()=>{ setRows(loadClients()) }, [])

  const filtered = useMemo(
    ()=>rows.filter(r => (r.name || "").toLowerCase().includes(q.toLowerCase()) || (r.phone || "").includes(q)),
    [rows, q]
  )

  const columns = [
    { key: 'name',   title: 'Name' },
    { key: 'phone',  title: 'Phone' },
    { key: 'orders', title: 'Orders' },
    { key: 'lastOrder', title: 'Last Order' },
    { key: 'points', title: 'Points' },
  ]

  function editRow(r){
    alert("Edit client not yet wired in this patch: " + (r.name || r.id));
  }

  function removeRow(id){
    const next = rows.filter(x=>x.id!==id)
    setRows(next)
    saveClients(next)
  }

  // Export now includes a stable ID column to preserve identifiers during round-trip
  const exportExcel = () => exportRowsToExcel(filtered, [
    { key:'id', title:'ID' },
    { key:'name', title:'Name' },
    { key:'phone', title:'Phone' },
    { key:'orders', title:'Orders' },
    { key:'lastOrder', title:'Last Order' },
    { key:'points', title:'Points' },
  ], "clients.xlsx")

  async function onImportExcel(e){
    const f = e.target.files?.[0]
    if (!f) return
    try {
      const rowsX = await readExcelRows(f)
      const norm = rowsX.map(r => mapRowByAliases(r, CLIENT_ALIASES)).map(r => ({
        id: r.id || String(Date.now() + Math.random()),
        name: r.name || "",
        phone: String(r.phone || ""),
        orders: Number(r.orders || 0),
        lastOrder: String(r.lastOrder || ""),
        points: Number(r.points || 0),
      }))
      // Merge by normalized phone if present; else by id (string compare)
      setRows(prev => {
        const byKey = Object.create(null)
        for (const p of prev) {
          const key = normPhone(p.phone) || ("id:" + String(p.id || ""))
          byKey[key] = p
        }
        for (const n of norm) {
          const k = normPhone(n.phone) || ("id:" + String(n.id || ""))
          byKey[k] = { ...(byKey[k] || {}), ...n }
        }
        const next = Object.values(byKey)
        saveClients(next)
        return next
      })
      e.target.value = ""
      alert("Imported Excel successfully into Clients.")
    } catch (err) {
      console.error(err)
      alert("Failed to import Excel: " + err.message)
    }
  }

  return (
    <div className="space-y-6">
      <Section
        title="Clients"
        actions={
          <div className="flex items-center gap-2">
            <input className="border border-line rounded-xl px-3 py-2" placeholder="Search…" value={q} onChange={e=>setQ(e.target.value)} />
            <ActionMenu label="Export" options={[{ label: 'Excel', onClick: exportExcel }]} />
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={onImportExcel}
            />
            <button className="btn" onClick={()=>fileRef.current?.click()}>Import Excel</button>
          </div>
        }
      >
        <Table columns={[...columns, {key:'__actions', title:'Actions', render:r=>(
          <div className="flex gap-2">
            <button className="btn" onClick={()=>editRow(r)}>Edit</button>
            <button className="btn" onClick={()=>removeRow(r.id)}>Delete</button>
          </div>
        )}]} data={filtered} />
      </Section>

      <Section title="Loyalty & Notes">
        <div className="text-mute">Purchase history UI placeholder — to connect with backend later.</div>
      </Section>
    </div>
  )
}
