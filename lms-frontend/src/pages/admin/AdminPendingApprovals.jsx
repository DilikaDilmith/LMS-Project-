import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AdminPendingApprovals = () => {
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const res = await userAPI.getPendingUsers();
      setPendingUsers(res.data || []);
    } catch (error) {
      console.error('Failed to fetch pending users:', error);
      toast.error('Failed to load pending registration requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      setActionLoading(userId);
      await userAPI.approveUser(userId);
      toast.success('User approved! They can now log in.');
      fetchPendingUsers();
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to approve user';
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId) => {
    if (!window.confirm('Reject this registration request? The user will not be able to log in.')) {
      return;
    }

    try {
      setActionLoading(userId);
      await userAPI.rejectUser(userId);
      toast.success('Registration rejected.');
      fetchPendingUsers();
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to reject user';
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleLabel = (role) => (role || '').replace('ROLE_', '');

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
        <div>
          <h1 className="text-xl font-bold text-amber-700">⏳ Pending User Approvals</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Review new student, lecturer, and parent registrations for your institute
          </p>
        </div>
        <Link to="/dashboard" className="text-blue-600 hover:underline text-sm">← Back to Dashboard</Link>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-amber-800">
            <strong>Important:</strong> Users cannot log in until you approve their account.
            After approval, they can sign in with the username and password they registered with.
          </p>
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            Institute: <span className="font-semibold text-gray-800">#{user?.instituteId || 'N/A'}</span>
          </p>
          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-200">
            {pendingUsers.length} Pending
          </span>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-dashed border-gray-200 p-10 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h2 className="text-lg font-bold text-gray-800">All caught up!</h2>
            <p className="text-sm text-gray-500 mt-2">There are no pending registration requests right now.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map((pendingUser) => (
              <div
                key={pendingUser.id}
                className="bg-white rounded-xl shadow-sm border border-amber-100 p-5 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {(pendingUser.firstName || pendingUser.username || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-gray-900">
                        {pendingUser.firstName} {pendingUser.lastName}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
                        {getRoleLabel(pendingUser.role)}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                        PENDING
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">@{pendingUser.username}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {pendingUser.email} {pendingUser.phone ? `· ${pendingUser.phone}` : ''}
                    </p>
                    {pendingUser.createdAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        Registered: {new Date(pendingUser.createdAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(pendingUser.id)}
                    disabled={actionLoading === pendingUser.id}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-bold px-4 py-2 rounded-lg shadow-sm transition"
                  >
                    {actionLoading === pendingUser.id ? 'Processing...' : 'Approve ✅'}
                  </button>
                  <button
                    onClick={() => handleReject(pendingUser.id)}
                    disabled={actionLoading === pendingUser.id}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-bold px-4 py-2 rounded-lg shadow-sm transition"
                  >
                    Reject ❌
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/admin/students"
            className="bg-white border border-gray-200 rounded-xl p-4 hover:border-teal-300 hover:shadow-sm transition text-center"
          >
            <div className="text-2xl mb-1">👨‍🎓</div>
            <span className="text-sm font-medium text-gray-700">Manage Students</span>
          </Link>
          <Link
            to="/admin/lecturers"
            className="bg-white border border-gray-200 rounded-xl p-4 hover:border-pink-300 hover:shadow-sm transition text-center"
          >
            <div className="text-2xl mb-1">👨‍🏫</div>
            <span className="text-sm font-medium text-gray-700">Manage Lecturers</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminPendingApprovals;
