// src/pages/ProductsPage.jsx
import React from "react";

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-yellow-600 mb-6">Products</h1>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-yellow-50 p-6 rounded-lg shadow-inner hover:shadow-lg transition">
            <h2 className="text-lg font-semibold text-gray-800">Coffee Beans</h2>
            <p className="text-gray-600">Stock: 45 units</p>
            <p className="text-gray-600">Price: $12.99</p>
          </div>

          <div className="bg-yellow-50 p-6 rounded-lg shadow-inner hover:shadow-lg transition">
            <h2 className="text-lg font-semibold text-gray-800">Chocolate Bar</h2>
            <p className="text-gray-600">Stock: 88 units</p>
            <p className="text-gray-600">Price: $2.50</p>
          </div>

          <div className="bg-yellow-50 p-6 rounded-lg shadow-inner hover:shadow-lg transition">
            <h2 className="text-lg font-semibold text-gray-800">Green Tea</h2>
            <p className="text-gray-600">Stock: 120 units</p>
            <p className="text-gray-600">Price: $6.75</p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium px-6 py-2 rounded-lg transition">
            Add New Product
          </button>
        </div>
      </div>
    </div>
  );
}
