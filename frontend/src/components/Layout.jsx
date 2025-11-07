// src/components/Layout.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-800">
      {/* الشريط الجانبي */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 transform bg-white border-r w-64 p-4 transition-transform duration-200 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static md:flex-shrink-0`}
      >
        {/* اللوجو */}
        <div className="flex items-center gap-3 mb-6">
          <img src="/logo.png" alt="Pyramids Mart" className="w-32 h-auto object-contain" />
          <div>
            <h1 className="text-lg font-extrabold">Pyramids Mart</h1>
            <p className="text-sm text-gray-500">Dashboard</p>
          </div>
        </div>

        {/* روابط التنقل */}
        <nav className="flex flex-col space-y-1">
          <Link to="/whatsapp" className="px-3 py-2 rounded hover:bg-yellow-50">WhatsApp</Link>
          <Link to="/products" className="px-3 py-2 rounded hover:bg-yellow-50">Products</Link>
          <Link to="/expenses" className="px-3 py-2 rounded hover:bg-yellow-50">Expenses</Link>
          <Link to="/pos" className="px-3 py-2 rounded hover:bg-yellow-50">POS</Link>
          <Link to="/clients" className="px-3 py-2 rounded hover:bg-yellow-50">Clients</Link>
          <Link to="/overview" className="px-3 py-2 rounded hover:bg-yellow-50">Overview</Link>
        </nav>
      </aside>

      {/* طبقة الخلفية (للجوال) */}
      {open && (
        <button
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-20 md:hidden bg-black/30"
          aria-hidden="true"
        />
      )}

      {/* المحتوى */}
      <div className="flex-1 md:ml-64">
        {/* شريط علوي للجوال */}
        <header className="flex items-center justify-between p-4 border-b bg-white md:hidden">
          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded-md border hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold">Pyramids Mart</h2>
          <div />
        </header>

        {/* هنا تظهر صفحاتك */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
