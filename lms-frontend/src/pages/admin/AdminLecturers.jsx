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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="border-b border-slate-200 bg-white/90 px-4 py-4 shadow-sm backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-xl shadow-sm shadow-indigo-200">
              👨‍🏫
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Institute administration</p>
              <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">Manage Lecturers</h1>
            </div>
          </div>
          <Link
            to="/dashboard"
            className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
          >
            <span aria-hidden="true">←</span> Dashboard
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:py-10">
        <div className="mb-8 max-w-2xl">
          <p className="mb-2 text-sm font-semibold text-indigo-600">Teaching directory</p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Build a trusted teaching team.</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">Review lecturer registrations, confirm teaching staff, and manage access to the institute workspace.</p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-slate-500">Total lecturers</p>
              <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-lg">👨‍🏫</span>
            </div>
            <p className="mt-4 text-3xl font-bold text-slate-900">{lecturers.length}</p>
            <p className="mt-1 text-xs text-slate-400">Teaching staff in your institute</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-amber-800">Pending review</p>
              <span className="rounded-lg bg-amber-100 px-2.5 py-1 text-lg">⏳</span>
            </div>
            <p className="mt-4 text-3xl font-bold text-amber-900">{pendingLecturers.length}</p>
            <p className="mt-1 text-xs text-amber-700/70">Registration{pendingLecturers.length === 1 ? '' : 's'} awaiting approval</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-emerald-800">Active staff</p>
              <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-lg">✓</span>
            </div>
            <p className="mt-4 text-3xl font-bold text-emerald-900">{lecturers.filter(l => l.status === 'ACTIVE').length}</p>
            <p className="mt-1 text-xs text-emerald-700/70">Lecturers with active access</p>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h3 className="font-bold text-slate-900">Lecturer roster</h3>
              <p className="mt-1 text-xs text-slate-500">Manage registration status and teaching access.</p>
            </div>
            {pendingLecturers.length > 0 && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
                {pendingLecturers.length} pending approval{pendingLecturers.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-190 text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Specialization</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lecturers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400">No lecturers found</td>
                  </tr>
                ) : (
                  lecturers.map((lecturer) => (
                    <tr key={lecturer.id} className="transition hover:bg-indigo-50/40">
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">#{lecturer.id}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{lecturer.firstName} {lecturer.lastName}</td>
                      <td className="px-6 py-4 text-slate-600">{lecturer.email}</td>
                      <td className="px-6 py-4 text-slate-600">{lecturer.specialization || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          lecturer.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                          lecturer.status === 'PENDING' ? 'border border-amber-300 bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {lecturer.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {lecturer.status === 'PENDING' ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApprove(lecturer.id)}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(lecturer.id)}
                              className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-50 active:scale-95"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(lecturer.id, lecturer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${lecturer.status === 'ACTIVE' ? 'border-rose-200 text-rose-600 hover:bg-rose-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}
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
        </section>
      </main>
    </div>
  );
};

export default AdminLecturers;