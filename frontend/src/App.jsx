import React, { useContext } from "react";
import { Routes, Route, Link } from "react-router-dom";
import WhatsAppPage from "./pages/WhatsAppPage";
import ProductsPage from "./pages/ProductsPage";
import ExpensesPage from "./pages/ExpensesPage";
import POSPage from "./pages/POSPage";
import ClientsPage from "./pages/ClientsPage";
import OverviewPage from "./pages/OverviewPage";
import LoginPage from "./pages/LoginPage";
import Register from "./pages/Auth/Register";
import { AuthContext } from "./AuthProvider";

export default function App() {
  const { user, logout } = useContext(AuthContext || { user: null, logout: () => {} });

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[rgba(255,250,245,1)] to-white text-gray-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white/90 backdrop-blur-sm border-r shadow-sm p-4 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          {/* smaller logo */}
          <img src="/logo.png" alt="logo" className="w-12 h-12 object-contain rounded" />
          <div>
            <h1 className="font-extrabold text-lg text-pyramid-dark">Pyramids Mart</h1>
            <p className="text-sm text-gray-500">Dashboard</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <Link to="/whatsapp" className="block px-3 py-2 rounded hover:bg-yellow-100">WhatsApp</Link>
          <Link to="/products" className="block px-3 py-2 rounded hover:bg-yellow-100">Products</Link>
          <Link to="/expenses" className="block px-3 py-2 rounded hover:bg-yellow-100">Expenses</Link>
          <Link to="/pos" className="block px-3 py-2 rounded hover:bg-yellow-100">POS</Link>
          <Link to="/clients" className="block px-3 py-2 rounded hover:bg-yellow-100">Clients</Link>
          <Link to="/overview" className="block px-3 py-2 rounded hover:bg-yellow-100">Overview</Link>
        </nav>

        <div className="mt-4">
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm">Hi, <b>{user.name}</b></span>
              <button onClick={logout} className="ml-auto px-3 py-1 rounded bg-red-50 text-red-600 text-sm">Logout</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link to="/login" className="px-3 py-1 border rounded text-sm">Sign in</Link>
              <Link to="/register" className="px-3 py-1 bg-yellow-500 text-white rounded text-sm">Register</Link>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6">
        {/* Top header (optional) */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Overview</h2>
            <p className="text-sm text-gray-500">Welcome to your dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-3 py-1 border rounded text-sm">Refresh</button>
          </div>
        </header>

        {/* Routes / Pages */}
        <div className="bg-transparent">
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<Register />} />
            <Route path="/whatsapp" element={<WhatsAppPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/pos" element={<POSPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/overview" element={<OverviewPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
