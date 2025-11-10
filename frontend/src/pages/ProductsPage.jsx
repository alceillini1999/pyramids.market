import React, { useEffect, useMemo, useRef, useState } from 'react'
import Section from '../components/Section'
import Table from '../components/Table'
import ActionMenu from '../components/ActionMenu'
import Modal from '../components/Modal'
import { readExcelRows, mapRowByAliases, exportRowsToExcel } from "../lib/excel"

// ===== API base (إزالة /api المكرر) =====
const API_ORIG = (import.meta.env.VITE_API_URL || "").replace(/\/+$/,"")
const API_BASE = API_ORIG.replace(/\/api$/,"")
const url = (p) => `${API_BASE}${p.startsWith('/') ? p : `/${p}`}`

// ===== أدوات عامة لقراءة القيم من مسارات متعددة (بما فيها المتداخلة) =====
const getPath = (obj, path) => {
  if (!obj) return undefined
  if (path.includes('.')) {
    return path.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), obj)
  }
  return obj[path]
}

// يرجع أول رقم صالح من مجموعة مسارات/مفاتيح (يدعم المتداخل)
const pickNumberFromPaths = (obj, paths) => {
  for (const p of paths) {
    const v = getPath(obj, p)
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      const n = Number(v)
      if (!Number.isNaN(n)) return n
    }
  }
  return null
}

const fmtMoney = (n) => {
  if (n === null) return '—'
  try {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 2 }).format(n)
  } catch {
    const x = Number(n)
    return isNaN(x) ? '—' : `KSh ${x.toFixed(2)}`
  }
}

// ===== خرائط أسماء أعمدة الإكسل الشائعة =====
const PRODUCT_ALIASES = {
  name: ["name","product","item","product name","اسم","الاسم"],
  barcode: ["barcode","code","sku","باركود"],
  salePrice: ["saleprice","price","selling price","sell price","سعر البيع","بيع"],
  cost: ["cost","purchaseprice","buyprice","buy price","سعر الشراء","تكلفة","التكلفة"],
  quantity: ["quantity","qty","stock","الكمية","كمية"],
  expiry: ["expiry","expirydate","expire","exp","expiry date","تاريخ الصلاحية"],
  category: ["category","cat","الفئة","الصنف"],
}

export default function ProductsPage(){
  const [rows,setRows] = useState([])
  const [q,setQ]       = useState('')
  const [modal,setModal] = useState({open:false, edit:null})
  const fileRef = useRef(null)

  useEffect(()=>{
    (async ()=>{
      try{
        const r = await fetch(url('/api/products'))
        const d = await r.json()
        setRows(Array.isArray(d) ? d : [])
      }catch(e){ console.error(e) }
    })()
  },[])

  const filtered = useMemo(()=>{
    const s = q.trim().toLowerCase()
    return rows.filter(p =>
      (getPath(p,'name') || '').toLowerCase().includes(s) ||
      String(getPath(p,'barcode') || getPath(p,'sku') || '').includes(s) ||
      (getPath(p,'category') || '').toLowerCase().includes(s)
    )
  },[rows,q])

  // مؤشر الإتاحة
  const Availability = ({qty})=>{
    const n = Number(qty||0)
    const color = n === 0 ? 'bg-red-500' : n < 10 ? 'bg-yellow-500' : n > 20 ? 'bg-green-500' : 'bg-yellow-500'
    return <span className={`inline-block w-3 h-3 rounded-full ${color}`} title={String(n)} />
  }

  // مسارات محتملة لكل قيمة
  const SALE_PATHS = ['salePrice','price','sellingPrice','unitPrice','pricing.sale','price.sale']
  const COST_PATHS = ['cost','costPrice','purchasePrice','buyPrice','pricing.cost','price.cost']
  const QTY_PATHS  = ['quantity','qty','stock','inventory.qty','inventory.quantity']

  const columns = [
    { key:'name', title:'Name', render:r=> getPath(r,'name') || '—' },
    { key:'barcode', title:'Barcode', render:r=> getPath(r,'barcode') || getPath(r,'sku') || '—' },
    { key:'sale', title:'Sale Price', render:r=> fmtMoney(pickNumberFromPaths(r, SALE_PATHS)) },
    { key:'cost', title:'Cost',       render:r=> fmtMoney(pickNumberFromPaths(r, COST_PATHS)) },
    { key:'quantity', title:'Qty',    render:r=> {
        const val = pickNumberFromPaths(r, QTY_PATHS)
        return val === null ? '—' : val
      } },
    { key:'availability', title:'الإتاحة', render:r=> <Availability qty={pickNumberFromPaths(r, QTY_PATHS)||0} /> },
    { key:'expiry', title:'Expiry', render:r=> getPath(r,'expiry') || '—' },
    { key:'category', title:'Category', render:r=> getPath(r,'category') || '—' },
  ]

  const exportExcel = () => {
    const mapped = filtered.map(r => ({
      Name: getPath(r,'name') || '',
      Barcode: String(getPath(r,'barcode') || getPath(r,'sku') || ''),
      SalePrice: pickNumberFromPaths(r, SALE_PATHS) ?? 0,
      Cost: pickNumberFromPaths(r, COST_PATHS) ?? 0,
      Quantity: pickNumberFromPaths(r, QTY_PATHS) ?? 0,
      Expiry: getPath(r,'expiry') || '',
      Category: getPath(r,'category') || ''
    }))
    exportRowsToExcel(mapped, [
      {key:'Name',title:'Name'},
      {key:'Barcode',title:'Barcode'},
      {key:'SalePrice',title:'SalePrice'},
      {key:'Cost',title:'Cost'},
      {key:'Quantity',title:'Quantity'},
      {key:'Expiry',title:'Expiry'},
      {key:'Category',title:'Category'},
    ], "products.xlsx")
  }

  function addNew(){
    setModal({open:true, edit:{
      name:'', barcode:'', salePrice:0, cost:0, quantity:0, expiry:'', category:''
    }})
  }

  async function save(p){
    const body = {
      ...p,
      salePrice: pickNumberFromPaths(p, SALE_PATHS) ?? 0,
      cost:      pickNumberFromPaths(p, COST_PATHS) ?? 0,
      quantity:  pickNumberFromPaths(p, QTY_PATHS) ?? 0,
    }
    const method = p._id ? 'PUT' : 'POST'
    const endpoint = p._id ? `/api/products/${p._id}` : '/api/products'
    const res = await fetch(url(endpoint), {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const saved = await res.json()
    setRows(prev => p._id ? prev.map(x => x._id===p._id ? saved : x) : [saved, ...prev])
    setModal({open:false, edit:null})
  }

  async function onImportExcel(e){
    const f = e.target.files?.[0]
    if (!f) return
    try{
      const rowsX = await readExcelRows(f)
      const norm = rowsX.map(r => mapRowByAliases(r, PRODUCT_ALIASES)).map(r => ({
        name: r.name || "",
        barcode: String(r.barcode || r.sku || ""),
        salePrice: Number(r.salePrice ?? r.price ?? r.sellingPrice ?? r.unitPrice ?? r['pricing.sale'] ?? 0),
        cost: Number(r.cost ?? r.costPrice ?? r.purchasePrice ?? r.buyPrice ?? r['pricing.cost'] ?? 0),
        quantity: Number(r.quantity ?? r.qty ?? r.stock ?? r['inventory.qty'] ?? 0),
        expiry: r.expiry ? String(r.expiry).slice(0,10) : "",
        category: r.category || "",
      }))
      const res = await fetch(url('/api/products/import/excel'), {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ items: norm })
      })
      if (!res.ok) throw new Error(await res.text())
      const rr = await fetch(url('/api/products'))
      const dd = await rr.json()
      setRows(Array.isArray(dd) ? dd : [])
      e.target.value=""
      alert('Imported products.')
    }catch(err){
      alert('Import failed:\n' + err.message)
    }
  }

  return (
    <div className="space-y-6">
      <Section
        title="Products"
        actions={
          <div className="flex items-center gap-2">
            <input className="border border-line rounded-xl px-3 py-2" placeholder="Search…" value={q} onChange={e=>setQ(e.target.value)} />
            <button className="btn btn-primary" onClick={addNew}>Add Product</button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onImportExcel} />
            <button className="btn" onClick={()=>fileRef.current?.click()}>Import Excel</button>
            <ActionMenu label="Export" options={[{ label: 'Excel', onClick: exportExcel }]} />
          </div>
        }
      >
        <Table columns={columns} data={filtered} />
      </Section>

      <Modal open={modal.open} onClose={()=>setModal({open:false, edit:null})} title={modal.edit? 'Edit Product' : 'Add Product'}>
        {modal.edit && (
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="block text-mute mb-1">Name</span>
              <input className="border border-line rounded-xl px-3 py-2 w-full" value={modal.edit.name}
                     onChange={e=>setModal(m=>({...m, edit:{...m.edit, name:e.target.value}}))}/>
            </label>
            <label className="text-sm">
              <span className="block text-mute mb-1">Barcode</span>
              <input className="border border-line rounded-xl px-3 py-2 w-full" value={modal.edit.barcode}
                     onChange={e=>setModal(m=>({...m, edit:{...m.edit, barcode:e.target.value}}))}/>
            </label>
            <label className="text-sm">
              <span className="block text-mute mb-1">Sale Price</span>
              <input type="number" className="border border-line rounded-xl px-3 py-2 w-full"
                     value={pickNumberFromPaths(modal.edit, ['salePrice','price','sellingPrice','unitPrice']) ?? 0}
                     onChange={e=>setModal(m=>({...m, edit:{...m.edit, salePrice:+e.target.value}}))}/>
            </label>
            <label className="text-sm">
              <span className="block text-mute mb-1">Cost</span>
              <input type="number" className="border border-line rounded-xl px-3 py-2 w-full"
                     value={pickNumberFromPaths(modal.edit, ['cost','costPrice','purchasePrice','buyPrice']) ?? 0}
                     onChange={e=>setModal(m=>({...m, edit:{...m.edit, cost:+e.target.value}}))}/>
            </label>
            <label className="text-sm">
              <span className="block text-mute mb-1">Quantity</span>
              <input type="number" className="border border-line rounded-xl px-3 py-2 w-full"
                     value={pickNumberFromPaths(modal.edit, ['quantity','qty','stock']) ?? 0}
                     onChange={e=>setModal(m=>({...m, edit:{...m.edit, quantity:+e.target.value}}))}/>
            </label>
            <label className="text-sm">
              <span className="block text-mute mb-1">Expiry</span>
              <input type="date" className="border border-line rounded-xl px-3 py-2 w-full" value={modal.edit.expiry}
                     onChange={e=>setModal(m=>({...m, edit:{...m.edit, expiry:e.target.value}}))}/>
            </label>
            <label className="col-span-2 text-sm">
              <span className="block text-mute mb-1">Category</span>
              <input className="border border-line rounded-xl px-3 py-2 w-full" value={modal.edit.category}
                     onChange={e=>setModal(m=>({...m, edit:{...m.edit, category:e.target.value}}))}/>
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
