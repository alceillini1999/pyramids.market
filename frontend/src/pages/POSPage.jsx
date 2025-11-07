// src/pages/POSPage.jsx
import React from "react";

export default function POSPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-3xl w-full">
        <h1 className="text-3xl font-bold text-yellow-600 mb-6">Point of Sale (POS)</h1>

        <div className="bg-yellow-50 rounded-lg p-6 shadow-inner">
          <p className="text-gray-700 mb-4">
            Manage in-store sales, add new transactions, and print receipts seamlessly.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-white rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">New Transaction</h2>
              <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded transition">
                Start Sale
              </button>
            </div>

            <div className="p-4 bg-white rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Daily Summary</h2>
              <p className="text-gray-600">Total Transactions: 42</p>
              <p className="text-gray-600">Revenue: $7,890</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
