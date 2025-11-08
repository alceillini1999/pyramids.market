import React, { useMemo, useState } from 'react'
import Section from '../components/Section'
import Table from '../components/Table'
import Modal from '../components/Modal'

const K = n => `KSh ${Number(n).toLocaleString('en-KE')}`

const INITIAL = [
  { id: 1, name: 'Green Tea', salePrice: 675, cost: 420, qty: 120, status: 'Active', sales: 220, updatedAt: '2025-02-01', category: 'Beverages', type: 'Tea', discount: 0 },
  { id: 2, name: 'Chocolate Bar', salePrice: 250, cost: 140, qty: 88, status: 'Active', sales: 150, updatedAt: '2025-02-02', category: 'Snacks', type: 'Chocolate', discount: 10 },
  { id: 3, name: 'Coffee Beans', salePrice: 1299, cost: 900, qty: 45, status: 'Active', sales: 60, updatedAt: '2025-01-30', category: 'Beverages', type: 'Coffee', discount: 0 },
]

export default function ProductsPage() {
  const [rows, setRows] = useState(INITIAL)
  const [q, setQ] = useState('')
  const [modal, setModal] = useState({ open:false, edit:null })
  const [csvText, setCsvText] = useState('')

  const filtered = useMemo(
    () => rows.filter(r => r.name.toLowerCase().includes(q.toLowerCase())),
    [rows, q]
  )

  const columns = [
    { key: 'name', title: 'Name' },
    { key: 'salePrice', title: 'Sale Price', render: r => K(r.salePrice) },
    { key: 'cost', title: 'Cost', render: r => K(r.cost) },
    { key: 'qty', title: 'Qty', render: r => <span className={r.qty<20?'text-red-600 font-medium':''}>{r.qty}</span> },
    { key: 'status', title: 'Status' },
    { key: 'profit', title: 'Profit/Unit', render: r => K(r.salePrice - r.cost) },
    { key: 'sales', title: 'Total Sales' },
    { key: 'updatedAt', title: 'Last Update' },
    { key: 'actions', title: 'Actions', render: r => (
      <div className="flex gap-2">
        <button className="btn" onClick={()=>setModal({open:true, edit:r})}>Edit</button>
        <button className="btn" onClick={()=>setRows(rows.filter(x=>x.id!==r.id))}>Delete</button>
      </div>
    )},
  ]

  function openNew(){
    setModal({open:true, edit:{
      id: Date.now(), name:'', salePrice:0, cost:0, qty:0, status:'Active',
      sales:0, updatedAt: new Date().toISOString().slice(0,10), category:'', type:'', discount:0, image:null
    }})
  }

  function save(item){
    setRows(prev=>{
      const exists = prev.some(p=>p.id===item.id)
      return exists ? prev.map(p=>p.id===item.id? item : p) : [item, ...prev]
    })
    setModal({open:false, edit:null})
  }

  function exportCSV(){
    const header = ['name','salePrice','cost','qty','status','sales','updatedAt','category','type','discount']
    const lines = [header.join(',')]
    rows.forEach(r => lines.push(header.map(h=>r[h]).join(',')))
    const blob = new Blob([lines.join('\n')], { type:'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href = url; a.download = 'products.csv'; a.click(); URL.revokeObjectURL(url)
  }

  function importCSV(){
    try{
      const lines = csvText.trim().split('\n')
      const header = lines[0].split(',').map(s=>s.trim())
      const items = lines.slice(1).map((line,i)=>{
        const cells = line.split(',').map(s=>s.trim())
        const obj = {}; header.forEach((h,idx)=>obj[h]=cells[idx])
        obj.id = Date.now()+i
        obj.salePrice = +obj.salePrice; obj.cost = +obj.cost; obj.qty = +obj.qty; obj.sales = +(obj.sales||0); obj.discount = +(obj.discount||0)
        return obj
      })
      setRows(prev => [...items, ...prev])
      setCsvText('')
      alert('Imported!')
    }catch(e){ alert('CSV parse error') }
  }

  return (
    <div className="space-y-6">
      <Section
        title="Products"
        actions={
          <div className="flex gap-2">
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search products..." className="rounded-xl border border-line px-3 py-2" />
            <button className="btn btn-primary" onClick={openNew}>Add New Product</button>
            <button className="btn" onClick={exportCSV}>Export CSV</button>
          </div>
        }
      >
        <Table columns={columns} data={filtered} />
        <div className="mt-4">
          <details>
            <summary className="cursor-pointer text-sm text-mute">Import CSV (paste content)</summary>
            <textarea value={csvText} onChange={e=>setCsvText(e.target.value)} rows={4} className="w-full border border-line rounded-xl p-2 mt-2" placeholder="name,salePrice,cost,qty,status,sales,updatedAt,category,type,discount&#10;Tea,600,350,50,Active,10,2025-02-01,Beverages,Tea,0" />
            <button className="btn mt-2" onClick={importCSV}>Import</button>
          </details>
        </div>
      </Section>

      <Section title="Per-product stats">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rows.slice(0,3).map(r=>(
            <div key={r.id} className="bg-elev p-4">
              <div className="card-title">{r.name}</div>
              <div className="text-sm text-mute mt-1">
                Sales: {r.sales} • Profit/unit: {K(r.salePrice-r.cost)} • Discount: {r.discount}%
              </div>
              <div className="text-sm text-mute">Last update: {r.updatedAt}</div>
            </div>
          ))}
        </div>
      </Section>

      <Modal open={modal.open} onClose={()=>setModal({open:false, edit:null})} title={modal.edit?.name || 'New product'}
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn" onClick={()=>setModal({open:false, edit:null})}>Cancel</button>
            <button className="btn btn-primary" onClick={()=>save(modal.edit)}>Save</button>
          </div>
        }
      >
        {modal.edit && (
          <div className="grid grid-cols-2 gap-3">
            <input className="border border-line rounded-xl px-3 py-2 col-span-2" placeholder="Name" value={modal.edit.name} onChange={e=>setModal(m=>({...m, edit:{...m.edit, name:e.target.value}}))}/>
            <input className="border border-line rounded-xl px-3 py-2" placeholder="Sale Price (KSh)" type="number" value={modal.edit.salePrice} onChange={e=>setModal(m=>({...m, edit:{...m.edit, salePrice:+e.target.value}}))}/>
            <input className="border border-line rounded-xl px-3 py-2" placeholder="Cost (KSh)" type="number" value={modal.edit.cost} onChange={e=>setModal(m=>({...m, edit:{...m.edit, cost:+e.target.value}}))}/>
            <input className="border border-line rounded-xl px-3 py-2" placeholder="Qty" type="number" value={modal.edit.qty} onChange={e=>setModal(m=>({...m, edit:{...m.edit, qty:+e.target.value}}))}/>
            <select className="border border-line rounded-xl px-3 py-2" value={modal.edit.status} onChange={e=>setModal(m=>({...m, edit:{...m.edit, status:e.target.value}}))}>
              <option>Active</option><option>Inactive</option>
            </select>
            <input className="border border-line rounded-xl px-3 py-2" placeholder="Sales" type="number" value={modal.edit.sales} onChange={e=>setModal(m=>({...m, edit:{...m.edit, sales:+e.target.value}}))}/>
            <input className="border border-line rounded-xl px-3 py-2" placeholder="Category" value={modal.edit.category} onChange={e=>setModal(m=>({...m, edit:{...m.edit, category:e.target.value}}))}/>
            <input className="border border-line rounded-xl px-3 py-2" placeholder="Type" value={modal.edit.type} onChange={e=>setModal(m=>({...m, edit:{...m.edit, type:e.target.value}}))}/>
            <input className="border border-line rounded-xl px-3 py-2" placeholder="Discount %" type="number" value={modal.edit.discount} onChange={e=>setModal(m=>({...m, edit:{...m.edit, discount:+e.target.value}}))}/>
            <input className="border border-line rounded-xl px-3 py-2 col-span-2" placeholder="Last update" type="date" value={modal.edit.updatedAt} onChange={e=>setModal(m=>({...m, edit:{...m.edit, updatedAt:e.target.value}}))}/>
            <div className="col-span-2">
              <div className="text-sm text-mute mb-1">Images (demo)</div>
              <input type="file" accept="image/*" onChange={e=>setModal(m=>({...m, edit:{...m.edit, image: e.target.files?.[0] ?? null}}))}/>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
