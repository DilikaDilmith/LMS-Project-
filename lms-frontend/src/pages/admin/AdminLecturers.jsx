import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AdminLecturers = () => {
  const { user } = useAuth();
  const instituteId = user?.instituteId;

  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLecturers();
  }, []);

  const fetchLecturers = async () => {
    try {
      const res = await userAPI.getLecturers(instituteId);
      setLecturers(res.data || []);
    } catch (error) {
      console.error('Failed to fetch lecturers:', error);
      toast.error('Failed to load lecturers');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">👨‍🏫 Manage Lecturers</h1>
        <Link to="/dashboard" className="text-blue-600 hover:underline text-sm">← Back</Link>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <p className="text-sm text-gray-500">Total Lecturers: <span className="font-bold text-gray-800">{lecturers.length}</span></p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specialization</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lecturers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-400">No lecturers found</td>
                  </tr>
                ) : (
                  lecturers.map((lecturer) => (
                    <tr key={lecturer.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-3 text-gray-600">#{lecturer.id}</td>
                      <td className="px-6 py-3 font-medium text-gray-800">{lecturer.firstName} {lecturer.lastName}</td>
                      <td className="px-6 py-3 text-gray-600">{lecturer.email}</td>
                      <td className="px-6 py-3 text-gray-600">{lecturer.specialization || '-'}</td>
                      <td className="px-6 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${lecturer.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {lecturer.status}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View</button>
                        <span className="text-gray-300 mx-2">|</span>
                        <button className="text-red-600 hover:text-red-800 text-sm font-medium">Deactivate</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLecturers;