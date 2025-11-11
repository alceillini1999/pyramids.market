import React, { useEffect, useMemo, useState } from 'react'
import Section from '../components/Section'
import ChartSales from '../components/ChartSales'
import '../styles/pyramids-theme.css'

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
    try {
      const sRes = await fetch(url('/api/sales?page=1&limit=1000'), { credentials:'include' })
      const sJson = await sRes.json()
      const sRows = Array.isArray(sJson) ? sJson : (Array.isArray(sJson.rows) ? sJson.rows : [])
      setSales(sRows)

      const eRes = await fetch(url('/api/expenses'), { credentials:'include' })
      const eRows = await eRes.json()
      setExpenses(Array.isArray(eRows) ? eRows : [])
    } catch (err) {
      console.error('Error loading overview data', err)
    }
  }

  useEffect(()=>{ refresh() }, [])

  const totals = useMemo(()=>{
    const totalSales = sales.reduce((s,r)=>s + Number(r.total||0), 0)
    const totalExpenses = expenses.reduce((s,r)=>s + Number(r.amount||0), 0)
    return { totalSales, totalExpenses, netProfit: totalSales - totalExpenses }
  }, [sales, expenses])

  return { sales, expenses, totals }
}

export default function OverviewPage() {
  const [range] = useState('day')
  const { sales, expenses, totals } = useOverviewData()

  const dataset = useMemo(()=>{
    if (!sales.length && !expenses.length) return []
    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd   = endOfDay(now)
    const bSales = Array(24).fill(0), bExp = Array(24).fill(0)
    sales.forEach(s=>{ const t=new Date(s.createdAt); if (t>=todayStart&&t<=todayEnd) bSales[t.getHours()]+=Number(s.total||0) })
    expenses.forEach(e=>{ const t=new Date(e.date); if (t>=todayStart&&t<=todayEnd) bExp[t.getHours()]+=Number(e.amount||0) })
    return Array.from({length:24}).map((_,h)=>({ label:`${h}:00`, sales:bSales[h], expenses:bExp[h], net:bSales[h]-bExp[h] }))
  }, [range, sales, expenses])

  return (
    <div className="p-6 space-y-6 text-white">
      {/* الكروت الثلاثة */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <div className="bg-transparent border border-white/10 p-4 rounded-2xl backdrop-blur">
          <div className="text-white/70 mb-1">Total Sales</div>
          <div className="text-3xl font-semibold">{K(totals.totalSales)}</div>
        </div>
        <div className="bg-transparent border border-white/10 p-4 rounded-2xl backdrop-blur">
          <div className="text-white/70 mb-1">Expenses</div>
          <div className="text-3xl font-semibold">{K(totals.totalExpenses)}</div>
        </div>
        <div className="bg-transparent border border-white/10 p-4 rounded-2xl backdrop-blur">
          <div className="text-white/70 mb-1">Net Profit</div>
          <div className="text-3xl font-semibold">{K(totals.netProfit)}</div>
        </div>
      </div>

      {/* الرسم البياني */}
      <Section title="Sales vs Expenses vs Net">
        {dataset.length ? <ChartSales data={dataset} /> :
          <div className="h-64 grid place-items-center text-white/50">
            No data for today
          </div>}
      </Section>
    </div>
  )
}
