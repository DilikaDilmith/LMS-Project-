import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { courseAPI } from '../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const StudentCourses = () => {
  const { user } = useAuth();
  const studentId = user?.id;

  const [approvedCourses, setApprovedCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, [studentId]);

  const fetchCourses = async () => {
    setLoading(true);
    let approvedSuccess = false;
    let enrolledSuccess = false;

    try {
      // 1. Fetch approved courses
      try {
        const approvedRes = await courseAPI.getApproved();
        setApprovedCourses(approvedRes.data || []);
        approvedSuccess = true;
      } catch (err) {
        console.error('Failed to fetch approved courses:', err);
      }

      // 2. Fetch enrolled courses if studentId exists
      if (studentId) {
        try {
          const enrolledRes = await courseAPI.getEnrolled(studentId);
          setEnrolledCourses(enrolledRes.data || []);
          enrolledSuccess = true;
        } catch (err) {
          console.error('Failed to fetch enrolled courses:', err);
        }
      } else {
        enrolledSuccess = true;
      }

      if (!approvedSuccess && !enrolledSuccess) {
        toast.error('Failed to load courses');
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId) => {
    setEnrolling(courseId);
    try {
      await courseAPI.enroll(courseId, studentId);
      toast.success('Successfully enrolled in course!');
      // Refresh enrolled courses
      const enrolledRes = await courseAPI.getEnrolled(studentId);
      setEnrolledCourses(enrolledRes.data || []);
    } catch (error) {
      const errorMsg = error.response?.data || 'Failed to enroll!';
      toast.error(errorMsg);
    } finally {
      setEnrolling(null);
    }
  };

  const isEnrolled = (courseId) => {
    return enrolledCourses.some(c => c.id === courseId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">📚 My Courses</h1>
        <Link to="/dashboard" className="text-blue-600 hover:underline">
          ← Back to Dashboard
        </Link>
      </nav>

      <div className="p-6">
        {/* Enrolled Courses */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">✅ My Enrolled Courses</h2>
          {enrolledCourses.length === 0 ? (
            <p className="text-gray-500">You haven't enrolled in any courses yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course) => (
                <div key={course.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                  <h3 className="text-lg font-bold text-gray-800">{course.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{course.description?.substring(0, 100)}...</p>
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Enrolled</span>
                    <Link to={`/courses/${course.id}`} className="text-blue-600 hover:underline text-sm">
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Courses */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">📖 Available Courses</h2>
          {approvedCourses.length === 0 ? (
            <p className="text-gray-500">No courses available at the moment.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {approvedCourses.map((course) => {
                const enrolled = isEnrolled(course.id);
                return (
                  <div key={course.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                    <h3 className="text-lg font-bold text-gray-800">{course.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{course.description?.substring(0, 100)}...</p>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {course.durationWeeks} weeks
                      </span>
                      {enrolled ? (
                        <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">Enrolled</span>
                      ) : (
                        <button
                          onClick={() => handleEnroll(course.id)}
                          disabled={enrolling === course.id}
                          className={`px-4 py-1 rounded-md text-sm transition ${
                            enrolling === course.id
                              ? 'bg-gray-400 text-white cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {enrolling === course.id ? 'Enrolling...' : 'Enroll'}
                        </button>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                      <Link to={`/courses/${course.id}`} className="text-blue-600 hover:underline text-xs font-semibold">
                        View Details →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentCourses;