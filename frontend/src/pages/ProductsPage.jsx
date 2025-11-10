// frontend/src/pages/ProductsPage.jsx
import { useEffect, useRef, useState, useMemo } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { readExcelRows, mapRowByAliases, exportTableToExcel } from "../lib/excel";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/+$/,"");
const url = (p) => `${API_BASE}${p.startsWith('/')?p:`/${p}`}`;

function getVal(obj, keys, def = "") {
  for (const k of keys) if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  return def;
}

const PRODUCT_ALIASES = {
  name: ["name", "product", "product name"],
  salePrice: ["saleprice", "price", "selling price", "sale price"],
  costPrice: ["costprice", "cost price", "buy price", "purchase price"],
  quantity: ["qty", "quantity", "stock"],
  active: ["active", "enabled", "isactive"],
  totalSales: ["totalsales", "total sales"],
  expiryDate: ["expiry", "expirydate", "expiration", "expire date"], // جديد
  category: ["category", "cat", "group"], // جديد
};

function AvailabilityDot({ qty }){
  const color = qty === 0 ? 'bg-red-500' : (qty <= 10 ? 'bg-yellow-500' : 'bg-green-500');
  return <span className={`inline-block w-3 h-3 rounded-full ${color}`} />;
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [avail, setAvail] = useState(''); // ok | low | zero | ''
  const fileRef = useRef(null);
  const tableRef = useRef(null);

  const exportExcel = () => exportTableToExcel(tableRef.current, "products.xlsx");

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const res = await fetch(url("/api/products"));
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const categories = useMemo(()=>{
    const s = new Set((products||[]).map(p=>p.category).filter(Boolean));
    return Array.from(s);
  },[products]);

  const filtered = useMemo(()=>{
    return (products||[]).filter(p=>{
      const name = String(p.name||''); const barcode = String(p.barcode||'');
      const hitQ = !q || name.toLowerCase().includes(q.toLowerCase()) || barcode.includes(q);
      const hitCat = !cat || String(p.category||'') === cat;
      const qty = Number(p.quantity||0);
      const flag = qty===0 ? 'zero' : (qty<=10 ? 'low' : 'ok');
      const hitAvail = !avail || avail===flag;
      return hitQ && hitCat && hitAvail;
    });
  },[products,q,cat,avail]);

  async function onImportExcel(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const rows = await readExcelRows(f);
      const normalized = rows.map(r => mapRowByAliases(r, PRODUCT_ALIASES)).map(r => ({
        name: r.name || "",
        salePrice: Number(r.salePrice || 0),
        costPrice: Number(r.costPrice || 0),
        quantity: Number(r.quantity || 0),
        active: String(r.active).toLowerCase() === "true" || String(r.active).toLowerCase() === "1",
        totalSales: Number(r.totalSales || 0),
        expiryDate: r.expiryDate ? new Date(r.expiryDate).toISOString() : null,
        category: r.category || "",
      }));
      const res = await fetch(url('/api/products/bulk-import'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: normalized }),
      });
      if (!res.ok) throw new Error(await res.text());

      const out = await fetch(url("/api/products"));
      const data = await out.json();
      setProducts(Array.isArray(data) ? data : []);
      e.target.value = "";
      alert("Imported & saved.");
    } catch (err) {
      console.error(err);
      alert("Failed to import Excel: " + err.message);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Products</h2>
            <div className="flex gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={onImportExcel}
              />
              <Button onClick={() => fileRef.current?.click()}>
                Import Excel
              </Button>
              <Button variant="outline" onClick={exportExcel}>Export Excel</Button>
            </div>
          </div>

          {/* بحث وفلاتر */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <input className="border border-line rounded-xl px-3 py-2" placeholder="ابحث بالاسم أو الباركود…" value={q} onChange={e=>setQ(e.target.value)} />
            <select className="border border-line rounded-xl px-3 py-2" value={cat} onChange={e=>setCat(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <select className="border border-line rounded-xl px-3 py-2" value={avail} onChange={e=>setAvail(e.target.value)}>
              <option value="">All Availability</option>
              <option value="ok">Available (&gt;20)</option>
              <option value="low">Low (≤10)</option>
              <option value="zero">Out of stock (0)</option>
            </select>
          </div>

          {loading ? (
            <div>Loading…</div>
          ) : (
            <div className="overflow-x-auto">
              <table ref={tableRef} className="min-w-full text-sm">
                <thead className="text-left text-mute border-b border-line">
                  <tr>
                    <th className="py-2 pr-6">Name</th>
                    <th className="py-2 pr-6">Sale Price</th>
                    <th className="py-2 pr-6">Cost Price</th>
                    <th className="py-2 pr-6">Quantity</th>
                    <th className="py-2 pr-6">الإتاحة</th> {/* بدلاً من Active */}
                    <th className="py-2 pr-6">Total Sales</th>
                    <th className="py-2 pr-6">Expiry Date</th> {/* بدلاً من Updated At */}
                    <th className="py-2 pr-6">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, idx) => (
                    <tr key={p._id || idx} className="border-b border-line">
                      <td className="py-2 pr-6">{getVal(p, ["name"])}</td>
                      <td className="py-2 pr-6">{getVal(p, ["salePrice"])}</td>
                      <td className="py-2 pr-6">{getVal(p, ["costPrice"])}</td>
                      <td className="py-2 pr-6">{getVal(p, ["quantity"])}</td>
                      <td className="py-2 pr-6"><AvailabilityDot qty={Number(p.quantity||0)} /></td>
                      <td className="py-2 pr-6">{getVal(p, ["totalSales"])}</td>
                      <td className="py-2 pr-6">
                        {p.expiryDate ? String(p.expiryDate).slice(0,10) : ''}
                      </td>
                      <td className="py-2 pr-6">{p.category || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
