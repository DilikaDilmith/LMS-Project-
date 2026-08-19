import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { courseAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AdminCourses = () => {
  const { user } = useAuth();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await courseAPI.getAll();
      setCourses(res.data || []);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (courseId) => {
    setActionLoading(courseId);
    try {
      await courseAPI.approve(courseId);
      toast.success('Course approved successfully!');
      await fetchCourses();
    } catch (error) {
      toast.error(error.response?.data || 'Failed to approve course');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (courseId) => {
    const reason = prompt('Enter rejection reason:');
    if (reason === null) return;
    if (!reason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    setActionLoading(courseId);
    try {
      await courseAPI.reject(courseId, reason);
      toast.success('Course rejected!');
      await fetchCourses();
    } catch (error) {
      toast.error(error.response?.data || 'Failed to reject course');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredCourses = courses.filter(c => {
    if (filter === 'ALL') return true;
    if (filter === 'PENDING') return c.status === 'PENDING_APPROVAL' || c.status === 'DRAFT';
    if (filter === 'APPROVED') return c.status === 'APPROVED';
    if (filter === 'REJECTED') return c.status === 'REJECTED';
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const pendingCount = courses.filter(c => c.status === 'PENDING_APPROVAL' || c.status === 'DRAFT').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="border-b border-slate-200 bg-white/90 px-4 py-4 shadow-sm backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-xl shadow-sm shadow-sky-200">
              📚
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-600">Institute administration</p>
              <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">Manage Courses</h1>
            </div>
          </div>
          <Link
            to="/dashboard"
            className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
          >
            <span aria-hidden="true">←</span> Dashboard
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:py-10">
        <div className="mb-8 max-w-2xl">
          <p className="mb-2 text-sm font-semibold text-sky-600">Course moderation</p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Shape the learning catalogue.</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">Review submitted courses, approve strong content, and give lecturers clear feedback when changes are needed.</p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between"><p className="text-sm font-medium text-slate-500">All courses</p><span className="rounded-lg bg-sky-50 px-2.5 py-1 text-lg">📚</span></div>
            <p className="mt-4 text-3xl font-bold text-slate-900">{courses.length}</p>
            <p className="mt-1 text-xs text-slate-400">In the institute catalogue</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm">
            <div className="flex items-start justify-between"><p className="text-sm font-medium text-amber-800">Needs review</p><span className="rounded-lg bg-amber-100 px-2.5 py-1 text-lg">⏳</span></div>
            <p className="mt-4 text-3xl font-bold text-amber-900">{pendingCount}</p>
            <p className="mt-1 text-xs text-amber-700/70">Pending or draft submissions</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm">
            <div className="flex items-start justify-between"><p className="text-sm font-medium text-emerald-800">Approved</p><span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-lg">✓</span></div>
            <p className="mt-4 text-3xl font-bold text-emerald-900">{courses.filter(c => c.status === 'APPROVED').length}</p>
            <p className="mt-1 text-xs text-emerald-700/70">Published for learners</p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 shadow-sm">
            <div className="flex items-start justify-between"><p className="text-sm font-medium text-rose-800">Rejected</p><span className="rounded-lg bg-rose-100 px-2.5 py-1 text-lg">!</span></div>
            <p className="mt-4 text-3xl font-bold text-rose-900">{courses.filter(c => c.status === 'REJECTED').length}</p>
            <p className="mt-1 text-xs text-rose-700/70">Returned for improvements</p>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h3 className="font-bold text-slate-900">Course catalogue</h3>
              <p className="mt-1 text-xs text-slate-500">{filteredCourses.length} course{filteredCourses.length === 1 ? '' : 's'} shown</p>
            </div>
            <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
            <button
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition ${filter === 'ALL' ? 'bg-sky-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              onClick={() => setFilter('ALL')}
            >
              All
            </button>
            <button
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition ${filter === 'PENDING' ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              onClick={() => setFilter('PENDING')}
            >
              Pending ({pendingCount})
            </button>
            <button
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition ${filter === 'APPROVED' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              onClick={() => setFilter('APPROVED')}
            >
              Approved
            </button>
            <button
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition ${filter === 'REJECTED' ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              onClick={() => setFilter('REJECTED')}
            >
              Rejected
            </button>
          </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-190 text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Course Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Lecturer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCourses.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400">No courses found for this filter</td>
                  </tr>
                ) : (
                  filteredCourses.map((course) => (
                    <tr key={course.id} className="transition hover:bg-sky-50/40">
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">#{course.id}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{course.name}</td>
                      <td className="px-6 py-4 text-slate-600">Lecturer #{course.lecturerId}</td>
                      <td className="px-6 py-4 text-slate-600">{course.durationWeeks} weeks</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          course.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                          course.status === 'PENDING_APPROVAL' ? 'border border-amber-300 bg-amber-100 text-amber-800' :
                          course.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {course.status ? course.status.replace('_', ' ') : 'DRAFT'}
                        </span>
                        {course.rejectionReason && (
                          <p className="mt-2 max-w-xs text-xs leading-4 text-rose-500">{course.rejectionReason}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {course.status !== 'APPROVED' && (
                            <button
                              onClick={() => handleApprove(course.id)}
                              disabled={actionLoading === course.id}
                              className={`rounded-lg px-3 py-1.5 text-xs font-bold text-white transition ${actionLoading === course.id ? 'bg-slate-400' : 'bg-emerald-600 shadow-sm hover:bg-emerald-700'}`}
                            >
                              {actionLoading === course.id ? '...' : 'Approve'}
                            </button>
                          )}
                          {course.status !== 'REJECTED' && (
                            <button
                              onClick={() => handleReject(course.id)}
                              disabled={actionLoading === course.id}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${actionLoading === course.id ? 'border-slate-200 bg-slate-100 text-slate-400' : 'border-rose-200 bg-white text-rose-600 hover:bg-rose-50'}`}
                            >
                              Reject
                            </button>
                          )}
                        </div>
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

export default AdminCourses;