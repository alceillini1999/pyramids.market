import React from "react";

export default function Dashboard() {
  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-4 hidden md:block">
        <h2 className="text-xl font-bold mb-6">Dashboard</h2>
        <nav className="space-y-3">
          <a href="#" className="block text-gray-700 hover:text-pyramid-yellow">Home</a>
          <a href="#" className="block text-gray-700 hover:text-pyramid-yellow">Sales</a>
          <a href="#" className="block text-gray-700 hover:text-pyramid-yellow">Clients</a>
          <a href="#" className="block text-gray-700 hover:text-pyramid-yellow">Products</a>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 p-6">
        {/* Header */}
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Welcome to the Dashboard</h1>
          <button className="bg-pyramid-yellow hover:bg-yellow-400 text-white py-2 px-4 rounded">
            Logout
          </button>
        </header>

        {/* Body content */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded shadow p-4">
            <h3 className="font-bold text-gray-700">Total Sales</h3>
            <p className="text-2xl font-semibold">$12,430</p>
          </div>
          <div className="bg-white rounded shadow p-4">
            <h3 className="font-bold text-gray-700">Clients</h3>
            <p className="text-2xl font-semibold">87</p>
          </div>
          <div className="bg-white rounded shadow p-4">
            <h3 className="font-bold text-gray-700">Products</h3>
            <p className="text-2xl font-semibold">156</p>
          </div>
        </section>
      </div>
    </div>
  );
}
