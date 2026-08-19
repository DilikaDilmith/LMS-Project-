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

  const handleApprove = async (userId) => {
    try {
      await userAPI.approveUser(userId);
      toast.success('Lecturer approved successfully! 🎉');
      fetchLecturers();
    } catch (error) {
      console.error('Failed to approve lecturer:', error);
      toast.error(error.response?.data || 'Failed to approve lecturer');
    }
  };

  const handleReject = async (userId) => {
    try {
      await userAPI.rejectUser(userId);
      toast.success('Lecturer registration rejected ❌');
      fetchLecturers();
    } catch (error) {
      console.error('Failed to reject lecturer:', error);
      toast.error(error.response?.data || 'Failed to reject lecturer');
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await userAPI.updateUserStatus(userId, newStatus);
      toast.success(`Lecturer status updated to ${newStatus}`);
      fetchLecturers();
    } catch (error) {
      console.error('Failed to update lecturer status:', error);
      toast.error('Failed to update lecturer status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const pendingLecturers = lecturers.filter(l => l.status === 'PENDING');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">👨‍🏫 Manage Lecturers</h1>
        <Link to="/dashboard" className="text-blue-600 hover:underline text-sm">← Back</Link>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <p className="text-sm text-gray-500">Total Lecturers: <span className="font-bold text-gray-800">{lecturers.length}</span></p>
          {pendingLecturers.length > 0 && (
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-200">
              ⚠️ {pendingLecturers.length} Pending Approval{pendingLecturers.length > 1 ? 's' : ''}
            </span>
          )}
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
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          lecturer.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                          lecturer.status === 'PENDING' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {lecturer.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        {lecturer.status === 'PENDING' ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApprove(lecturer.id)}
                              className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition active:scale-95"
                            >
                              Approve ✅
                            </button>
                            <button
                              onClick={() => handleReject(lecturer.id)}
                              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition active:scale-95"
                            >
                              Reject ❌
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(lecturer.id, lecturer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                            className={`text-xs font-medium ${lecturer.status === 'ACTIVE' ? 'text-red-600 hover:underline' : 'text-green-600 hover:underline'}`}
                          >
                            {lecturer.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
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