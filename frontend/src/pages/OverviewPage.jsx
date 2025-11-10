import React, { useEffect, useMemo, useState } from 'react'
import Section from '../components/Section'
import ChartSales from '../components/ChartSales'
// ❌ لم نعد نستخدم OverviewNeon (الذي كان يرسم شريطاً داخلياً)
// import OverviewNeon from '../ui/theme/OverviewNeon'
// import OverviewNeonAnimated from '../ui/theme/OverviewNeonAnimated'
import '../styles/pyramids-theme.css' // لضمان الثيم على البطاقات

const K = n => `KSh ${Number(n).toLocaleString('en-KE')}`

const API_ORIG = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "")
const API_BASE = API_ORIG.replace(/\/api$/, "")
const url = (p) => `${API_BASE}${p.startsWith('/') ? p : `/${p}`}`

const fmtDay = (d) => new Date(d).toISOString().slice(0,10)
const startOfDay = (d) => { const x=new Date(d); x.setHours(0,0,0,0); return x }
const endOfDay   = (d) => { const x=new Date(d); x.setHours(23,59,59,999); return x }

function rangeDays(from, to) {
  const out = []
  let d = startOfDay(from)
  const end = startOfDay(to)
  while (d <= end) { out.push(new Date(d)); d = new Date(d.getTime() + 86400000) }
  return out
}

function useOverviewData(){
  const [sales, setSales] = useState([])
  const [expenses, setExpenses] = useState([])

  const refresh = async ()=>{
    const sRes = await fetch(url('/api/sales?page=1&limit=1000'), { credentials:'include' })
    const sJson = await sRes.json()
    const sRows = Array.isArray(sJson) ? sJson : (Array.isArray(sJson.rows) ? sJson.rows : [])
    setSales(sRows)

    const eRes = await fetch(url('/api/expenses'), { credentials:'include' })
    const eRows = await eRes.json()
    setExpenses(Array.isArray(eRows) ? eRows : [])
  }

  useEffect(()=>{ refresh().catch(()=>{}) }, [])

  const totals = useMemo(()=>{
    const totalSales = sales.reduce((s,r)=>s + Number(r.total||0), 0)
    const totalExpenses = expenses.reduce((s,r)=>s + Number(r.amount||0), 0)
    return { totalSales, totalExpenses, netProfit: totalSales - totalExpenses }
  }, [sales, expenses])

  return { sales, expenses, totals, refresh }
}

export default function OverviewPage() {
  const [range, setRange] = useState('day')
  const [from, setFrom]   = useState('')
  const [to, setTo]       = useState('')

  const { sales, expenses, totals, refresh } = useOverviewData()

  const dataset = useMemo(()=>{
    if (!sales.length && !expenses.length) return []
    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd   = endOfDay(now)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd   = endOfDay(new Date(now.getFullYear(), now.getMonth()+1, 0))
    const yearStart  = new Date(now.getFullYear(), 0, 1)
    const yearEnd    = endOfDay(new Date(now.getFullYear(), 11, 31))
    let buckets = []

    if (range === 'day') {
      const bSales = Array(24).fill(0), bExp = Array(24).fill(0)
      sales.forEach(s=>{ const t=new Date(s.createdAt); if (t>=todayStart&&t<=todayEnd) bSales[t.getHours()]+=Number(s.total||0) })
      expenses.forEach(e=>{ const t=new Date(e.date); if (t>=todayStart&&t<=todayEnd) bExp[t.getHours()]+=Number(e.amount||0) })
      buckets = Array.from({length:24}).map((_,h)=>({ label:`${h}:00`, sales:bSales[h], expenses:bExp[h], net:bSales[h]-bExp[h] }))
    }

    if (range === 'month') {
      const days = rangeDays(monthStart, monthEnd)
      const idx = Object.fromEntries(days.map((d,i)=>[fmtDay(d), i]))
      const bSales = Array(days.length).fill(0), bExp = Array(days.length).fill(0)
      sales.forEach(s=>{ const k=fmtDay(s.createdAt); if(k in idx) bSales[idx[k]]+=Number(s.total||0) })
      expenses.forEach(e=>{ const k=fmtDay(e.date);    if(k in idx) bExp[idx[k]]+=Number(e.amount||0) })
      buckets = days.map((d,i)=>({ label:fmtDay(d), sales:bSales[i], expenses:bExp[i], net:bSales[i]-bExp[i] }))
    }

    if (range === 'year') {
      const bSales = Array(12).fill(0), bExp = Array(12).fill(0)
      sales.forEach(s=>{ const t=new Date(s.createdAt); if(t>=yearStart&&t<=yearEnd) bSales[t.getMonth()]+=Number(s.total||0) })
      expenses.forEach(e=>{ const t=new Date(e.date);    if(t>=yearStart&&t<=yearEnd) bExp[t.getMonth()]+=Number(e.amount||0) })
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      buckets = months.map((m,i)=>({ label:m, sales:bSales[i], expenses:bExp[i], net:bSales[i]-bExp[i] }))
    }

    if (range === 'custom') {
      const f = from ? startOfDay(new Date(from)) : null
      const t = to   ? endOfDay(new Date(to))     : null
      if (!f || !t || isNaN(f) || isNaN(t) || f>t) return []
      const days = rangeDays(f,t)
      const idx = Object.fromEntries(days.map((d,i)=>[fmtDay(d), i]))
      const bSales = Array(days.length).fill(0), bExp = Array(days.length).fill(0)
      sales.forEach(s=>{ const k=fmtDay(s.createdAt); if(k in idx) bSales[idx[k]]+=Number(s.total||0) })
      expenses.forEach(e=>{ const k=fmtDay(e.date);    if(k in idx) bExp[idx[k]]+=Number(e.amount||0) })
      buckets = days.map((d,i)=>({ label:fmtDay(d), sales:bSales[i], expenses:bExp[i], net:bSales[i]-bExp[i] }))
    }

    return buckets
  }, [range, from, to, sales, expenses])

  return (
    <div className="p-6 space-y-6">
      {/* صف الكروت الأساسية */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <div className="bg-elev card p-4">
          <div className="card-title">Total Sales</div>
          <div className="card-value mt-1">{K(totals.totalSales)}</div>
        </div>
        <div className="bg-elev card p-4">
          <div className="card-title">Expenses</div>
          <div className="card-value mt-1">{K(totals.totalExpenses)}</div>
        </div>
        <div className="bg-elev card p-4">
          <div className="card-title">Net Profit</div>
          <div className="card-value mt-1">{K(totals.netProfit)}</div>
        </div>
      </div>

      {/* إجراءات عامة */}
      <div className="flex items-center gap-2">
        <button className="btn btn-primary" onClick={refresh}>تحديث</button>
      </div>

      {/* المخطط والقسم */}
      <Section
        title="Sales vs Expenses vs Net"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* لو أحببت أزرار day/month/year، أضفها هنا لاحقاً */}
          </div>
        }
      >
        {dataset.length ? <ChartSales data={dataset} /> :
          <div className="h-64 grid place-items-center text-mute">No data for selected range</div>}
      </Section>
    </div>
  )
}
