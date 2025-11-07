import React, { useContext } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import WhatsAppPage from './pages/WhatsAppPage'
import ProductsPage from './pages/ProductsPage'
import ExpensesPage from './pages/ExpensesPage'
import POSPage from './pages/POSPage'
import ClientsPage from './pages/ClientsPage'
import OverviewPage from './pages/OverviewPage'
import LoginPage from './pages/LoginPage'
import Register from './pages/Auth/Register'
import { AuthContext } from './AuthProvider'

export default function App(){
  const { user, logout } = useContext(AuthContext || { user:null, logout: ()=>{} });
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[rgba(255,250,245,1)] to-white">
      <aside className="w-64 p-4 border-r bg-white/60 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <img src="/logo.png" alt="logo" className="w-12 h-12 object-contain"/>
          <div>
            <h1 className="font-bold text-lg text-pyramid-dark">Pyramids Mart</h1>
            <p className="text-sm text-gray-500">Dashboard</p>
          </div>
        </div>
        <nav className="space-y-2">
          <Link to="/whatsapp" className="block px-3 py-2 rounded hover:bg-pyramid-yellow/20">WhatsApp</Link>
          <Link to="/products" className="block px-3 py-2 rounded hover:bg-pyramid-yellow/20">Products</Link>
          <Link to="/expenses" className="block px-3 py-2 rounded hover:bg-pyramid-yellow/20">Expenses</Link>
          <Link to="/pos" className="block px-3 py-2 rounded hover:bg-pyramid-yellow/20">POS</Link>
          <Link to="/clients" className="block px-3 py-2 rounded hover:bg-pyramid-yellow/20">Clients</Link>
          <Link to="/overview" className="block px-3 py-2 rounded hover:bg-pyramid-yellow/20">Overview (future)</Link>
        </nav>
      </aside>
      <main className="flex-1 p-6">
        <header className="flex justify-end mb-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-sm">مرحباً، {user.name}</div>
              <button onClick={logout} className="px-3 py-1 border rounded">خروج</button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Link to="/login" className="px-3 py-1 border rounded">تسجيل الدخول</Link>
              <Link to="/register" className="px-3 py-1 border rounded">تسجيل</Link>
            </div>
          )}
        </header>

        <Routes>
          <Route path="/" element={<OverviewPage/>}/>
          <Route path="/login" element={<LoginPage/>}/>
          <Route path="/register" element={<Register/>}/>
          <Route path="/whatsapp" element={<WhatsAppPage/>}/>
          <Route path="/products" element={<ProductsPage/>}/>
          <Route path="/expenses" element={<ExpensesPage/>}/>
          <Route path="/pos" element={<POSPage/>}/>
          <Route path="/clients" element={<ClientsPage/>}/>
          <Route path="/overview" element={<OverviewPage/>}/>
        </Routes>
      </main>
    </div>
  )
}