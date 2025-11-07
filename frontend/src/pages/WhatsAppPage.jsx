import React, { useEffect, useState, useRef } from 'react'
import api from '../api/api'

export default function WhatsAppPage(){
  const [qr, setQr] = useState(null)
  const [status, setStatus] = useState({ connected:false })
  const [clients, setClients] = useState([])
  const [selected, setSelected] = useState({})
  const [selectAll, setSelectAll] = useState(false)
  const [search, setSearch] = useState('')
  const [area, setArea] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState({ total:0, done:0 })
  const [attachments, setAttachments] = useState([])
  const fileRef = useRef()

  const API = ''

  useEffect(()=>{ fetchStatusAndQR(); fetchClients(); const t = setInterval(fetchStatusAndQR, 5000); return ()=>clearInterval(t) }, [])

  async function fetchStatusAndQR(){
    try{
      const res = await api.get('/whatsapp/qr');
      setQr(res.data.qr);
      setStatus({ connected: res.data.connected });
    }catch(err){ console.warn(err) }
  }

  async function fetchClients(){
    try{
      const q = new URLSearchParams();
      if (search) q.set('search', search);
      if (area) q.set('area', area);
      const res = await api.get('/clients?' + q.toString());
      const list = res.data.data || res.data;
      setClients(list);
      const sel = {};
      list.forEach(c=> sel[c._id || c.id] = false);
      setSelected(sel);
      setSelectAll(false);
    }catch(err){ console.error(err); alert('فشل جلب العملاء') }
  }

  function toggleSelect(id){
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleSelectAll(){
    const all = !selectAll;
    const sel = {};
    clients.forEach(c=> sel[c._id || c.id] = all);
    setSelected(sel);
    setSelectAll(all);
  }

  async function handleFile(e){
    const f = e.target.files[0];
    if (!f) return;
    const fd = new FormData();
    fd.append('file', f);
    try{
      const res = await api.post('/uploads', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = (res.data.url.startsWith('/') ? '' : '') + res.data.url;
      setAttachments(prev => [...prev, url]);
      alert('تم رفع الملف');
    }catch(err){
      console.error(err); alert('فشل رفع الملف');
    } finally {
      fileRef.current.value = null;
    }
  }

  async function handleSend(){
    const clientIds = Object.keys(selected).filter(k => selected[k]);
    if (!clientIds.length) return alert('اختر عملاء للإرسال');
    if (!message && attachments.length===0) return alert('اكتب رسالة أو أرفق ملفًا');
    setSending(true); setProgress({ total: clientIds.length, done:0 });
    try{
      const res = await api.post('/whatsapp/send', { clientIds, text: message, attachments });
      // results array with per-client status
      const results = res.data.results || [];
      let done = 0;
      results.forEach(r=> { if (r.res && r.res.ok) done++; });
      setProgress({ total: results.length, done });
      alert('تم الإرسال. تفقد السجلات للمزيد.');
    }catch(err){
      console.error(err);
      if (err.response && err.response.status === 401) alert('مطلوب تسجيل الدخول لإرسال الرسائل (حماية API)');
      else alert('فشل الإرسال: ' + (err.message || 'خطأ'));
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">واتساب — WhatsApp</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-semibold mb-2">حالة الاتصال</h3>
          <div className="mb-2">Status: {status.connected ? <span className="text-green-600">متصل</span> : <span className="text-red-500">غير متصل</span>}</div>
          <div>
            {qr ? <img src={qr} alt="QR" className="w-48 h-48 object-contain" /> : <div className="p-4 border rounded">لا يوجد رمز QR حالياً</div>}
          </div>
        </div>

        <div className="md:col-span-2 p-4 bg-white rounded shadow">
          <div className="mb-3 flex gap-2">
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث بالاسم..." className="p-2 border rounded flex-1"/>
            <input value={area} onChange={e=>setArea(e.target.value)} placeholder="المنطقة..." className="p-2 border rounded"/>
            <button onClick={fetchClients} className="px-3 py-2 bg-pyramid-gold rounded text-white">بحث</button>
          </div>

          <div className="mb-3 flex items-center gap-3">
            <button onClick={toggleSelectAll} className="px-3 py-2 border rounded">{selectAll ? 'إلغاء تحديد الكل' : 'تحديد الكل'}</button>
            <label className="px-3 py-2 border rounded cursor-pointer">أرفق ملف
              <input ref={fileRef} type="file" onChange={handleFile} className="hidden" />
            </label>
            <div className="flex-1 text-right text-sm text-gray-500">مرفقات: {attachments.length}</div>
          </div>

          <div className="mb-3">
            <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="اكتب رسالتك هنا..." className="w-full p-3 border rounded h-28"></textarea>
          </div>

          <div className="mb-3">
            <button disabled={sending} onClick={handleSend} className="px-4 py-2 bg-pyramid-brown text-white rounded">{sending ? 'جارٍ الإرسال...' : 'إرسال الرسالة'}</button>
            <div className="inline-block ml-4">{progress.done}/{progress.total} مرسلة</div>
          </div>

          <div className="overflow-auto max-h-64 border rounded p-2">
            <table className="w-full table-auto">
              <thead><tr className="text-left"><th></th><th>الاسم</th><th>الهاتف</th><th>المنطقة</th></tr></thead>
              <tbody>
                {clients && clients.length ? clients.map(c=> {
                  const id = c._id || c.id;
                  return (
                    <tr key={id} className="align-top">
                      <td><input type="checkbox" checked={!!selected[id]} onChange={()=>toggleSelect(id)} /></td>
                      <td>{c.name}</td>
                      <td>{c.phone}</td>
                      <td>{c.area}</td>
                    </tr>
                  )
                }) : <tr><td colSpan="4">لا يوجد عملاء</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
