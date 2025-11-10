import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'

// الصفحات
import OverviewPage from './pages/OverviewPage'
import WhatsAppPage from './pages/WhatsAppPage'
import ProductsPage from './pages/ProductsPage'
import ExpensesPage from './pages/ExpensesPage'
import POSPage from './pages/POSPage'
import ClientsPage from './pages/ClientsPage'
import SalesPage from './pages/SalesPage'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/whatsapp" element={<WhatsAppPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/pos" element={<POSPage />} />
          {/* ✅ هنا كان العكس: أصلحنا التبديل */}
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/sales" element={<SalesPage />} />
          {/* 404 بسيطة */}
          <Route path="*" element={<div className="p-6 text-mute">Not Found</div>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
