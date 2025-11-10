import React, { useEffect, useMemo, useState } from 'react'
import Section from '../components/Section'

const K = n => `KSh ${Number(n).toLocaleString('en-KE')}`

export default function POSPage() {
  const [query, setQuery]     = useState('')
  const [cart, setCart]       = useState([])
  const [discount, setDiscount] = useState(0)
  const [points, setPoints]   = useState(0)
  const [pay, setPay]         = useState('Cash')
  const [client, setClient]   = useState(null)

  const [products, setProducts] = useState([])
  const [clientsList, setClientsList] = useState([])

  const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/+$/,"");

  useEffect(()=>{
    // جلب المنتجات
    fetch(`${API_BASE}/products`).then(r=>r.json()).then(d=>{
      setProducts(Array.isArray(d)? d : [])
    }).catch(()=>{})
    // جلب العملاء
    fetch(`${API_BASE}/clients`, { credentials:'include' }).then(r=>r.json()).then(d=>{
      const arr = Array.isArray(d?.data)? d.data : (Array.isArray(d)? d : [])
      setClientsList(arr)
      setClient(arr[0] || null)
    }).catch(()=>{})
  },[])

  const list = useMemo(()=>{
    const q = query.toLowerCase()
    return (products||[]).filter(p => (p.name||'').toLowerCase().includes(q) || String(p.barcode||'').includes(q))
  }, [query, products])

  const subtotal = cart.reduce((a,b)=>a+Number(b.price||0)*Number(b.qty||0),0)
  const total    = Math.max(subtotal - discount, 0)

  function addItem(p){
    setCart(prev=>{
      const idx = prev.findIndex(x=>x._id===p._id)
      if (idx>=0) { const cp=[...prev]; cp[idx].qty++; return cp }
      return [...prev, { _id:p._id, name:p.name, price:Number(p.salePrice||0), qty:1 }]
    })
  }
  function changeQty(id, qty){
    setCart(prev => prev.map(x => x._id===id ? {...x, qty: Math.max(1, qty)} : x))
  }
  function remove(id){ setCart(prev => prev.filter(x=>x._id!==id)) }

  function printInvoice(){ window.print() }
  function shareWhatsApp(){
    const text = encodeURIComponent(`Invoice total: ${K(total)} — Client: ${client?client.phone:'N/A'} — Points: ${points}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  function confirmPurchase(){
    if (!client) { alert('Please select a client first'); return }
    if (cart.length === 0) { alert('Cart is empty'); return }
    // تترك كما هي (ديمو) لحين ربط /pos/checkout
    alert(`Purchase confirmed (demo).\nClient: ${client.name}\nItems: ${cart.length}\nTotal: ${K(total)}`)
    setCart([]); setDiscount(0); setPoints(0)
  }

  return (
    <div className="grid xl:grid-cols-4 gap-6">
      {/* Product Search */}
      <Section title="Product Search">
        <input className="w-full rounded-xl border border-line px-3 py-2" placeholder="Search by name or barcode..." value={query} onChange={e=>setQuery(e.target.value)} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {list.map(p=>(
            <button key={p._id} className="rounded-xl border border-line px-3 py-2 text-left hover:bg-base" onClick={()=>addItem(p)}>
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-mute">{K(p.salePrice)} — #{p.barcode || 'N/A'}</div>
            </button>
          ))}
        </div>
      </Section>

      {/* Cart */}
      <Section title="Cart">
        {cart.length===0 ? <div className="text-mute">No items yet</div> : (
          <ul className="space-y-2">
            {cart.map(item=>(
              <li key={item._id} className="flex items-center justify-between border border-line rounded-xl p-2">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-mute">{K(item.price)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" className="w-20 border border-line rounded-xl px-2 py-1" value={item.qty} onChange={e=>changeQty(item._id, +e.target.value)} />
                  <button className="btn" onClick={()=>remove(item._id)}>Remove</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Invoice Summary */}
      <Section title="Invoice Summary">
        <div className="space-y-3">
          <div className="flex justify-between"><span>Subtotal</span><b>{K(subtotal)}</b></div>
          <div className="flex justify-between">
            <span>Discount</span>
            <input type="number" className="w-32 border border-line rounded-xl px-2 py-1 text-right" value={discount} onChange={e=>setDiscount(+e.target.value)} />
          </div>
          <div className="flex justify-between">
            <span>Loyalty Points</span>
            <input type="number" className="w-32 border border-line rounded-xl px-2 py-1 text-right" value={points} onChange={e=>setPoints(+e.target.value)} />
          </div>
          <div className="flex justify-between"><span>Total</span><b>{K(total)}</b></div>

          <div>
            <div className="card-title mb-1">Payment Method</div>
            <div className="flex gap-2">
              {['Cash','M-PESA','Bank','Other'].map(m=>(
                <label key={m} className={`btn ${pay===m?'btn-primary':''}`}>
                  <input type="radio" className="hidden" checked={pay===m} onChange={()=>setPay(m)} />{m}
                </label>
              ))}
            </div>
          </div>

          <div className="text-sm text-mute">
            Client: <b>{client ? `${client.name} (${client.phone||''})` : 'None selected'}</b>
          </div>

          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={confirmPurchase}>Confirm Purchase</button>
            <button className="btn" onClick={printInvoice}>Print</button>
            <button className="btn" onClick={shareWhatsApp}>Share via WhatsApp</button>
          </div>
        </div>
      </Section>

      {/* Select Client */}
      <Section title="Select Client">
        <ul className="space-y-2">
          {clientsList.map(c => (
            <li key={c._id || c.phone}>
              <button
                className={`w-full text-left rounded-xl px-3 py-2 border ${client?._id===c._id ? 'bg-base border-line' : 'border-line hover:bg-base'}`}
                onClick={()=>setClient(c)}
              >
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-mute">{c.phone}</div>
              </button>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}
