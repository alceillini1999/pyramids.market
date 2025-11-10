// frontend/src/pages/ProductsPage.jsx
import { useEffect, useRef, useState } from "react";
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
  updatedAt: ["updatedat", "updated", "last updated"],
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
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
        updatedAt: r.updatedAt || new Date().toISOString(),
      }));
      // Persist via backend /bulk-import (JSON mode)
      const res = await fetch(url('/api/products/bulk-import'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: normalized }),
      });
      if (!res.ok) throw new Error(await res.text());

      // reload
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
                    <th className="py-2 pr-6">Active</th>
                    <th className="py-2 pr-6">Total Sales</th>
                    <th className="py-2 pr-6">Updated At</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, idx) => (
                    <tr key={p._id || idx} className="border-b border-line">
                      <td className="py-2 pr-6">{getVal(p, ["name"])}</td>
                      <td className="py-2 pr-6">{getVal(p, ["salePrice"])}</td>
                      <td className="py-2 pr-6">{getVal(p, ["costPrice"])}</td>
                      <td className="py-2 pr-6">{getVal(p, ["quantity"])}</td>
                      <td className="py-2 pr-6">{String(getVal(p, ["active"], ""))}</td>
                      <td className="py-2 pr-6">{getVal(p, ["totalSales"])}</td>
                      <td className="py-2 pr-6">{getVal(p, ["updatedAt"])}</td>
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
