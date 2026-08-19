import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { courseAPI, moduleAPI } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// Curated aesthetic gradients for course card thumbnail banners
const CARD_GRADIENTS = [
  'from-blue-600 via-indigo-600 to-violet-700',
  'from-sky-500 via-blue-600 to-indigo-800',
  'from-indigo-600 via-purple-600 to-pink-600',
  'from-teal-500 via-emerald-600 to-cyan-700',
  'from-slate-800 via-indigo-900 to-blue-950',
];

const StudentCourses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const studentId = user?.id;

  // Data states
  const [approvedCourses, setApprovedCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);

  // Filter & Search states
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'enrolled' | 'explore'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default'); // 'default' | 'name' | 'duration'

  // Quick Preview Modal State
  const [previewCourse, setPreviewCourse] = useState(null);
  const [previewModules, setPreviewModules] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, [studentId]);

  const fetchCourses = async () => {
    setLoading(true);
    let approvedSuccess = false;
    let enrolledSuccess = false;

    try {
      // 1. Fetch approved courses (all available courses)
      let approvedList = [];
      try {
        const approvedRes = await courseAPI.getApproved();
        approvedList = Array.isArray(approvedRes.data) ? approvedRes.data : [];
        setApprovedCourses(approvedList);
        approvedSuccess = true;
      } catch (err) {
        console.error('Failed to fetch approved courses:', err);
      }

      // Map of all courses by ID for easy lookup
      const coursesMap = new Map();
      approvedList.forEach((c) => coursesMap.set(String(c.id), c));

      // 2. Fetch enrolled courses for the student
      if (studentId) {
        try {
          const enrolledRes = await courseAPI.getEnrolled(studentId);
          const rawEnrolled = Array.isArray(enrolledRes.data) ? enrolledRes.data : [];

          // Normalize enrolled items: ensure courseId, name, and description are merged from full course
          const normalizedEnrolled = rawEnrolled.map((item) => {
            const cId = item.courseId || item.id;
            const fullCourse = coursesMap.get(String(cId)) || {};
            return {
              ...fullCourse,
              ...item,
              id: cId,
              name: item.name || item.courseName || fullCourse.name || item.title || `Course #${cId}`,
              description:
                item.description ||
                fullCourse.description ||
                'Comprehensive curriculum with lessons, video materials, and practical assessments.',
              durationWeeks: item.durationWeeks || fullCourse.durationWeeks || null,
            };
          });

          setEnrolledCourses(normalizedEnrolled);
          enrolledSuccess = true;
        } catch (err) {
          console.error('Failed to fetch enrolled courses:', err);
        }
      } else {
        enrolledSuccess = true;
      }

      if (!approvedSuccess && !enrolledSuccess) {
        toast.error('Failed to load course catalogue');
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId) => {
    if (!studentId) {
      toast.error('Please log in to enroll');
      return;
    }
    setEnrolling(courseId);
    try {
      await courseAPI.enroll(courseId, studentId);
      toast.success('🎉 Successfully enrolled in course!');
      await fetchCourses();
      if (previewCourse?.id === courseId) {
        setPreviewCourse(null);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data || 'Failed to enroll in course!';
      toast.error(errorMsg);
    } finally {
      setEnrolling(null);
    }
  };

  // Helper to check enrollment
  const isEnrolled = (courseId) => {
    return enrolledCourses.some((c) => String(c.id) === String(courseId) || String(c.courseId) === String(courseId));
  };

  // Open Quick Preview Modal
  const handleOpenPreview = async (course) => {
    setPreviewCourse(course);
    setLoadingPreview(true);
    try {
      const res = await moduleAPI.getByCourse(course.id);
      setPreviewModules(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.warn('Failed to load preview modules:', err);
      setPreviewModules([]);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Safe Name Extractor
  const getCourseName = (course) => {
    if (!course) return 'Course';
    return course.name || course.courseName || course.title || `Course #${course.id || course.courseId || ''}`;
  };

  // Filtered & Sorted Courses List
  const displayedCourses = useMemo(() => {
    let list = [];
    if (activeTab === 'enrolled') {
      list = [...enrolledCourses];
    } else if (activeTab === 'explore') {
      list = approvedCourses.filter((c) => !isEnrolled(c.id));
    } else {
      // 'all' -> Combine unique
      const map = new Map();
      approvedCourses.forEach((c) => {
        const id = String(c.id);
        map.set(id, {
          ...c,
          name: getCourseName(c),
        });
      });
      enrolledCourses.forEach((c) => {
        const id = String(c.id || c.courseId);
        const existing = map.get(id) || {};
        map.set(id, {
          ...existing,
          ...c,
          id: parseInt(id) || c.id,
          name: getCourseName(c) || existing.name,
        });
      });
      list = Array.from(map.values());
    }

    // Apply Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter((c) => {
        const title = getCourseName(c).toLowerCase();
        const desc = (c.description || '').toLowerCase();
        const idStr = String(c.id || c.courseId || '');
        return title.includes(query) || desc.includes(query) || idStr.includes(query);
      });
    }

    // Apply Sorting
    if (sortBy === 'name') {
      list.sort((a, b) => getCourseName(a).localeCompare(getCourseName(b)));
    } else if (sortBy === 'duration') {
      list.sort((a, b) => (b.durationWeeks || 0) - (a.durationWeeks || 0));
    }

    return list;
  }, [activeTab, searchQuery, sortBy, approvedCourses, enrolledCourses]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="relative mx-auto w-16 h-16 mb-4">
            <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-xl">📚</div>
          </div>
          <h3 className="text-slate-800 font-extrabold text-base">Loading Course Hub</h3>
          <p className="text-slate-500 text-xs mt-1">Preparing your personalised learning catalogue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20 animate-fadeIn">
      {/* Top Sticky Navigation */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-6 py-3.5 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xl shadow-md shadow-blue-500/20">
            🎓
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 tracking-tight">
              Student Learning Hub
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">Explore &amp; Master Your Curriculum</p>
          </div>
        </div>

        <Link
          to="/dashboard"
          className="text-xs font-bold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-4 py-2 rounded-xl transition flex items-center gap-1.5"
        >
          <span>←</span>
          <span>Back to Dashboard</span>
        </Link>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
        {/* ========================================================================= */}
        {/* 🌟 HERO BANNER & STATS STRIP */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-blue-950 rounded-3xl text-white p-6 sm:p-10 shadow-2xl relative overflow-hidden mb-8 border border-white/10">
          {/* Subtle Ambient Decorative Circles */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
              <span className="text-xs font-black uppercase tracking-widest px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full">
                🚀 Student Workspace
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Welcome Back, {user?.firstName || 'Student'}! 👋
            </h2>
            <p className="text-slate-300 mt-2 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Explore available courses, enroll with one click, and continue building skills with interactive modules and video lectures.
            </p>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-8 pt-6 border-t border-white/10">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <div className="flex items-center justify-between text-blue-300 text-lg mb-1">
                  <span>✅</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enrolled</span>
                </div>
                <p className="text-2xl font-black text-white">{enrolledCourses.length}</p>
                <p className="text-[11px] text-slate-300 mt-0.5">Active Courses</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <div className="flex items-center justify-between text-indigo-300 text-lg mb-1">
                  <span>📖</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Catalogue</span>
                </div>
                <p className="text-2xl font-black text-white">{approvedCourses.length}</p>
                <p className="text-[11px] text-slate-300 mt-0.5">Total Available</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <div className="flex items-center justify-between text-emerald-300 text-lg mb-1">
                  <span>⏱️</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Format</span>
                </div>
                <p className="text-xl font-extrabold text-white">Self-Paced</p>
                <p className="text-[11px] text-slate-300 mt-0.5">Learn Anytime</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <div className="flex items-center justify-between text-amber-300 text-lg mb-1">
                  <span>🏆</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
                </div>
                <p className="text-xl font-extrabold text-emerald-400">Verified</p>
                <p className="text-[11px] text-slate-300 mt-0.5">LMS Certified</p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 🔍 FILTER, SEARCH & TAB CONTROLS */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-blue-100/90 shadow-sm mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Segmented Tab Buttons */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-2 px-4 rounded-xl text-xs font-extrabold transition whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              📚 All Courses ({approvedCourses.length})
            </button>

            <button
              onClick={() => setActiveTab('enrolled')}
              className={`py-2 px-4 rounded-xl text-xs font-extrabold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'enrolled'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>✅ My Enrolled</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === 'enrolled' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {enrolledCourses.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('explore')}
              className={`py-2 px-4 rounded-xl text-xs font-extrabold transition whitespace-nowrap ${
                activeTab === 'explore'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              🌟 Explore New ({Math.max(0, approvedCourses.length - enrolledCourses.length)})
            </button>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:flex-initial">
              <input
                type="text"
                placeholder="Search course title or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
              />
              <span className="absolute left-3 top-3 text-xs text-slate-400">🔍</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="default">Sort: Default</option>
              <option value="name">Sort: Course Name (A-Z)</option>
              <option value="duration">Sort: Duration (Longest)</option>
            </select>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 📚 COURSE CARDS GRID */}
        {/* ========================================================================= */}
        {displayedCourses.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-blue-100 shadow-sm max-w-xl mx-auto my-6">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-inner">
              🔍
            </div>
            <h3 className="text-lg font-black text-slate-900">No Courses Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No courses matching "${searchQuery}". Try searching with different keywords.`
                : activeTab === 'enrolled'
                ? "You haven't enrolled in any courses yet. Switch to 'Explore New' to get started!"
                : 'There are currently no courses available in this category.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
              >
                Clear Search Filter
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedCourses.map((course, index) => {
              const courseId = course.id || course.courseId;
              const enrolled = isEnrolled(courseId);
              const courseTitle = getCourseName(course);
              const gradientClass = CARD_GRADIENTS[index % CARD_GRADIENTS.length];

              return (
                <div
                  key={courseId || index}
                  className="group bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-2xl hover:border-blue-300 hover:-translate-y-1.5 transition-all duration-300 flex flex-col overflow-hidden"
                >
                  {/* Card Thumbnail / Header Banner */}
                  <div className={`relative bg-gradient-to-r ${gradientClass} p-6 text-white h-44 flex flex-col justify-between overflow-hidden`}>
                    {/* Decorative Watermark Icon */}
                    <div className="absolute right-2 -bottom-4 text-7xl text-white/10 font-black select-none pointer-events-none">
                      🎓
                    </div>

                    {/* Top Chips Row */}
                    <div className="flex items-center justify-between gap-2 relative z-10">
                      <span className="px-3 py-1 bg-black/25 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white">
                        {course.durationWeeks ? `⏱️ ${course.durationWeeks} Weeks` : 'Self-Paced'}
                      </span>

                      {enrolled ? (
                        <span className="px-3 py-1 bg-emerald-500/90 backdrop-blur-md text-white rounded-full text-[10px] font-black shadow-sm flex items-center gap-1">
                          <span>✓</span> Enrolled
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-full text-[10px] font-bold">
                          Course #{courseId}
                        </span>
                      )}
                    </div>

                    {/* Course Category / Institute Tag & Title */}
                    <div className="relative z-10">
                      <span className="text-[10px] font-extrabold text-blue-200 uppercase tracking-widest block mb-0.5">
                        CURRICULUM
                      </span>
                      <h4 className="text-base sm:text-lg font-black text-white leading-snug line-clamp-2 drop-shadow-xs">
                        {courseTitle}
                      </h4>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      {/* Body Title */}
                      <h3
                        onClick={() => navigate(`/courses/${courseId}`)}
                        className="text-base font-black text-slate-900 group-hover:text-blue-600 transition cursor-pointer line-clamp-1"
                        title={courseTitle}
                      >
                        {courseTitle}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                        {course.description || 'Comprehensive curriculum with lessons, video materials, and practical assessments.'}
                      </p>

                      {/* Feature Highlights Strip */}
                      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <span className="text-blue-600">📺</span>
                          <span>Video Lessons</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-purple-600">📝</span>
                          <span>Assignments</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-600">❓</span>
                          <span>Quizzes</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-amber-600">🏆</span>
                          <span>Certificate</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Action Buttons */}
                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                      {enrolled ? (
                        <Link
                          to={`/courses/${courseId}`}
                          className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 text-center transition flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <span>Continue Course</span>
                          <span>→</span>
                        </Link>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEnroll(courseId)}
                            disabled={enrolling === courseId}
                            className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                          >
                            <span>{enrolling === courseId ? 'Enrolling...' : 'Enroll Now 🎓'}</span>
                          </button>

                          <button
                            onClick={() => handleOpenPreview(course)}
                            className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                            title="Quick Preview Syllabus"
                          >
                            👁️
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 👁️ QUICK PREVIEW MODAL */}
      {/* ========================================================================= */}
      {previewCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-blue-100 max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp">
            {/* Modal Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white p-6 relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">
                    Course Syllabus Preview
                  </span>
                  <h4 className="text-xl font-black text-white mt-1">
                    {getCourseName(previewCourse)}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Duration: {previewCourse.durationWeeks ? `${previewCourse.durationWeeks} Weeks` : 'Self-Paced'}
                  </p>
                </div>
                <button
                  onClick={() => setPreviewCourse(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50/50">
              <div>
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  About This Course
                </h5>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {previewCourse.description || 'No detailed description available.'}
                </p>
              </div>

              {/* Modules List Preview */}
              <div>
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Curriculum &amp; Modules ({previewModules.length})
                </h5>
                {loadingPreview ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto mb-1"></div>
                    Loading syllabus preview...
                  </div>
                ) : previewModules.length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-white p-4 rounded-xl border border-slate-200">
                    No modules published yet for this course.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {previewModules.map((m, idx) => (
                      <div key={m.id || idx} className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
                        <div className="flex items-center gap-2 font-bold text-slate-800">
                          <span className="w-5 h-5 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <span>{m.title}</span>
                        </div>
                        {m.lessons && m.lessons.length > 0 && (
                          <div className="mt-2 pl-7 space-y-1 text-[11px] text-slate-500">
                            {m.lessons.map((lesson) => (
                              <div key={lesson.id} className="flex items-center gap-1.5">
                                <span>📄</span>
                                <span>{lesson.title}</span>
                                {lesson.durationMinutes && <span>({lesson.durationMinutes}m)</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-5 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={() => setPreviewCourse(null)}
                className="px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl transition"
              >
                Close Preview
              </button>

              <button
                onClick={() => handleEnroll(previewCourse.id)}
                disabled={enrolling === previewCourse.id || isEnrolled(previewCourse.id)}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 transition active:scale-95 disabled:opacity-50"
              >
                {isEnrolled(previewCourse.id)
                  ? 'Already Enrolled ✓'
                  : enrolling === previewCourse.id
                  ? 'Enrolling...'
                  : 'Enroll in Course 🎓'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCourses;