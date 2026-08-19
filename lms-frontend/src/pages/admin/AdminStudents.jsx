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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="border-b border-slate-200 bg-white/90 px-4 py-4 shadow-sm backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xl shadow-sm shadow-blue-200">
              👨‍🎓
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Institute administration</p>
              <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">Manage Students</h1>
            </div>
          </div>
          <Link
            to="/dashboard"
            className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <span aria-hidden="true">←</span> Dashboard
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:py-10">
        <div className="mb-8 max-w-2xl">
          <p className="mb-2 text-sm font-semibold text-blue-600">Student directory</p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Keep your student roster moving.</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">Review registrations, approve new students, and manage account access from one place.</p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-slate-500">Total students</p>
              <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-lg">👥</span>
            </div>
            <p className="mt-4 text-3xl font-bold text-slate-900">{students.length}</p>
            <p className="mt-1 text-xs text-slate-400">Registered in your institute</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-amber-800">Pending review</p>
              <span className="rounded-lg bg-amber-100 px-2.5 py-1 text-lg">⏳</span>
            </div>
            <p className="mt-4 text-3xl font-bold text-amber-900">{pendingStudents.length}</p>
            <p className="mt-1 text-xs text-amber-700/70">Registration{pendingStudents.length === 1 ? '' : 's'} awaiting approval</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-emerald-800">Active access</p>
              <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-lg">✓</span>
            </div>
            <p className="mt-4 text-3xl font-bold text-emerald-900">{students.filter(s => s.status === 'ACTIVE').length}</p>
            <p className="mt-1 text-xs text-emerald-700/70">Students with active accounts</p>
          </div>
        </div>

        {/* Table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h3 className="font-bold text-slate-900">Student roster</h3>
              <p className="mt-1 text-xs text-slate-500">Manage registration status and account access.</p>
            </div>
            {pendingStudents.length > 0 && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
                {pendingStudents.length} pending approval{pendingStudents.length > 1 ? 's' : ''}
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
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400">No students found</td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="transition hover:bg-blue-50/40">
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">#{student.id}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{student.firstName} {student.lastName}</td>
                      <td className="px-6 py-4 text-slate-600">{student.email}</td>
                      <td className="px-6 py-4 text-slate-600">{student.phone || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          student.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                          student.status === 'PENDING' ? 'border border-amber-300 bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {student.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {student.status === 'PENDING' ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApprove(student.id)}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(student.id)}
                              className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-50 active:scale-95"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(student.id, student.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${student.status === 'ACTIVE' ? 'border-rose-200 text-rose-600 hover:bg-rose-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}
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
        </section>
      </main>
    </div>
  );
};

export default AdminStudents;