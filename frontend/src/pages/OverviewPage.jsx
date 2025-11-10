import React, { useEffect, useMemo, useState } from 'react'
import Section from '../components/Section'
import ChartSales from '../components/ChartSales'
import OverviewNeon from '../ui/theme/OverviewNeon'
import OverviewNeonAnimated from '../ui/theme/OverviewNeonAnimated'
import NeonAppShell from '../layout/NeonAppShell'   // ✅ الغلاف العام للصفحة كاملة

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

  return (
    <NeonAppShell>
      <OverviewNeonAnimated>
        <OverviewNeon
          stats={{
            balance: totals.totalSales,
            investment: totals.totalSales,
            totalGain: Math.max(totals.netProfit, 0),
            totalLoss: Math.max(-totals.netProfit, 0),
          }}
          chartData={[...sales, ...expenses].length
            ? (() => {
                // بناء بيانات الرسم من صافي الربح حسب اختيارك
                const now = new Date()
                const dayKey = (d)=> new Date(d).toISOString().slice(0,10)
                const todayKey = dayKey(now)
                const daySales = sales.filter(s => dayKey(s.createdAt) === todayKey)
                const dayExpenses = expenses.filter(e => dayKey(e.date) === todayKey)
                const hours = Array.from({length:24}, (_,h)=>`${h}:00`)
                const sums = hours.map((hIdx)=>({
                  label: hIdx,
                  value:
                    (daySales.filter(s=>new Date(s.createdAt).getHours()===Number(hIdx)).reduce((a,b)=>a+Number(b.total||0),0))
                    -
                    (dayExpenses.filter(e=>new Date(e.date).getHours()===Number(hIdx)).reduce((a,b)=>a+Number(b.amount||0),0))
                }))
                return sums
              })()
            : []}
          actions={{ onDeposit: () => {}, onWithdraw: () => {} }}
          rightPanel={{ portfolioName: 'Pyramids Mart', value: totals.totalSales, holders: 50 }}
        >
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
                  {/* إن رغبت بإبقاء أزرار الفترات، أبقها كما هي هنا */}
                </div>
              }
            >
              {/* إن كان لديك مخطط جاهز أبقِه، وإلا سيظهر النص أدناه */}
              <ChartSales data={[]} />
            </Section>
          </div>
        </OverviewNeon>
      </OverviewNeonAnimated>
    </NeonAppShell>
  )
}
