import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { courseAPI, assignmentAPI } from '../../services/api';
import toast from 'react-hot-toast';

const LecturerAssignments = () => {
  const { user } = useAuth();
  const lecturerId = user?.id;

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxMarks: 100,
  });

  useEffect(() => {
    if (lecturerId) {
      fetchCourses();
    }
  }, [lecturerId]);

  useEffect(() => {
    if (selectedCourseId) {
      fetchAssignments(selectedCourseId);
    } else {
      setAssignments([]);
    }
  }, [selectedCourseId]);

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


  const fetchAssignments = async (courseId) => {
    setLoadingAssignments(true);
    try {
      const res = await assignmentAPI.getByCourse(courseId);
      setAssignments(res.data || []);
    } catch (error) {
      console.error('Failed to load assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) {
      toast.error('Please select a course');
      return;
    }
    if (!formData.title.trim()) {
      toast.error('Please enter an assignment title');
      return;
    }
    if (!formData.dueDate) {
      toast.error('Please select a due date');
      return;
    }

    setCreating(true);
    try {
      let formattedDueDate = formData.dueDate;
      if (formattedDueDate && !formattedDueDate.includes('T')) {
        formattedDueDate = `${formattedDueDate}T23:59:59`;
      }

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        dueDate: formattedDueDate,
        maxMarks: parseInt(formData.maxMarks) || 100,
        courseId: parseInt(selectedCourseId),
        lecturerId: lecturerId ? parseInt(lecturerId) : null,
      };

      await assignmentAPI.create(payload);
      toast.success('Assignment created successfully! 🎉');
      setShowCreateModal(false);
      setFormData({ title: '', description: '', dueDate: '', maxMarks: 100 });
      await fetchAssignments(selectedCourseId);
    } catch (error) {

      console.error('Create assignment error:', error);
      toast.error(error.response?.data || 'Failed to create assignment');
    } finally {
      setCreating(false);
    }
  };

  if (loadingCourses) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading your courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12 text-slate-900">
      {/* Navbar */}
      <nav className="border-b border-slate-200 bg-white/90 px-4 py-4 shadow-sm backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xl shadow-sm shadow-blue-200">📝</div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Teaching workspace</p>
              <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">Assignments</h1>
            </div>
          </div>
          <Link to="/dashboard" className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
            <span aria-hidden="true">←</span> Dashboard
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:py-10">
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="mb-2 text-sm font-semibold text-blue-600">Coursework management</p>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Design work that moves learning forward.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">Create purposeful assignments, set expectations, and keep submissions ready for grading.</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={courses.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span aria-hidden="true">+</span> Create assignment
          </button>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between"><p className="text-sm font-medium text-slate-500">Teaching courses</p><span className="rounded-lg bg-blue-50 px-2.5 py-1 text-lg">📚</span></div>
            <p className="mt-4 text-3xl font-bold text-slate-900">{courses.length}</p>
            <p className="mt-1 text-xs text-slate-400">Courses available to manage</p>
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5 shadow-sm">
            <div className="flex items-start justify-between"><p className="text-sm font-medium text-indigo-800">Current assignments</p><span className="rounded-lg bg-indigo-100 px-2.5 py-1 text-lg">📝</span></div>
            <p className="mt-4 text-3xl font-bold text-indigo-900">{assignments.length}</p>
            <p className="mt-1 text-xs text-indigo-700/70">For the selected course</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm">
            <div className="flex items-start justify-between"><p className="text-sm font-medium text-emerald-800">Selected course</p><span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-lg">✓</span></div>
            <p className="mt-4 truncate text-xl font-bold text-emerald-900">{courses.find((course) => String(course.id) === String(selectedCourseId))?.name || 'None selected'}</p>
            <p className="mt-1 text-xs text-emerald-700/70">Active management view</p>
          </div>
        </div>

        {/* Course Selector & Banner */}
        <section className="mb-8 flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Course context</p>
            <h3 className="mt-1 text-lg font-bold text-slate-900">Select a teaching course</h3>
            <p className="mt-1 text-sm text-slate-500">Choose a course to view and manage its coursework.</p>
          </div>

          <div className="w-full md:w-80">
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
        </section>

        {/* Assignments List */}
        {loadingAssignments ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-3 text-slate-500 text-sm">Loading course assignments...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-4xl">📝</div>
            <h3 className="mt-5 text-lg font-bold text-slate-800">No assignments yet</h3>
            <p className="mb-6 mt-1 text-sm text-slate-500">
              Create your first assignment for this course so students can submit their work.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              + Create First Assignment
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      Max Marks: {assignment.maxMarks ?? 100}
                    </span>
                      <span className="text-xs font-medium text-slate-500">
                      Due {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">{assignment.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-500">
                    {assignment.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to="/lecturer/grading"
                    className="w-full rounded-lg bg-slate-100 py-2.5 text-center text-xs font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                  >
                    Grade Submissions →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-100">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-800">➕ Create Assignment</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assignment Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Mid-term Project Submission"
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Instructions
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="4"
                  placeholder="Provide detailed submission instructions..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Max Marks
                  </label>
                  <input
                    type="number"
                    value={formData.maxMarks}
                    onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })}
                    min="1"
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Assignment'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LecturerAssignments;
