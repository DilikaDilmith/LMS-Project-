import React from 'react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">LMS Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-700">Welcome, {user?.username} ({user?.role})</span>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </nav>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Dashboard</h3>
            <p className="text-gray-600">Welcome to the Learning Management System!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;