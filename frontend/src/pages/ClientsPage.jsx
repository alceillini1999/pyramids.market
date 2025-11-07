import React, { useEffect, useState } from "react";
import { API_URL } from "../constants/api";

export default function ClientsPage() {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/clients`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setClients(data);
      } catch (err) {
        console.error("Failed to load clients", err);
      }
    };

    fetchClients();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-yellow-600">Clients</h1>
        <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg shadow">
          Add Client
        </button>
      </header>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-yellow-100 text-gray-700">
              <th className="py-3 px-4 text-left">Name</th>
              <th className="py-3 px-4 text-left">Phone</th>
              <th className="py-3 px-4 text-left">Email</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client._id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{client.name}</td>
                <td className="py-3 px-4">{client.phone}</td>
                <td className="py-3 px-4">{client.email}</td>
                <td className="py-3 px-4 space-x-2">
                  <button className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
                    Edit
                  </button>
                  <button className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-6 text-gray-500">
                  No clients found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
