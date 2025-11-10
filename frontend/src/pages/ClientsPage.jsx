// frontend/src/pages/ClientsPage.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import Section from '../components/Section'
import Table from '../components/Table'
import ActionMenu from '../components/ActionMenu'
import { readExcelRows, mapRowByAliases, exportRowsToExcel } from "../lib/excel"

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/+$/,"");
const url = (p) => `${API_BASE}${p.startsWith('/')?p:`/${p}`}`;

const CLIENT_ALIASES = {
  name: ["name", "client", "customer", "client name"],
  phone: ["phone", "mobile", "msisdn", "tel", "Phone"],
  countryCode: ["countrycode", "cc", "CountryCode", "Country Code"],
  area: ["area"],
  notes: ["notes", "note"],
  tags: ["tags", "labels"],
  orders: ["orders", "ordercount", "total orders"],
  lastOrder: ["lastorder", "last order", "lastorderdate"],
  points: ["points", "loyalty", "score"],
}

function onlyDigits(s){ return String(s ?? "").replace(/[^0-9]/g, ""); }

async function api(p, opts={}){
  const res = await fetch(url(p), { mode:'cors', credentials:'include', ...opts });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} @ ${url(p)}\n` + await res.text().catch(()=>"(no body)"));
  const ct = res.headers.get('content-type') || '';
  return ct.includes('json') ? res.json() : res.text();
}

export default function ClientsPage() {
  const [rows, setRows] = useState([])
  const [q, setQ]       = useState('')
  const fileRef = useRef(null)

  useEffect(()=>{
    (async ()=>{
      try {
        const out = await api('/api/clients');
        setRows(Array.isArray(out.data) ? out.data : out);
      } catch (e) { alert(e.message) }
    })()
  }, [])

  const filtered = useMemo(
    ()=>rows.filter(r => (r.name || "").toLowerCase().includes(q.toLowerCase()) || (r.phone || "").includes(q)),
    [rows, q]
  )

  const columns = [
    { key: 'name',   title: 'Name' },
    { key: 'phone',  title: 'Phone' },
    { key: 'countryCode', title: 'CC' },
    { key: 'orders', title: 'Orders' },
    { key: 'lastOrder', title: 'Last Order' },
    { key: 'points', title: 'Points' },
  ]

  const exportExcel = () => exportRowsToExcel(filtered, [
    { key:'name', title:'Name' },
    { key:'phone', title:'Phone' },
    { key:'countryCode', title:'CountryCode' },
    { key:'area', title:'Area' },
    { key:'notes', title:'Notes' },
    { key:'tags', title:'Tags' },
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
        name: r.name || "",
        phone: String(r.phone || ""),
        countryCode: onlyDigits(r.countryCode || ""),
        area: r.area || "",
        notes: r.notes || "",
        tags: r.tags || "",
        orders: Number(r.orders || 0),
        lastOrder: String(r.lastOrder || ""),
        points: Number(r.points || 0),
      }))

      try {
        await api('/api/clients/bulk-upsert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: norm })
        })
      } catch (e1) {
        // fallback: upload file
        const fd = new FormData();
        fd.append('file', f);
        await api('/api/clients/import/excel', { method:'POST', body: fd })
      }

      const out = await api('/api/clients');
      setRows(Array.isArray(out.data) ? out.data : out);
      e.target.value = "";
      alert('Imported & synced.');
    } catch (err) {
      alert('Failed to import:\n' + err.message)
    }
  }

  async function removeRow(r){
    if (!confirm('Delete this client?')) return;
    try{
      await api(`/api/clients/${r._id}`, { method: "DELETE" })
      setRows(rows.filter(x=>x._id!==r._id))
    }catch(e){
      alert("Delete failed:\n" + e.message)
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
            <button className="btn" onClick={()=>alert('Edit TBD')}>Edit</button>
            <button className="btn" onClick={()=>removeRow(r)}>Delete</button>
          </div>
        )}]} data={filtered} />
      </Section>

      <Section title="Loyalty & Notes">
        <div className="text-mute">Purchase history UI placeholder — to connect with backend later.</div>
      </Section>
    </div>
  )
}
