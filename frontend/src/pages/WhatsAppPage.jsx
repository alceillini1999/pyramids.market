import React, { useState } from 'react'
import Section from '../components/Section'

const CLIENTS = [
  { id: 1, name: 'Mohamed Adel', phone: '+254700000001' },
  { id: 2, name: 'Sara Nabil', phone: '+254700000002' },
  { id: 3, name: 'Omar Ali', phone: '+254700000003' },
]

export default function WhatsAppPage() {
  const [selected, setSelected] = useState(CLIENTS[0])
  const [connected, setConnected] = useState(false)
  const [message, setMessage] = useState('')
  const [file, setFile] = useState(null)

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Clients list */}
      <Section title="Clients">
        <ul className="space-y-2">
          {CLIENTS.map(c => (
            <li key={c.id}>
              <button
                className={`w-full text-left rounded-xl px-3 py-2 border ${selected?.id===c.id ? 'bg-base border-line' : 'border-line hover:bg-base'}`}
                onClick={()=>setSelected(c)}
              >
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-mute">{c.phone}</div>
              </button>
            </li>
          ))}
        </ul>
      </Section>

      {/* Composer */}
      <Section title="Compose message" actions={<div className={`badge ${connected?'text-green-700':'text-red-700'}`}>{connected ? 'Connected' : 'Disconnected'}</div>}>
        <div className="space-y-3">
          <div className="text-sm text-mute">To: <span className="font-medium text-ink">{selected?.name} — {selected?.phone}</span></div>
          <textarea
            className="w-full rounded-xl border border-line p-3"
            rows={5}
            placeholder="Write your message..."
            value={message}
            onChange={e=>setMessage(e.target.value)}
          />
          <input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0] ?? null)} />
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={()=>alert(`(Demo) Sending to ${selected?.phone}\n\n${message}${file ? '\n[with image]' : ''}`)}>Send</button>
            <button className="btn" onClick={()=>{setMessage(''); setFile(null)}}>Clear</button>
          </div>
        </div>
      </Section>

      {/* QR + Connection */}
      <Section title="WhatsApp Link Code" actions={
        <button className="btn" onClick={()=>setConnected(v=>!v)}>{connected ? 'Disconnect' : 'Connect'}</button>
      }>
        <div className="grid place-items-center h-64">
          <div className="text-mute">[ QR Code Placeholder ]</div>
        </div>
        <p className="text-sm text-mute">Scan the QR with WhatsApp to link this device.</p>
      </Section>
    </div>
  )
}
