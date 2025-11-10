import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'

// الصفحات
import OverviewPage from './pages/OverviewPage'
import ProductsPage from './pages/ProductsPage'
import ExpensesPage from './pages/ExpensesPage'
import POSPage from './pages/POSPage'
import ClientsPage from './pages/ClientsPage'
import WhatsAppPage from './pages/WhatsAppPage'
import SalesPage from './pages/SalesPage' // ← صفحة المبيعات الجديدة

export default function App(){
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/whatsapp" element={<WhatsAppPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/pos" element={<POSPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/sales" element={<SalesPage />} /> {/* ← route جديد */}
          <Route path="*" element={<div className="p-6">الصفحة غير موجودة</div>} />
        </Routes>
      </Layout>
    </Router>
  )
}
