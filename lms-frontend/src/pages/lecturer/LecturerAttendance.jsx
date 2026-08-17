import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { courseAPI, attendanceAPI } from '../../services/api';
import toast from 'react-hot-toast';

const LecturerAttendance = () => {
  const { user } = useAuth();
  const lecturerId = user?.id;

  const today = new Date().toISOString().split('T')[0];

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedDate, setSelectedDate] = useState(today);
  const [enrollments, setEnrollments] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (lecturerId) {
      fetchCourses();
    }
  }, [lecturerId]);

  useEffect(() => {
    if (selectedCourseId) {
      fetchCourseStudents(selectedCourseId);
    } else {
      setEnrollments([]);
      setAttendanceMap({});
    }
  }, [selectedCourseId, selectedDate]);

  const fetchCourses = async () => {
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
      if (list.length > 0) {
        setSelectedCourseId(String(list[0].id));
      }
    } catch (error) {
      console.warn('Primary fetch courses failed, attempting getAll fallback:', error);
      try {
        const allRes = await courseAPI.getAll();
        const list = allRes.data || [];
        setCourses(list);
        if (list.length > 0) {
          setSelectedCourseId(String(list[0].id));
        }
      } catch (err2) {
        console.error('All course fetch attempts failed:', err2);
        toast.error('Failed to load courses');
      }
    } finally {
      setLoadingCourses(false);
    }
  };


  const fetchCourseStudents = async (courseId) => {
    setLoadingStudents(true);
    try {
      const res = await courseAPI.getEnrollments(courseId);
      const list = res.data || [];
      setEnrollments(list);

      // Check if attendance already marked for date
      try {
        const attRes = await attendanceAPI.getByCourseAndDate(courseId, selectedDate);
        const existing = attRes.data || [];
        const initialMap = {};

        list.forEach((e) => {
          const match = existing.find((a) => String(a.studentId) === String(e.studentId));
          initialMap[e.studentId] = match ? match.status : 'PRESENT';
        });
        setAttendanceMap(initialMap);
      } catch {
        const initialMap = {};
        list.forEach((e) => {
          initialMap[e.studentId] = 'PRESENT';
        });
        setAttendanceMap(initialMap);
      }
    } catch (error) {
      console.error('Failed to load enrolled students:', error);
      toast.error('Failed to load enrolled students');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedCourseId) {
      toast.error('Please select a course');
      return;
    }
    if (enrollments.length === 0) {
      toast.error('No enrolled students in this course');
      return;
    }

    setSaving(true);
    try {
      await attendanceAPI.mark(
        parseInt(selectedCourseId),
        selectedDate,
        attendanceMap,
        parseInt(lecturerId)
      );
      toast.success('Attendance recorded successfully! 📅');
    } catch (error) {
      console.error('Save attendance error:', error);
      toast.error(error.response?.data || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  if (loadingCourses) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading courses...</p>
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
          <h1 className="text-xl font-bold text-slate-800">📅 Mark Student Attendance</h1>
        </div>
        <button
          onClick={handleSaveAttendance}
          disabled={saving || enrollments.length === 0}
          className="px-5 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white text-sm font-semibold rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
        >
          {saving ? 'Saving...' : 'Save Attendance 💾'}
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-4 mt-8">
        {/* Controls Bar */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Teaching Course
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              {courses.length === 0 ? (
                <option value="">No courses available</option>
              ) : (
                courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Attendance Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
        </div>

        {/* Student Attendance List */}
        {loadingStudents ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500 mx-auto"></div>
            <p className="mt-3 text-slate-500 text-sm">Loading enrolled students...</p>
          </div>
        ) : enrollments.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
            <div className="text-4xl mb-3">👨‍🎓</div>
            <h3 className="text-lg font-bold text-slate-800">No Enrolled Students</h3>
            <p className="text-slate-500 text-sm mt-1">
              There are no students enrolled in this course yet.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Enrolled Students ({enrollments.length})
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Mark status for {selectedDate}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {enrollments.map((e) => {
                const currentStatus = attendanceMap[e.studentId] || 'PRESENT';

                return (
                  <div
                    key={e.studentId}
                    className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        {e.studentName || `Student #${e.studentId}`}
                      </h4>
                      <p className="text-xs text-slate-400">ID: #{e.studentId}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(e.studentId, 'PRESENT')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          currentStatus === 'PRESENT'
                            ? 'bg-green-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        ✓ PRESENT
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(e.studentId, 'ABSENT')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          currentStatus === 'ABSENT'
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        ✕ ABSENT
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(e.studentId, 'LATE')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          currentStatus === 'LATE'
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        ⏰ LATE
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LecturerAttendance;
