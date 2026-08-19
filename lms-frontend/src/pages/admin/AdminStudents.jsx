import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AdminStudents = () => {
  const { user } = useAuth();
  const instituteId = user?.instituteId;

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await userAPI.getStudents(instituteId);
      setStudents(res.data || []);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await userAPI.approveUser(userId);
      toast.success('Student approved successfully! 🎉');
      fetchStudents();
    } catch (error) {
      console.error('Failed to approve student:', error);
      toast.error(error.response?.data || 'Failed to approve student');
    }
  };

  const handleReject = async (userId) => {
    try {
      await userAPI.rejectUser(userId);
      toast.success('Student registration rejected ❌');
      fetchStudents();
    } catch (error) {
      console.error('Failed to reject student:', error);
      toast.error(error.response?.data || 'Failed to reject student');
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await userAPI.updateUserStatus(userId, newStatus);
      toast.success(`Student status updated to ${newStatus}`);
      fetchStudents();
    } catch (error) {
      console.error('Failed to update student status:', error);
      toast.error('Failed to update student status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const pendingStudents = students.filter(s => s.status === 'PENDING');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">👨‍🎓 Manage Students</h1>
        <Link to="/dashboard" className="text-blue-600 hover:underline text-sm">← Back</Link>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <p className="text-sm text-gray-500">Total Students: <span className="font-bold text-gray-800">{students.length}</span></p>
          {pendingStudents.length > 0 && (
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-200">
              ⚠️ {pendingStudents.length} Pending Approval{pendingStudents.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-400">No students found</td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-3 text-gray-600">#{student.id}</td>
                      <td className="px-6 py-3 font-medium text-gray-800">{student.firstName} {student.lastName}</td>
                      <td className="px-6 py-3 text-gray-600">{student.email}</td>
                      <td className="px-6 py-3 text-gray-600">{student.phone || '-'}</td>
                      <td className="px-6 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          student.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                          student.status === 'PENDING' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {student.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        {student.status === 'PENDING' ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApprove(student.id)}
                              className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition active:scale-95"
                            >
                              Approve ✅
                            </button>
                            <button
                              onClick={() => handleReject(student.id)}
                              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition active:scale-95"
                            >
                              Reject ❌
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(student.id, student.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                            className={`text-xs font-medium ${student.status === 'ACTIVE' ? 'text-red-600 hover:underline' : 'text-green-600 hover:underline'}`}
                          >
                            {student.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
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

export default AdminStudents;