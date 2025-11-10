// frontend/src/pages/SalesPage.jsx
import { useEffect, useState } from 'react'

const API_ORIG = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
const API_BASE = API_ORIG.replace(/\/api$/, "");
const url = (p) => `${API_BASE}${p.startsWith('/') ? p : `/${p}`}`;

export default function SalesPage(){
  const [rows,setRows] = useState([])
  const [count,setCount] = useState(0)
  const [q,setQ] = useState('')
  const [page,setPage] = useState(1)
  const [details,setDetails] = useState(null)

  async function load(){
    const res = await fetch(url('/api/sales') + `?page=${page}&limit=20&q=${encodeURIComponent(q)}`, { credentials:'include' })
    const d = await res.json()
    setRows(d.rows||[]); setCount(d.count||0)
  }

  useEffect(()=>{ load().catch(()=>{}) },[page,q])

  async function openDetails(id){
    const res = await fetch(url(`/api/sales/${id}`), { credentials:'include' })
    const data = await res.json()
    setDetails(data)
  }

  async function syncGoogle(){
    try {
      await fetch(url('/api/sales/sync/google-csv?mode=mirror'), { method:'POST' });
      await load();
      alert('Sales synced from Google Sheet.');
    } catch (e) {
      alert('Sync failed:\n' + e.message)
    }
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">المبيعات</h1>
        <div className="flex items-center gap-2">
          <input value={q} onChange={e=>{setPage(1); setQ(e.target.value)}} placeholder="ابحث برقم الفاتورة أو اسم العميل" className="border rounded px-3 py-2"/>
          <button className="px-3 py-2 rounded bg-black text-white" onClick={syncGoogle}>Sync Google</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2">رقم الفاتورة</th>
              <th className="p-2">العميل</th>
              <th className="p-2">التاريخ والوقت</th>
              <th className="p-2">إجمالي الفاتورة</th>
              <th className="p-2">طريقة الدفع</th>
              <th className="p-2">الربح</th>
              <th className="p-2">تفاصيل</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r._id} className="border-b">
                <td className="p-2">{r.invoiceNumber}</td>
                <td className="p-2">{r.clientName || r?.client?.name || ''}</td>
                <td className="p-2">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</td>
                <td className="p-2">{Number(r.total||0).toFixed(2)}</td>
                <td className="p-2">{r.paymentMethod}</td>
                <td className="p-2">{Number(r.profit||0).toFixed(2)}</td>
                <td className="p-2">
                  <button className="px-3 py-1 rounded bg-black text-white" onClick={()=>openDetails(r._id)}>تفاصيل</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {details && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center" onClick={()=>setDetails(null)}>
          <div className="bg-white rounded-xl p-4 w/full max-w-2xl" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">تفاصيل الفاتورة {details.invoiceNumber}</div>
              <button className="btn" onClick={()=>setDetails(null)}>إغلاق</button>
            </div>
            <div className="text-sm text-mute mb-2">
              العميل: {details.clientName || details?.client?.name || '—'} • التاريخ: {details.createdAt ? new Date(details.createdAt).toLocaleString() : '—'}
            </div>
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50"><th className="p-2 text-left">الصنف</th><th className="p-2">الكمية</th><th className="p-2">سعر البيع</th><th className="p-2">التكلفة</th><th className="p-2">الإجمالي</th></tr></thead>
              <tbody>
                {(details.items||[]).map((it,idx)=>(
                  <tr key={idx} className="border-b">
                    <td className="p-2 text-left">{it.name || it?.product?.name || ''}</td>
                    <td className="p-2 text-center">{it.qty}</td>
                    <td className="p-2 text-center">{Number(it.price||0).toFixed(2)}</td>
                    <td className="p-2 text-center">{Number(it.cost||0).toFixed(2)}</td>
                    <td className="p-2 text-center">{Number(it.subtotal||0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-right mt-3">
              <div>إجمالي الفاتورة: <b>{Number(details.total||0).toFixed(2)}</b></div>
              <div>الربح: <b>{Number(details.profit||0).toFixed(2)}</b></div>
              <div>طريقة الدفع: <b>{details.paymentMethod}</b></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
