import React, { useEffect, useMemo, useState } from 'react'
import Section from '../components/Section'
import ChartSales from '../components/ChartSales'

const K = n => `KSh ${Number(n).toLocaleString('en-KE')}`

// بيانات تجريبية للمخطط (نظهرها فقط إذا كان لدينا Totals فعلية > 0)
const DATA = {
  day: [
    { label: '8am', sales: 12500, expenses: 4200, net: 8300 },
    { label: '10am', sales: 18300, expenses: 6000, net: 12300 },
    { label: '12pm', sales: 22100, expenses: 9300, net: 12800 },
    { label: '2pm', sales: 15600, expenses: 7000, net: 8600 },
    { label: '4pm', sales: 19800, expenses: 7900, net: 11900 },
  ],
  month: Array.from({length: 12}).map((_,i)=>({ label:`D${i+1}`, sales: 10000+ i*1200, expenses: 5000+i*800, net: 5000+i*400 })),
  year: Array.from({length: 12}).map((_,i)=>({ label:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i], sales: 250000+i*18000, expenses: 120000+i*10000, net: 130000+i*8000 })),
}

const API_ORIG = (import.meta.env.VITE_API_URL || "").replace(/\/+$/,"")
const API_BASE = API_ORIG.replace(/\/api$/,"")
const url = (p) => `${API_BASE}${p.startsWith('/') ? p : `/${p}`}`

// يسحب الإجماليات من /stats/overview وإن رجعت أصفار، يحتسب من /expenses و /sales
function useOverviewTotals(){
  const [tot, setTot] = useState({ totalSales:0, totalExpenses:0, netProfit:0 })

  const fetchFromStats = async () => {
    const r = await fetch(url('/api/stats/overview'), { credentials:'include' })
    if (!r.ok) throw new Error('stats failed')
    const d = await r.json()
    return {
      totalSales: Number(d?.totalSales || 0),
      totalExpenses: Number(d?.totalExpenses || 0),
      netProfit: Number(d?.netProfit || 0),
    }
  }

  const fallbackCompute = async () => {
    // جمع المصروفات
    let totalExpenses = 0
    try {
      const r1 = await fetch(url('/api/expenses'), { credentials:'include' })
      const expenses = await r1.json()
      if (Array.isArray(expenses)) {
        totalExpenses = expenses.reduce((s, e) => s + Number(e.amount||0), 0)
      }
    } catch {}

    // جمع المبيعات + الربح
    let totalSales = 0
    let netProfit = 0
    try {
      // نجلب أول صفحة كبيرة كفاية (Backend قد يدعم التصفّح)
      const r2 = await fetch(url('/api/sales?page=1&limit=1000'), { credentials:'include' })
      const sales = await r2.json()
      const rows = Array.isArray(sales) ? sales : Array.isArray(sales.rows) ? sales.rows : []
      rows.forEach(s => {
        totalSales += Number(s.total || 0)
        netProfit += Number(s.profit || 0)
      })
    } catch {}

    return { totalSales, totalExpenses, netProfit }
  }

  const refresh = async ()=>{
    try {
      const a = await fetchFromStats()
      // إن كانت كلها صفر، نستخدم الحساب اليدوي
      if ((a.totalSales + a.totalExpenses + a.netProfit) === 0) {
        const b = await fallbackCompute()
        setTot(b)
      } else {
        setTot(a)
      }
    } catch {
      const b = await fallbackCompute()
      setTot(b)
    }
  }

  useEffect(()=>{ refresh() }, [])
  return { tot, refresh }
}

export default function OverviewPage() {
  const [range, setRange] = useState('day')   // day | month | year | custom
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [customData, setCustomData] = useState([])

  const { tot, refresh } = useOverviewTotals()

  const hasRealTotals = (tot.totalSales>0) || (tot.totalExpenses>0) || (tot.netProfit>0)
  const dataset = range === 'custom' ? customData : (hasRealTotals ? DATA[range] : [])

  const totalsFromDataset = useMemo(() => {
    const s = dataset.reduce((a,b)=>a+b.sales,0)
    const e = dataset.reduce((a,b)=>a+b.expenses,0)
    const n = dataset.reduce((a,b)=>a+b.net,0)
    return { s, e, n }
  }, [dataset])

  function applyCustom() {
    try {
      const start = new Date(from)
      const end = new Date(to)
      if (isNaN(start) || isNaN(end) || start > end) { setCustomData([]); return }
      const days = Math.ceil((end - start) / (1000*60*60*24)) + 1
      setCustomData(Array.from({ length: days }).map((_, idx) => {
        const d = new Date(start.getTime() + idx*24*60*60*1000)
        const seed = (d.getMonth()+1) * (d.getDate()+7)
        const sales = 12000 + seed * 150
        const expenses = 6000 + seed * 90
        return { label: d.toISOString().slice(0,10), sales, expenses, net: sales - expenses }
      }))
      setRange('custom')
    } catch { setCustomData([]) }
  }

  return (
    <div className="space-y-6">
      {/* Summary cards — الآن من API أو من fallback */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3 flex-1">
          <div className="bg-elev p-4"><div className="card-title">Total Sales</div><div className="card-value mt-1">{K(tot.totalSales)}</div></div>
          <div className="bg-elev p-4"><div className="card-title">Expenses</div><div className="card-value mt-1">{K(tot.totalExpenses)}</div></div>
          <div className="bg-elev p-4"><div className="card-title">Net Profit</div><div className="card-value mt-1">{K(tot.netProfit)}</div></div>
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
            <button className="btn btn-primary" onClick={applyCustom}>Apply</button>
          </div>
        }
      >
        {dataset.length ? <ChartSales data={dataset} /> :
          <div className="h-64 grid place-items-center text-mute">No data for selected range</div>}
      </Section>
    </div>
  )
}
