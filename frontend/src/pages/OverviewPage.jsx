// src/pages/OverviewPage.jsx
import React from "react";

export default function OverviewPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-yellow-600 mb-4">Overview</h1>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 bg-yellow-50 rounded-xl shadow-inner">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Sales Summary</h2>
            <p className="text-gray-600">Total Sales Today: $4,580</p>
            <p className="text-gray-600">Total Sales This Month: $82,300</p>
          </div>

          <div className="p-6 bg-yellow-50 rounded-xl shadow-inner">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Customers</h2>
            <p className="text-gray-600">New Clients This Week: 18</p>
            <p className="text-gray-600">Total Clients: 562</p>
          </div>
        </div>

        <div className="mt-6 p-6 bg-yellow-50 rounded-xl shadow-inner">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Recent Activity</h2>
          <ul className="space-y-2 text-gray-600">
            <li>- New client added: Ahmed Khaled</li>
            <li>- Product “Smart Watch” restocked</li>
            <li>- POS system updated successfully</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
