import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';
import toast from 'react-hot-toast';

const InstituteAdminDashboard = ({ data }) => {
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await userAPI.getPendingUsers();
      setPendingUsers(res.data || []);
    } catch (error) {
      console.error('Failed to fetch pending users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await userAPI.approveUser(userId);
      toast.success('User registration approved successfully! 🎉');
      fetchPendingUsers();
    } catch (error) {
      console.error('Failed to approve user:', error);
      toast.error(error.response?.data?.error || error.response?.data || 'Failed to approve user');
    }
  };

  const handleReject = async (userId) => {
    try {
      await userAPI.rejectUser(userId);
      toast.success('User registration rejected ❌');
      fetchPendingUsers();
    } catch (error) {
      console.error('Failed to reject user:', error);
      toast.error(error.response?.data?.error || error.response?.data || 'Failed to reject user');
    }
  };

  return (
    <div className="space-y-8">
      {/* Institute Overview Stats */}
      <section>
        <h3 className="text-lg font-bold text-gray-800 mb-4">Institute Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-teal-500">
            <p className="text-sm text-gray-500 font-medium">Students</p>
            <p className="text-3xl font-bold text-teal-600 mt-1">{data?.totalStudents || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-pink-500">
            <p className="text-sm text-gray-500 font-medium">Lecturers</p>
            <p className="text-3xl font-bold text-pink-600 mt-1">{data?.totalLecturers || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-orange-500">
            <p className="text-sm text-gray-500 font-medium">Courses</p>
            <p className="text-3xl font-bold text-orange-600 mt-1">{data?.totalCourses || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-amber-500">
            <p className="text-sm text-gray-500 font-medium">Pending Approvals</p>
            <p className="text-3xl font-bold text-amber-600 mt-1">{pendingUsers.length || data?.pendingApprovals || 0}</p>
          </div>
        </div>
      </section>

      {/* Pending User Registrations Section */}
      <section className="bg-white rounded-2xl shadow-sm border border-amber-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span>⏳ Pending User Registrations</span>
              {pendingUsers.length > 0 && (
                <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {pendingUsers.length}
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Review and approve new student/lecturer registration requests for your institute.
            </p>
          </div>
          <button
            onClick={fetchPendingUsers}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
          >
            🔄 Refresh
          </button>
        </div>

        {loadingUsers ? (
          <div className="py-8 text-center text-gray-400 text-sm">Loading pending registrations...</div>
        ) : pendingUsers.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-500 text-sm border border-dashed border-gray-200">
            🎉 No pending registration requests right now. All users have been approved!
          </div>
        ) : (
          <div className="space-y-3">
            {pendingUsers.map((pendingUser) => (
              <div
                key={pendingUser.id}
                className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-amber-100 bg-amber-50/40 hover:bg-amber-50 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">
                      {pendingUser.firstName} {pendingUser.lastName}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
                      {pendingUser.role?.replace('ROLE_', '') || 'USER'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Email: <span className="font-medium text-gray-700">{pendingUser.email}</span> · Phone: <span className="font-medium text-gray-700">{pendingUser.phone || 'N/A'}</span> · Username: <span className="font-medium text-gray-700">@{pendingUser.username}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(pendingUser.id)}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition active:scale-95 flex items-center gap-1"
                  >
                    Approve ✅
                  </button>
                  <button
                    onClick={() => handleReject(pendingUser.id)}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition active:scale-95 flex items-center gap-1"
                  >
                    Reject ❌
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Institute Management Quick Actions */}
      <section>
        <h3 className="text-lg font-bold text-gray-800 mb-4">Institute Management</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link
            to="/admin/students"
            className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md border border-gray-100 text-center hover:border-teal-300 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">👨‍🎓</div>
            <span className="text-sm font-semibold text-gray-700">Students</span>
          </Link>
          <Link
            to="/admin/lecturers"
            className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md border border-gray-100 text-center hover:border-pink-300 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">👨‍🏫</div>
            <span className="text-sm font-semibold text-gray-700">Lecturers</span>
          </Link>
          <Link
            to="/admin/courses"
            className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md border border-gray-100 text-center hover:border-orange-300 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">📚</div>
            <span className="text-sm font-semibold text-gray-700">Approve Courses</span>
          </Link>
          <Link
            to="/admin/reports"
            className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md border border-gray-100 text-center hover:border-indigo-300 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">📊</div>
            <span className="text-sm font-semibold text-gray-700">Reports</span>
          </Link>
          <Link
            to="/announcements"
            className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md border border-gray-100 text-center hover:border-blue-300 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">📢</div>
            <span className="text-sm font-semibold text-gray-700">Announcements</span>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default InstituteAdminDashboard;