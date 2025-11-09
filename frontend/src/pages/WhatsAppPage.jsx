import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";

export default function WhatsAppPage() {
  const [clients, setClients] = useState([
    { name: "Mohamed Adel", phone: "+254700000001" },
    { name: "Sara Nabil", phone: "+254700000002" },
    { name: "Omar Ali", phone: "+254700000003" },
  ]);

  const [selectedClients, setSelectedClients] = useState([]);
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState("Not connected");
  const [qrImage, setQrImage] = useState(null);
  const [loadingQR, setLoadingQR] = useState(false);

  const apiBase =
    import.meta.env.VITE_WA_WEB_BASE || "https://pyramids-market.onrender.com";

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

    const res = await fetch(`${apiBase}/api/whatsapp/send-bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: selectedClients,
        message,
        mediaUrl: imageUrl,
      }),
    });
    const data = await res.json();
    console.log("Send result:", data);
    alert("Messages sent! Check logs for results.");
  };

  const handleInit = async () => {
    setLoadingQR(true);
    setQrImage(null);

    await fetch(`${apiBase}/api/whatsapp/init`);

    const qrRes = await fetch(`${apiBase}/api/whatsapp/qr-image`);
    if (qrRes.ok) {
      const blob = await qrRes.blob();
      const url = URL.createObjectURL(blob);
      setQrImage(url);
      setStatus("Scan the QR with WhatsApp app");
    } else {
      setStatus("Failed to load QR code");
    }

    setLoadingQR(false);
  };

  const handleRefreshStatus = async () => {
    const res = await fetch(`${apiBase}/api/whatsapp/status`);
    const data = await res.json();
    if (data.connected) {
      setStatus("✅ Connected");
      setQrImage(null);
    } else {
      setStatus("❌ Not connected");
    }
  };

  useEffect(() => {
    handleRefreshStatus();
  }, []);

  return (
    <div className="grid grid-cols-3 gap-6 p-6">
      {/* Clients */}
      <Card className="col-span-1">
        <CardContent className="p-4 space-y-2">
          <h2 className="text-lg font-semibold mb-2">Clients</h2>
          <div className="flex justify-between mb-2">
            <Button
              size="sm"
              onClick={() => setSelectedClients(clients.map((c) => c.phone))}
            >
              Select All
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSelectedClients([])}>
              Clear
            </Button>
          </div>
          {clients.map((c) => (
            <label
              key={c.phone}
              className="flex items-center justify-between border rounded px-3 py-2 cursor-pointer"
            >
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-gray-500">{c.phone}</div>
              </div>
              <input
                type="checkbox"
                checked={selectedClients.includes(c.phone)}
                onChange={() => handleSelectClient(c.phone)}
              />
            </label>
          ))}
        </CardContent>
      </Card>

      {/* Compose message */}
      <Card className="col-span-1">
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold mb-2">Compose message</h2>
          <textarea
            className="w-full border rounded p-2 mb-2 h-28"
            placeholder="Write your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <input
            className="w-full border rounded p-2 mb-3"
            placeholder="Optional image URL (public link)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          <div className="flex justify-between">
            <Button onClick={handleSend}>Send</Button>
            <Button variant="outline" onClick={() => setMessage("")}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp Web */}
      <Card className="col-span-1">
        <CardContent className="p-4 text-center space-y-4">
          <h2 className="text-lg font-semibold mb-2">WhatsApp Web</h2>
          <div className="text-sm text-gray-600">{status}</div>

          {loadingQR && <div>Loading QR...</div>}

          {qrImage && (
            <img
              src={qrImage}
              alt="WhatsApp QR Code"
              className="mx-auto border rounded shadow p-2"
              style={{ width: "220px", height: "220px" }}
            />
          )}

          <div className="flex justify-center gap-2">
            <Button size="sm" onClick={handleInit}>
              Init / Refresh QR
            </Button>
            <Button size="sm" variant="outline" onClick={handleRefreshStatus}>
              Check Status
            </Button>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Click "Init / Refresh QR", then scan the code with WhatsApp → Linked devices.
          </p>
          <p className="text-xs text-gray-400">
            This connects to your server at {apiBase} via Baileys (WhatsApp Web protocol).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
