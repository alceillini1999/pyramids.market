import React from "react";

export default function OverviewPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-yellow-600">Overview</h1>
        <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg shadow">
          Refresh
        </button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-gray-700 text-lg font-semibold mb-2">Total Sales</h3>
          <p className="text-3xl font-bold text-yellow-600">$18,245</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-gray-700 text-lg font-semibold mb-2">Active Clients</h3>
          <p className="text-3xl font-bold text-yellow-600">134</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-gray-700 text-lg font-semibold mb-2">Stocked Products</h3>
          <p className="text-3xl font-bold text-yellow-600">298</p>
        </div>
      </section>

      <section className="mt-10 bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
        <ul className="space-y-2 text-gray-600">
          <li>- New client added: Ahmed Khaled</li>
          <li>- Sa
