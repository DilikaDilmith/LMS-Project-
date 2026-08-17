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
    if (filter === 'PENDING') return c.status === 'PENDING_APPROVAL';
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

  const pendingCount = courses.filter(c => c.status === 'PENDING_APPROVAL').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">📚 Manage Courses</h1>
        <Link to="/dashboard" className="text-blue-600 hover:underline text-sm">← Back</Link>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats & Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-4 text-sm">
            <span className="text-gray-500">Total: <span className="font-bold text-gray-800">{courses.length}</span></span>
            <span className="text-yellow-600">Pending: <span className="font-bold">{pendingCount}</span></span>
            <span className="text-green-600">Approved: <span className="font-bold">{courses.filter(c => c.status === 'APPROVED').length}</span></span>
            <span className="text-red-600">Rejected: <span className="font-bold">{courses.filter(c => c.status === 'REJECTED').length}</span></span>
          </div>
          <div className="flex gap-2">
            <button
              className={`px-3 py-1 rounded-lg text-sm font-medium ${filter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              onClick={() => setFilter('ALL')}
            >
              All
            </button>
            <button
              className={`px-3 py-1 rounded-lg text-sm font-medium ${filter === 'PENDING' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              onClick={() => setFilter('PENDING')}
            >
              Pending
            </button>
            <button
              className={`px-3 py-1 rounded-lg text-sm font-medium ${filter === 'APPROVED' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              onClick={() => setFilter('APPROVED')}
            >
              Approved
            </button>
            <button
              className={`px-3 py-1 rounded-lg text-sm font-medium ${filter === 'REJECTED' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              onClick={() => setFilter('REJECTED')}
            >
              Rejected
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lecturer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCourses.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-400">No courses found</td>
                  </tr>
                ) : (
                  filteredCourses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-3 text-gray-600">#{course.id}</td>
                      <td className="px-6 py-3 font-medium text-gray-800">{course.name}</td>
                      <td className="px-6 py-3 text-gray-600">Lecturer #{course.lecturerId}</td>
                      <td className="px-6 py-3 text-gray-600">{course.durationWeeks} weeks</td>
                      <td className="px-6 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          course.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                          course.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-700' :
                          course.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {course.status.replace('_', ' ')}
                        </span>
                        {course.rejectionReason && (
                          <p className="text-xs text-red-500 mt-1">{course.rejectionReason}</p>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {course.status === 'PENDING_APPROVAL' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(course.id)}
                              disabled={actionLoading === course.id}
                              className={`px-3 py-1 rounded-lg text-white text-xs font-medium ${actionLoading === course.id ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
                            >
                              {actionLoading === course.id ? '...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleReject(course.id)}
                              disabled={actionLoading === course.id}
                              className={`px-3 py-1 rounded-lg text-white text-xs font-medium ${actionLoading === course.id ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'}`}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {course.status !== 'PENDING_APPROVAL' && (
                          <span className="text-xs text-gray-400">No action</span>
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

export default AdminCourses;