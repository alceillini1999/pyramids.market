// src/pages/ExpensesPage.jsx
import React, { useEffect, useState } from "react";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);

  // بيانات تجريبية مؤقتة — استبدل بجلب من API لاحقاً
  useEffect(() => {
    setExpenses([
      { _id: "1", description: "Rent", amount: 1200, date: "2025-10-01" },
      { _id: "2", description: "Utilities", amount: 450, date: "2025-10-05" },
      { _id: "3", description: "Supplies", amount: 300, date: "2025-10-10" },
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-yellow-600">Expenses</h1>
            <p className="text-sm text-gray-500">Track your business expenses</p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search expenses..."
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg shadow">
              Add Expense
            </button>
          </div>
        </header>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-yellow-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    No expenses found
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{expense.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${expense.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 mr-2">Edit</button>
                      <button className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
