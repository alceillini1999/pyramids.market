// frontend/src/pages/WhatsAppPage.jsx
import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/+$/,"");
const url = (p) => `${API_BASE}${p.startsWith('/')?p:`/${p}`}`;

export default function WhatsAppPage() {
  const [clients, setClients] = useState([]);
  const [q, setQ] = useState(""); // ← بحث العملاء
  const [selectedClients, setSelectedClients] = useState([]);
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState("Not connected");
  const [qrDataUrl, setQrDataUrl] = useState(null); // ← صورة QR

  // Load clients from backend instead of hardcoded list
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(url('/api/clients'), { credentials:'include' });
        const json = await res.json();
        const arr = Array.isArray(json.data) ? json.data : json;
        setClients(Array.isArray(arr) ? arr : []);
      } catch (e) {
        console.error("Failed to load clients", e);
      }
    })();
  }, []);

  // WhatsApp status
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch(`${API_BASE}/api/whatsapp/status`);
        const data = await res.json();
        setStatus(data.state || "Unknown");
      } catch {
        setStatus("Error");
      }
    }
    fetchStatus();
    const i1 = setInterval(fetchStatus, 5000);
    return () => clearInterval(i1);
  }, []);

  // QR polling (يتطلب backend يعيد { qr: '...' })
  useEffect(() => {
    let cancelled = false;
    let QR;
    (async function loop(){
      try {
        const res = await fetch(`${API_BASE}/api/whatsapp/qr`);
        if (res.status === 200) {
          const data = await res.json();
          if (data?.qr) {
            // استيراد ديناميكي لمكتبة qrcode بدون التأثير على بقية الباندل
            QR = QR || (await import('qrcode'));
            const url = await QR.toDataURL(data.qr);
            if (!cancelled) setQrDataUrl(url);
          }
        }
      } catch {}
      if (!cancelled) setTimeout(loop, 3000);
    })();
    return ()=>{ cancelled = true; }
  }, []);

  const filtered = clients.filter(c =>
    (c.name||"").toLowerCase().includes(q.toLowerCase()) ||
    (c.phone||"").includes(q)
  );

  const handleSelectClient = (phone) => {
    setSelectedClients((prev) =>
      prev.includes(phone)
        ? prev.filter((p) => p !== phone)
        : [...prev, phone]
    );
  };

  const handleSend = async () => {
    if (!selectedClients.length || !message) {
      alert("Please select clients and write a message.");
      return;
    }

    const res = await fetch(`${API_BASE}/api/whatsapp/send-bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: selectedClients, message, mediaUrl: imageUrl || undefined }),
    });

    const data = await res.json();
    if (data.ok) {
      alert("Messages sent successfully!");
    } else {
      alert("Failed to send messages: " + (data.error || "Unknown error"));
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">WhatsApp</h2>
            <div>Status: {status}</div>
          </div>

          {/* QR */}
          {qrDataUrl && (
            <div className="mb-4">
              <div className="text-sm text-mute mb-1">Scan to connect:</div>
              <img src={qrDataUrl} alt="WhatsApp QR" className="w-56 h-56 border rounded" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Clients</h3>
              <input
                className="w-full border rounded p-2 mb-2"
                placeholder="Search by name or phone…"
                value={q}
                onChange={(e)=>setQ(e.target.value)}
              />
              <div className="max-h-80 overflow-y-auto border rounded p-2">
                {filtered.map((c) => (
                  <label key={c._id || c.phone} className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      value={c.phone}
                      checked={selectedClients.includes(c.phone)}
                      onChange={() => handleSelectClient(c.phone)}
                    />
                    <span>{c.name}</span>
                    <span className="text-mute">({c.phone})</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Message</h3>
              <textarea
                className="w-full border rounded p-2"
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message here..."
              />
              <input
                className="w-full border rounded p-2 my-2"
                placeholder="Image URL (optional)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <Button onClick={handleSend}>Send</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
