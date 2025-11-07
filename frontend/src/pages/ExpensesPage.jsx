import React from "react";

export default function ExpensesPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold text-yellow-600 mb-6">Expenses</h1>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Rent</h2>
          <p className="text-gray-600">$1,200 / month</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Utilities</h2>
          <p className="text-gray-600">$450 / month</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Supplies</h2>
          <p className="text-gray-600">$300 / month</p>
        </div>
      </div>
    </div>
  );
}
