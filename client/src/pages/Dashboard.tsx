import { useEffect, useMemo, useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { format } from 'date-fns'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

export default function Dashboard() {
  const [records, setRecords] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [pred, setPred] = useState<any>(null)
  const [form, setForm] = useState({ timestamp: '', usageKWh: '', note: '' })
  const [bill, setBill] = useState<number | null>(null)
  const [tip, setTip] = useState('')

  async function load() {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    const [r1, r2, r3] = await Promise.all([
      fetch(`${base}/api/energy?limit=100`, { credentials: 'include' }),
      fetch(`${base}/api/energy/stats`, { credentials: 'include' }),
      fetch(`${base}/api/energy/predict`, { credentials: 'include' }),
    ])
    setRecords(r1.ok ? (await r1.json()).records : [])
    setStats(r2.ok ? (await r2.json()).stats : null)
    setPred(r3.ok ? (await r3.json()) : null)
  }

  useEffect(() => { load() }, [])

  const chartData = useMemo(() => {
    const labels = records.map(r => format(new Date(r.timestamp), 'MM-dd HH:mm'))
    const data = records.map(r => r.usageKWh)
    return {
      labels,
      datasets: [
        { label: 'Usage (kWh)', data, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.3)' }
      ]
    }
  }, [records])

  function calcBill() {
    const rate = 0.15 // $/kWh example
    const total = records.reduce((s, r) => s + r.usageKWh, 0)
    const amount = total * rate
    setBill(Number(amount.toFixed(2)))
  }

  async function addRecord(e: React.FormEvent) {
    e.preventDefault()
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    const res = await fetch(`${base}/api/energy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...form, usageKWh: Number(form.usageKWh) })
    })
    if (res.ok) {
      setForm({ timestamp: '', usageKWh: '', note: '' })
      await load()
    }
  }

  function generateTip() {
    // Simple heuristic bot; can be replaced with LLM
    if (!stats) return setTip('Log some usage to get personalized tips!')
    if (stats.avgKWh > 10) return setTip('Your average is high. Consider shifting heavy appliances to off-peak hours.')
    if (pred && pred.predictedPeak > 12) return setTip('Upcoming peak predicted. Pre-cool your home or delay laundry to reduce peak.')
    return setTip('Great job keeping usage moderate. Maintain consistent habits and turn off idle devices.')
  }

  return (
    <div className="container py-6 grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2 space-y-6">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Current Usage</h2>
            <button className="btn" onClick={load}>Refresh</button>
          </div>
          <Line data={chartData} />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="card p-4"><div className="text-sm text-slate-500">Records</div><div className="text-2xl font-semibold">{stats?.count ?? 0}</div></div>
          <div className="card p-4"><div className="text-sm text-slate-500">Monthly Avg kWh</div><div className="text-2xl font-semibold">{(stats?.avgKWh ?? 0).toFixed(2)}</div></div>
          <div className="card p-4"><div className="text-sm text-slate-500">Predicted Peak kWh</div><div className="text-2xl font-semibold">{(pred?.predictedPeak ?? 0).toFixed(2)}</div></div>
        </div>

        <div className="card p-4">
          <h3 className="font-semibold mb-2">Export</h3>
          <div className="flex gap-2">
            <a className="btn" href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/export/csv`} target="_blank">CSV</a>
            <a className="btn" href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/export/pdf`} target="_blank">PDF</a>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="card p-4">
          <h3 className="font-semibold mb-2">Add Energy Usage</h3>
          <form className="space-y-2" onSubmit={addRecord}>
            <input className="input" placeholder="Timestamp (YYYY-MM-DDTHH:mm)" value={form.timestamp} onChange={e => setForm({ ...form, timestamp: e.target.value })} />
            <input className="input" placeholder="Usage kWh" value={form.usageKWh} onChange={e => setForm({ ...form, usageKWh: e.target.value })} />
            <input className="input" placeholder="Note (optional)" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
            <button className="btn w-full" type="submit">Add</button>
          </form>
        </div>

        <div className="card p-4">
          <h3 className="font-semibold mb-2">Bill Calculator</h3>
          <button className="btn" onClick={calcBill}>Calculate</button>
          {bill !== null && <div className="mt-2">Estimated bill: ${bill.toFixed(2)}</div>}
        </div>

        <div className="card p-4">
          <h3 className="font-semibold mb-2">Tips Bot</h3>
          <div className="text-sm text-slate-600 dark:text-slate-300">Get personalized energy-saving tips.</div>
          <button className="btn mt-2" onClick={generateTip}>Get Tip</button>
          {tip && <div className="mt-2 text-slate-800 dark:text-slate-100">{tip}</div>}
        </div>

        <div className="card p-4">
          <h3 className="font-semibold mb-2">Model</h3>
          <button className="btn" onClick={async () => {
            const base = import.meta.env.VITE_API_URL || 'http://localhost:5000'
            const r = await fetch(`${base}/api/energy/train`, { method: 'POST', credentials: 'include' })
            if (r.ok) alert('Model trained')
          }}>Train Model</button>
        </div>
      </div>
    </div>
  )
}
