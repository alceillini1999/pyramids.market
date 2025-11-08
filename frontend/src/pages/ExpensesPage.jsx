import React, { useMemo, useState } from 'react'
import Section from '../components/Section'
import Table from '../components/Table'
import Modal from '../components/Modal'

const K = n => `KSh ${Number(n).toLocaleString('en-KE')}`

const INIT = [
  { id: 1, name: 'Rent', date: '2025-02-01', amount: 50000, type: 'Fixed', note: '' },
  { id: 2, name: 'Packaging', date: '2025-02-03', amount: 3800, type: 'Variable', note: '' },
  { id: 3, name: 'Delivery', date: '2025-02-04', amount: 2100, type: 'Variable', note: '' },
]

export default function ExpensesPage() {
  const [rows, setRows] = useState(INIT)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [modal, setModal] = useState({ open:false, edit:null })

  const filt = useMemo(()=>rows.filter(r=>{
    if (from && r.date < from) return false
    if (to && r.date > to) return false
    return true
  }), [rows, from, to])

  const total = filt.reduce((a,b)=>a + b.amount, 0)

  const columns = [
    { key: 'name', title: 'Name' },
    { key: 'date', title: 'Date' },
    { key: 'amount', title: 'Amount', render: r => K(r.amount) },
    { key: 'type', title: 'Type' },
    { key: 'note', title: 'Description' },
    { key: 'x', title: 'Actions', render: r => (
      <div className="flex gap-2">
        <button className="btn" onClick={()=>setModal({open:true, edit:r})}>Edit</button>
        <button className="btn" onClick={()=>setRows(rows.filter(x=>x.id!==r.id))}>Delete</button>
      </div>
    )},
  ]

  function addNew(){
    setModal({open:true, edit:{ id: Date.now(), name:'', date: new Date().toISOString().slice(0,10), amount:0, type:'Variable', note:'' }})
  }
  function save(item){
    setRows(prev=>{
      const ex = prev.some(p=>p.id===item.id)
      return ex ? prev.map(p=>p.id===item.id? item : p) : [item, ...prev]
    })
    setModal({open:false, edit:null})
  }
  function exportCSV(){
    const header = ['name','date','amount','type','note']
    const body = rows.map(r => header.map(h=>r[h]).join(',')).join('\n')
    const csv = header.join(',')+'\n'+body
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'})
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='expenses.csv'; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Section
        title="Expenses"
        actions={
          <div className="flex gap-2">
            <input type="date" className="rounded-xl border border-line px-3 py-2" value={from} onChange={e=>setFrom(e.target.value)} />
            <input type="date" className="rounded-xl border border-line px-3 py-2" value={to} onChange={e=>setTo(e.target.value)} />
            <button className="btn" onClick={()=>{setFrom(''); setTo('')}}>Clear</button>
            <button className="btn btn-primary" onClick={addNew}>Add Expense</button>
            <button className="btn" onClick={exportCSV}>Export CSV</button>
            <button className="btn" onClick={()=>alert('PDF export placeholder')}>Export PDF</button>
            <button className="btn" onClick={()=>alert('Excel export placeholder')}>Export Excel</button>
          </div>
        }
      >
        <Table columns={columns} data={filt} />
        <div className="mt-4 text-right font-semibold">Total: {K(total)}</div>
      </Section>

      <Modal open={modal.open} onClose={()=>setModal({open:false, edit:null})} title="Expense"
        footer={<div className="flex justify-end gap-2"><button className="btn" onClick={()=>setModal({open:false, edit:null})}>Cancel</button><button className="btn btn-primary" onClick={()=>save(modal.edit)}>Save</button></div>}
      >
        {modal.edit && (
          <div className="grid grid-cols-2 gap-3">
            <input className="border border-line rounded-xl px-3 py-2 col-span-2" placeholder="Name" value={modal.edit.name} onChange={e=>setModal(m=>({...m, edit:{...m.edit, name:e.target.value}}))}/>
            <input type="date" className="border border-line rounded-xl px-3 py-2" value={modal.edit.date} onChange={e=>setModal(m=>({...m, edit:{...m.edit, date:e.target.value}}))}/>
            <input type="number" className="border border-line rounded-xl px-3 py-2" placeholder="Amount (KSh)" value={modal.edit.amount} onChange={e=>setModal(m=>({...m, edit:{...m.edit, amount:+e.target.value}}))}/>
            <select className="border border-line rounded-xl px-3 py-2" value={modal.edit.type} onChange={e=>setModal(m=>({...m, edit:{...m.edit, type:e.target.value}}))}>
              <option>Fixed</option><option>Variable</option>
            </select>
            <input className="border border-line rounded-xl px-3 py-2 col-span-2" placeholder="Description" value={modal.edit.note} onChange={e=>setModal(m=>({...m, edit:{...m.edit, note:e.target.value}}))}/>
          </div>
        )}
      </Modal>
    </div>
  )
}
