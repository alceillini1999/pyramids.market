import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Layout from './components/Layout'

// الصفحات
import OverviewPage from './pages/OverviewPage'
import WhatsAppPage from './pages/WhatsAppPage'
import ProductsPage from './pages/ProductsPage'
import ExpensesPage from './pages/ExpensesPage'
import POSPage from './pages/POSPage'
import ClientsPage from './pages/ClientsPage'
import SalesPage from './pages/SalesPage'

// الأنيميشن العام للصفحات
import { AnimatePresence } from 'framer-motion'
import PageWrapper from './ui/anim/PageWrapper'

// الخلفية المتحركة الجديدة
import AppBackground from './ui/theme/AppBackground'

function RoutedPages() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<PageWrapper><OverviewPage /></PageWrapper>} />
        <Route path="/whatsapp" element={<PageWrapper><WhatsAppPage /></PageWrapper>} />
        <Route path="/products" element={<PageWrapper><ProductsPage /></PageWrapper>} />
        <Route path="/expenses" element={<PageWrapper><ExpensesPage /></PageWrapper>} />
        <Route path="/pos" element={<PageWrapper><POSPage /></PageWrapper>} />
        <Route path="/clients" element={<PageWrapper><ClientsPage /></PageWrapper>} />
        <Route path="/sales" element={<PageWrapper><SalesPage /></PageWrapper>} />
        <Route path="*" element={<PageWrapper><div className="p-6 text-mute">Not Found</div></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      {/* الخلفية المتحركة تغطي كل الصفحات */}
      <AppBackground>
        <div className="min-h-screen relative">
          <Layout className="motion-ready">
            <RoutedPages />
          </Layout>
        </div>
      </AppBackground>
    </BrowserRouter>
  )
}
