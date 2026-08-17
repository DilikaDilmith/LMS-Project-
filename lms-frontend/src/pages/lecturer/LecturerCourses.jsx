import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { courseAPI } from '../../services/api';
import toast from 'react-hot-toast';

const LecturerCourses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const lecturerId = user?.id;

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);

  useEffect(() => {
    if (lecturerId) {
      fetchLecturerCourses();
    }
  }, [lecturerId]);

  const fetchLecturerCourses = async () => {
    setLoading(true);
    try {
      let list = [];
      if (lecturerId) {
        const res = await courseAPI.getCoursesByLecturer(lecturerId);
        list = res.data || [];
      }
      if (list.length === 0) {
        const allRes = await courseAPI.getAll();
        list = allRes.data || [];
      }
      setCourses(list);
    } catch (error) {
      console.warn('Primary fetch courses failed, attempting getAll fallback:', error);
      try {
        const allRes = await courseAPI.getAll();
        setCourses(allRes.data || []);
      } catch (err2) {
        console.error('All course fetch attempts failed:', err2);
        toast.error('Failed to load courses');
      }
    } finally {
      setLoading(false);
    }
  };


  const handleSubmitForApproval = async (courseId) => {
    setSubmittingId(courseId);
    try {
      await courseAPI.submit(courseId);
      toast.success('Course submitted for Institute Admin approval!');
      await fetchLecturerCourses();
    } catch (error) {
      const errorMsg = error.response?.data || 'Failed to submit course for approval';
      toast.error(errorMsg);
    } finally {
      setSubmittingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT':
        return <span className="text-xs font-bold px-3 py-1 bg-amber-100 text-amber-800 rounded-full">📝 DRAFT</span>;
      case 'PENDING_APPROVAL':
        return <span className="text-xs font-bold px-3 py-1 bg-blue-100 text-blue-800 rounded-full">⏳ PENDING APPROVAL</span>;
      case 'APPROVED':
        return <span className="text-xs font-bold px-3 py-1 bg-green-100 text-green-800 rounded-full">✅ APPROVED</span>;
      case 'REJECTED':
        return <span className="text-xs font-bold px-3 py-1 bg-red-100 text-red-800 rounded-full">❌ REJECTED</span>;
      default:
        return <span className="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading your teaching courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-slate-500 hover:text-slate-800 text-sm">
            ← Dashboard
          </Link>
          <h1 className="text-xl font-bold text-slate-800">📚 My Teaching Courses</h1>
        </div>
        <Link
          to="/lecturer/create-course"
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition flex items-center gap-1.5"
        >
          + Create New Course
        </Link>
      </nav>

      <div className="max-w-6xl mx-auto px-4 mt-8">
        {/* Banner */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg mb-8">
          <h2 className="text-2xl font-extrabold">Course Management Hub</h2>
          <p className="text-purple-200 text-sm mt-1">
            Create courses, manage module content, and submit draft courses for institute admin review.
          </p>
        </div>

        {/* Courses List */}
        {courses.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
            <div className="text-4xl mb-3">📚</div>
            <h3 className="text-lg font-bold text-slate-800">No Courses Created Yet</h3>
            <p className="text-slate-500 text-sm mt-1 mb-6">
              You haven't authored any courses. Start creating your first course today!
            </p>
            <Link
              to="/lecturer/create-course"
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl shadow-md transition inline-flex items-center gap-2"
            >
              + Create Your First Course
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg">
                      {course.durationWeeks ? `${course.durationWeeks} Weeks` : 'Self-Paced'}
                    </span>
                    {getStatusBadge(course.status)}
                  </div>

                  <h3 className="text-lg font-bold text-slate-800">{course.name}</h3>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                    {course.description || 'No description provided.'}
                  </p>

                  {course.status === 'REJECTED' && course.rejectionReason && (
                    <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                      <strong>Rejection Reason:</strong> {course.rejectionReason}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                  {course.status === 'DRAFT' && (
                    <button
                      onClick={() => handleSubmitForApproval(course.id)}
                      disabled={submittingId === course.id}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50"
                    >
                      {submittingId === course.id ? 'Submitting...' : '📤 Submit for Approval'}
                    </button>
                  )}

                  <Link
                    to={`/courses/${course.id}`}
                    className="block w-full text-center py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                  >
                    View Course Details 📖
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LecturerCourses;
