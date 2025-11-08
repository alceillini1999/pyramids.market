import React, { useMemo, useState } from 'react'
import Section from '../components/Section'
import ChartSales from '../components/ChartSales'

const K = n => `KSh ${Number(n).toLocaleString('en-KE')}`

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

export default function OverviewPage() {
  const [range, setRange] = useState('day')
  const data = DATA[range]

  const totals = useMemo(() => {
    const s = data.reduce((a,b)=>a+b.sales,0)
    const e = data.reduce((a,b)=>a+b.expenses,0)
    const n = data.reduce((a,b)=>a+b.net,0)
    return { s, e, n }
  }, [data])

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <div className="bg-elev p-4"><div className="card-title">Total Sales ({range})</div><div className="card-value mt-1">{K(totals.s)}</div></div>
        <div className="bg-elev p-4"><div className="card-title">Expenses ({range})</div><div className="card-value mt-1">{K(totals.e)}</div></div>
        <div className="bg-elev p-4"><div className="card-title">Net Profit ({range})</div><div className="card-value mt-1">{K(totals.n)}</div></div>
      </div>

      <Section
        title="Sales vs Expenses vs Net"
        actions={
          <div className="flex gap-2">
            {['day','month','year'].map(v=>(
              <button
                key={v}
                className={`btn ${range===v ? 'btn-primary' : ''}`}
                onClick={()=>setRange(v)}
              >
                {v === 'day' ? 'Today' : v === 'month' ? 'This Month' : 'This Year'}
              </button>
            ))}
          </div>
        }
      >
        <ChartSales data={data} />
      </Section>
    </div>
  )
}
