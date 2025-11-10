// src/pages/OverviewPage.jsx
import React, { useEffect, useMemo, useState } from 'react'
import Section from '../components/Section'
import ChartSales from '../components/ChartSales'
import OverviewNeon from '../ui/theme/OverviewNeon'   // ✨ الغلاف الجديد

const K = n => `KSh ${Number(n).toLocaleString('en-KE')}`

const API_ORIG = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "")
const API_BASE = API_ORIG.replace(/\/api$/, "")
const url = (p) => `${API_BASE}${p.startsWith('/') ? p : `/${p}`}`

// ---- helpers ----
const fmtDay = (d) => new Date(d).toISOString().slice(0,10) // YYYY-MM-DD
const startOfDay = (d) => { const x=new Date(d); x.setHours(0,0,0,0); return x }
const endOfDay   = (d) => { const x=new Date(d); x.setHours(23,59,59,999); return x }

function rangeDays(from, to) {
  const out = []
  let d = startOfDay(from)
  const end = startOfDay(to)
  while (d <= end) {
    out.push(new Date(d))
    d = new Date(d.getTime() + 86400000)
  }
  return out
}

function useOverviewData(){
  const [sales, setSales] = useState([])
  const [expenses, setExpenses] = useState([])

  const refresh = async ()=>{
    // sales
    const sRes = await fetch(url('/api/sales?page=1&limit=1000'), { credentials:'include' })
    const sJson = await sRes.json()
    const sRows = Array.isArray(sJson) ? sJson : (Array.isArray(sJson.rows) ? sJson.rows : [])
    setSales(sRows)

    // expenses
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
  const [range, setRange] = useState('day')   // day | month | year | custom
  const [from, setFrom]   = useState('')
  const [to, setTo]       = useState('')

  const { sales, expenses, totals, refresh } = useOverviewData()

  // بناء بيانات المخطط من البيانات الحقيقية فقط
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
      const bSales = Array(24).fill(0)
      const bExp   = Array(24).fill(0)
      sales.forEach(s=>{
        const t = new Date(s.createdAt)
        if (t >= todayStart && t <= todayEnd) bSales[t.getHours()] += Number(s.total||0)
      })
      expenses.forEach(e=>{
        const t = new Date(e.date)
        if (t >= todayStart && t <= todayEnd) bExp[t.getHours()] += Number(e.amount||0)
      })
      buckets = Array.from({length:24}).map((_,h)=>({
        label: `${h}:00`,
        sales: bSales[h],
        expenses: bExp[h],
        net: bSales[h]-bExp[h],
      }))
    }

    if (range === 'month') {
      const days = rangeDays(monthStart, monthEnd)
      const dayIdx = Object.fromEntries(days.map((d,i)=>[fmtDay(d), i]))
      const bSales = Array(days.length).fill(0)
      const bExp   = Array(days.length).fill(0)
      sales.forEach(s=>{
        const k = fmtDay(s.createdAt)
        if (k in dayIdx) bSales[dayIdx[k]] += Number(s.total||0)
      })
      expenses.forEach(e=>{
        const k = fmtDay(e.date)
        if (k in dayIdx) bExp[dayIdx[k]] += Number(e.amount||0)
      })
      buckets = days.map((d,i)=>({
        label: fmtDay(d),
        sales: bSales[i],
        expenses: bExp[i],
        net: bSales[i]-bExp[i],
      }))
    }

    if (range === 'year') {
      const bSales = Array(12).fill(0)
      const bExp   = Array(12).fill(0)
      sales.forEach(s=>{
        const t = new Date(s.createdAt)
        if (t >= yearStart && t <= yearEnd) bSales[t.getMonth()] += Number(s.total||0)
      })
      expenses.forEach(e=>{
        const t = new Date(e.date)
        if (t >= yearStart && t <= yearEnd) bExp[t.getMonth()] += Number(e.amount||0)
      })
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      buckets = months.map((m,i)=>({ label:m, sales:bSales[i], expenses:bExp[i], net:bSales[i]-bExp[i] }))
    }

    if (range === 'custom') {
      const f = from ? startOfDay(new Date(from)) : null
      const t = to   ? endOfDay(new Date(to))     : null
      if (!f || !t || isNaN(f) || isNaN(t) || f>t) return []
      const days = rangeDays(f,t)
      const dayIdx = Object.fromEntries(days.map((d,i)=>[fmtDay(d), i]))
      const bSales = Array(days.length).fill(0)
      const bExp   = Array(days.length).fill(0)
      sales.forEach(s=>{ const k=fmtDay(s.createdAt); if (k in dayIdx) bSales[dayIdx[k]] += Number(s.total||0) })
      expenses.forEach(e=>{ const k=fmtDay(e.date);    if (k in dayIdx) bExp[dayIdx[k]]   += Number(e.amount||0) })
      buckets = days.map((d,i)=>({ label:fmtDay(d), sales:bSales[i], expenses:bExp[i], net:bSales[i]-bExp[i] }))
    }

    return buckets
  }, [range, from, to, sales, expenses])

  // ✅ تغليف المحتوى الأصلي داخل الثيم الجديد فقط
  return (
    <OverviewNeon
      stats={{
        balance: totals.totalSales,        // لإظهار قيمة واضحة في الهيدر
        investment: totals.totalSales,
        totalGain: Math.max(totals.netProfit, 0),
        totalLoss: Math.max(-totals.netProfit, 0),
      }}
      chartData={dataset.map(d => ({ label: d.label, value: d.net }))} // نعرض صافي الربح في الرسم العلوي
      actions={{ onDeposit: () => {}, onWithdraw: () => {} }}
      rightPanel={{ portfolioName: 'Pyramids Mart', value: totals.totalSales, holders: 50 }}
    >
      {/* === المحتوى الأصلي كما هو للحفاظ على كل الوظائف === */}
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3 flex-1">
            <div className="bg-elev p-4"><div className="card-title">Total Sales</div><div className="card-value mt-1">{K(totals.totalSales)}</div></div>
            <div className="bg-elev p-4"><div className="card-title">Expenses</div><div className="card-value mt-1">{K(totals.totalExpenses)}</div></div>
            <div className="bg-elev p-4"><div className="card-title">Net Profit</div><div className="card-value mt-1">{K(totals.netProfit)}</div></div>
          </div>
          <button className="btn" onClick={refresh}>تحديث</button>
        </div>

        <Section
          title="Sales vs Expenses vs Net"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {['day','month','year'].map(v=>(
                <button key={v} className={`btn ${range===v ? 'btn-primary' : ''}`} onClick={()=>setRange(v)}>
                  {v === 'day' ? 'Today' : v === 'month' ? 'This Month' : 'This Year'}
                </button>
              ))}
              <div className="mx-2 h-6 w-px bg-line" />
              <input type="date" className="rounded-xl border border-line px-3 py-2" value={from} onChange={e=>setFrom(e.target.value)} />
              <input type="date" className="rounded-xl border border-line px-3 py-2" value={to} onChange={e=>setTo(e.target.value)} />
              <button className="btn btn-primary" onClick={()=>setRange('custom')}>Apply</button>
            </div>
          }
        >
          {dataset.length ? <ChartSales data={dataset} /> :
            <div className="h-64 grid place-items-center text-mute">No data for selected range</div>}
        </Section>
      </div>
    </OverviewNeon>
  )
}
