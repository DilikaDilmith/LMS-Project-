import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminReports = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">📊 Institute Reports</h1>
        <Link to="/dashboard" className="text-blue-600 hover:underline text-sm">← Back</Link>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Report Cards */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md transition">
            <div className="text-4xl mb-3">👨‍🎓</div>
            <h4 className="font-semibold text-gray-800">Student Report</h4>
            <p className="text-sm text-gray-500 mt-1">Student enrollment statistics</p>
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              Generate
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md transition">
            <div className="text-4xl mb-3">📚</div>
            <h4 className="font-semibold text-gray-800">Course Report</h4>
            <p className="text-sm text-gray-500 mt-1">Course completion statistics</p>
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              Generate
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md transition">
            <div className="text-4xl mb-3">💰</div>
            <h4 className="font-semibold text-gray-800">Payment Report</h4>
            <p className="text-sm text-gray-500 mt-1">Fee collection summary</p>
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              Generate
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md transition">
            <div className="text-4xl mb-3">📊</div>
            <h4 className="font-semibold text-gray-800">Attendance Report</h4>
            <p className="text-sm text-gray-500 mt-1">Student attendance summary</p>
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              Generate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;