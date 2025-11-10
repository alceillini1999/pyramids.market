import React, { useMemo, useRef, useState, useEffect } from 'react'
import Section from '../components/Section'
import Table from '../components/Table'
import Modal from '../components/Modal'
import ActionMenu from '../components/ActionMenu'
import { readExcelRows, mapRowByAliases, exportRowsToExcel } from "../lib/excel"

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/+$/,"");
const url = (p) => `${API_BASE}${p.startsWith('/')?p:`/${p}`}`;

const EXPENSE_ALIASES = {
  name: ["name", "expense", "expense name"],
  date: ["date", "tx date", "expense date"],
  amount: ["amount", "value", "cost"],
  category: ["type", "category", "kind"],
  notes: ["note", "notes", "description", "details"],
  _id: ["_id", "id"],
}

const K = n => `KSh ${Number(n).toLocaleString('en-KE')}`

export default function ExpensesPage() {
  const [rows, setRows]   = useState([])
  const [from, setFrom]   = useState('')
  const [to, setTo]       = useState('')
  const [modal, setModal] = useState({ open:false, edit:null })
  const fileRef = useRef(null)

  useEffect(()=>{
    (async ()=>{
      try {
        const res = await fetch(url('/api/expenses'));
        const data = await res.json();
        setRows(Array.isArray(data)? data : []);
      } catch (e) { console.error(e); }
    })()
  }, [])

  const filt = useMemo(()=>rows.filter(r=>{
    if (from && r.date.slice(0,10) < from) return false
    if (to   && r.date.slice(0,10) > to)   return false
    return true
  }), [rows,from,to])

  const total = useMemo(()=>filt.reduce((s,r)=>s+Number(r.amount||0),0), [filt])

  const columns = [
    { key:'name',   title:'Name' },
    { key:'date',   title:'Date' },
    { key:'amount', title:'Amount', render:r=>K(r.amount) },
    // { key:'category',   title:'Category' }, // ← محذوف حسب طلبك
    { key:'notes',   title:'Notes' },
  ]

  const exportExcel = () => exportRowsToExcel(filt, [
    {key:'name', title:'Name'},
    {key:'date', title:'Date'},
    {key:'amount', title:'Amount'},
    // {key:'category', title:'Category'}, // محذوف من التصدير أيضاً لتطابق الجدول
    {key:'notes', title:'Notes'},
  ], "expenses.xlsx")

  function addNew(){
    setModal({
      open: true,
      edit: { name:'', date: new Date().toISOString().slice(0,10), amount:0, category:'', notes:'' }
    })
  }

  async function save(item){
    try {
      const method = item._id ? 'PUT' : 'POST';
      const endpoint = item._id ? `/api/expenses/${item._id}` : '/api/expenses';
      const res = await fetch(url(endpoint), {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const saved = await res.json();
      if (item._id) setRows(prev => prev.map(p => p._id === item._id ? saved : p));
      else setRows(prev => [saved, ...prev]);
      setModal({open:false, edit:null})
    } catch (e) {
      alert('Failed to save: ' + e.message)
    }
  }

  async function onImportExcel(e){
    const f = e.target.files?.[0]
    if (!f) return
    try {
      const rowsX = await readExcelRows(f)
      const norm = rowsX.map(r => mapRowByAliases(r, EXPENSE_ALIASES)).map(r => ({
        _id: r._id || undefined,
        name: r.name || "",
        date: String(r.date || "").slice(0,10),
        amount: Number(r.amount || 0),
        // category محذوف من الواجهة، لكن لا نمنع وجوده في البيانات
        notes: r.notes || "",
      }))
      const res = await fetch(url('/api/expenses/bulk-upsert'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: norm })
      });
      if (!res.ok) throw new Error(await res.text());
      const out = await fetch(url('/api/expenses'));
      const data = await out.json();
      setRows(Array.isArray(data)? data : []);
      e.target.value = "";
      alert("Imported & saved.");
    } catch (err) {
      alert("Import failed:\n" + err.message)
    }
  }

  async function uploadReceipt(expenseId, file){
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(url(`/api/expenses/${expenseId}/receipt`), { method:'POST', body: fd });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    // تحديث الصف لعرض receiptUrl إن رغبت مستقبلاً
    setRows(prev => prev.map(r => r._id===expenseId ? {...r, receiptUrl: data.receiptUrl} : r));
    alert('Receipt uploaded.');
  }

  return (
    <div className="space-y-6">
      <Section
        title="Expenses"
        actions={
          <div className="flex gap-2">
            <input type="date" className="rounded-xl border border-line px-3 py-2" value={from} onChange={e=>setFrom(e.target.value)} />
            <input type="date" className="rounded-xl border border-line px-3 py-2" value={to}   onChange={e=>setTo(e.target.value)} />
            <button className="btn" onClick={()=>{setFrom(''); setTo('')}}>Clear</button>
            <button className="btn btn-primary" onClick={addNew}>Add Expense</button>

            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={onImportExcel}
            />
            <button className="btn" onClick={()=>fileRef.current?.click()}>Import Excel</button>
            <ActionMenu label="Export" options={[{ label: 'Excel', onClick: exportExcel }]} />
          </div>
        }
      >
        <Table columns={[
          ...columns,
          {
            key:'__upload',
            title:'Receipt',
            render:r=>(
              <label className="btn">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e)=> e.target.files?.[0] && uploadReceipt(r._id, e.target.files[0])}
                />
                Upload
              </label>
            )
          }
        ]} data={filt} />
        <div className="text-right mt-2 text-sm text-mute">Total: <strong>{K(total)}</strong></div>
      </Section>

      <Modal open={modal.open} onClose={()=>setModal({open:false, edit:null})} title={modal.edit?'Edit Expense':'Add Expense'}>
        {modal.edit && (
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="block text-mute mb-1">Name</span>
              <input className="border border-line rounded-xl px-3 py-2 w-full"
                     value={modal.edit.name}
                     onChange={e=>setModal(m=>({...m, edit:{...m.edit, name:e.target.value}}))}/>
            </label>

            <label className="text-sm">
              <span className="block text-mute mb-1">Date</span>
              <input type="date" className="border border-line rounded-xl px-3 py-2 w-full"
                     value={modal.edit.date}
                     onChange={e=>setModal(m=>({...m, edit:{...m.edit, date:e.target.value}}))}/>
            </label>

            <label className="text-sm">
              <span className="block text-mute mb-1">Amount</span>
              <input className="border border-line rounded-xl px-3 py-2 w-full"
                     value={modal.edit.amount}
                     onChange={e=>setModal(m=>({...m, edit:{...m.edit, amount:e.target.value}}))}/>
            </label>

            {/* Category محذوف من الجدول، نتركه داخليًا إن رغبت لاحقًا */}
            <label className="col-span-2 text-sm">
              <span className="block text-mute mb-1">Notes</span>
              <input className="border border-line rounded-xl px-3 py-2 w-full"
                     placeholder="Optional note"
                     value={modal.edit.notes}
                     onChange={e=>setModal(m=>({...m, edit:{...m.edit, notes:e.target.value}}))}/>
            </label>

            <div className="col-span-2 flex gap-2 justify-end">
              <button className="btn" onClick={()=>setModal({open:false, edit:null})}>Cancel</button>
              <button className="btn btn-primary" onClick={()=>save(modal.edit)}>Save</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
