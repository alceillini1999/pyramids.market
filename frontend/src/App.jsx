import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";

// الصفحات
import Dashboard from "./pages/Dashboard";
import OverviewPage from "./pages/OverviewPage";
import ProductsPage from "./pages/ProductsPage";
import ExpensesPage from "./pages/ExpensesPage";
import POSPage from "./pages/POSPage";
import ClientsPage from "./pages/ClientsPage";
import WhatsAppPage from "./pages/WhatsAppPage";
import LoginPage from "./pages/LoginPage";
import Register from "./pages/Auth/Register"; // إذا كنت تستخدم صفحة التسجيل

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />

          {/* Dashboard / Overview */}
          <Route path="/overview" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* App pages */}
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/pos" element={<POSPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/whatsapp" element={<WhatsAppPage />} />

          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </Layout>
    </Router>
  );
}
