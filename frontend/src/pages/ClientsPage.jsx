// src/pages/ClientsPage.jsx
import React, { useEffect, useState } from "react";

export default function ClientsPage() {
  const [clients, setClients] = useState([]);

  // مؤقت: بيانات تجريبية — استبدل بجلب من API لاحقًا
  useEffect(() => {
    setClients([
      { _id: "1", name: "Ahmed Khaled", phone: "01012345678", email: "ahmed@example.com" },
      { _id: "2", name: "Sara Mostafa", phone: "01098765432", email: "sara@example.com" },
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-yellow-600">Clients</h1>
            <p className="text-sm text-gray-500">Manage your customers and their data</p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search clients..."
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg shadow">
              Add Client
            </button>
          </div>
        </header>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-yellow-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    No clients found
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{client.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{client.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{client.email}</td>
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
