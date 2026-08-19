import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userAPI, courseAPI, moduleAPI } from '../../services/api';
import toast from 'react-hot-toast';

const InstituteAdminDashboard = ({ data }) => {
  const { user } = useAuth();

  // Navigation & Data States
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' | 'users' | 'all-courses'
  const [pendingCourses, setPendingCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [lecturers, setLecturers] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Course Details Inspector Modal
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseModules, setCourseModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(false);

  // Reject Reason Modal State
  const [rejectModal, setRejectModal] = useState({
    isOpen: false,
    type: null, // 'course' | 'user'
    id: null,
    title: '',
    reason: '',
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch pending users
      const usersRes = await userAPI.getPendingUsers();
      const usersList = usersRes.data || [];
      setPendingUsers(usersList);

      // 2. Fetch all courses for this institute
      const coursesRes = await courseAPI.getAll();
      const coursesList = coursesRes.data || [];
      setAllCourses(coursesList);

      // Filter pending/draft courses
      const pendingList = coursesList.filter(
        (c) => c.status === 'PENDING_APPROVAL' || c.status === 'DRAFT'
      );
      setPendingCourses(pendingList);

      // 3. Fetch lecturers map
      try {
        const lecRes = await userAPI.getLecturers(user?.instituteId || 1);
        const lecMap = {};
        (lecRes.data || []).forEach((l) => {
          lecMap[l.id] = {
            name: `${l.firstName} ${l.lastName}`.trim() || l.username,
            email: l.email,
            username: l.username,
            phone: l.phone,
          };
        });
        setLecturers(lecMap);
      } catch (lecErr) {
        console.warn('Could not fetch lecturers map:', lecErr);
      }
    } catch (error) {
      console.error('Failed to fetch institute dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- COURSE INSPECTOR MODAL ----------------
  const handleOpenCourseDetails = async (course) => {
    setSelectedCourse(course);
    setLoadingModules(true);
    try {
      const res = await moduleAPI.getByCourse(course.id);
      setCourseModules(res.data || []);
    } catch (err) {
      console.error('Failed to fetch course modules:', err);
      setCourseModules([]);
    } finally {
      setLoadingModules(false);
    }
  };

  const handleCloseCourseDetails = () => {
    setSelectedCourse(null);
    setCourseModules([]);
  };

  // ---------------- COURSE ACTIONS ----------------
  const handleApproveCourse = async (courseId) => {
    setActionLoading(`approve-course-${courseId}`);
    try {
      await courseAPI.approve(courseId);
      toast.success('Course approved & published successfully! 🎉');
      if (selectedCourse?.id === courseId) {
        setSelectedCourse(prev => prev ? { ...prev, status: 'APPROVED' } : null);
      }
      await fetchDashboardData();
    } catch (error) {
      console.error('Failed to approve course:', error);
      toast.error(error.response?.data?.error || error.response?.data || 'Failed to approve course');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenRejectCourse = (course) => {
    setRejectModal({
      isOpen: true,
      type: 'course',
      id: course.id,
      title: `Reject Course: "${course.name}"`,
      reason: '',
    });
  };

  // ---------------- USER ACTIONS ----------------
  const handleApproveUser = async (userId) => {
    setActionLoading(`approve-user-${userId}`);
    try {
      await userAPI.approveUser(userId);
      toast.success('User registration approved successfully! 🎉');
      await fetchDashboardData();
    } catch (error) {
      console.error('Failed to approve user:', error);
      toast.error(error.response?.data?.error || error.response?.data || 'Failed to approve user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenRejectUser = (userItem) => {
    setRejectModal({
      isOpen: true,
      type: 'user',
      id: userItem.id,
      title: `Reject User: "${userItem.firstName} ${userItem.lastName} (@${userItem.username})"`,
      reason: '',
    });
  };

  // ---------------- MODAL CONFIRM REJECT ----------------
  const handleConfirmReject = async () => {
    const { type, id, reason } = rejectModal;
    if (!reason.trim()) {
      toast.error('Please enter a rejection reason.');
      return;
    }

    setActionLoading(`reject-${type}-${id}`);
    try {
      if (type === 'course') {
        await courseAPI.reject(id, reason.trim());
        toast.success('Course rejected. Lecturer notified ❌');
        if (selectedCourse?.id === id) {
          setSelectedCourse(prev => prev ? { ...prev, status: 'REJECTED', rejectionReason: reason.trim() } : null);
        }
      } else if (type === 'user') {
        await userAPI.rejectUser(id);
        toast.success('User registration rejected ❌');
      }
      setRejectModal({ isOpen: false, type: null, id: null, title: '', reason: '' });
      await fetchDashboardData();
    } catch (error) {
      console.error('Rejection failed:', error);
      toast.error(error.response?.data?.error || error.response?.data || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const totalPendingCount = pendingCourses.length + pendingUsers.length;

  return (
    <div className="space-y-8 animate-fadeIn font-sans text-slate-800">
      {/* 1. TOP STATS OVERVIEW CARDS */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>🏛️ Institute Overview</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Real-time statistics for your learning institute.</p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl shadow-xs hover:border-blue-400 hover:text-blue-600 transition active:scale-95"
          >
            <span className={`text-sm ${loading ? 'animate-spin' : ''}`}>🔄</span>
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Students Card */}
          <div className="group relative overflow-hidden bg-white p-6 rounded-2xl shadow-xs border border-slate-100/80 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 to-emerald-500" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Students</p>
                <p className="text-3xl font-black text-slate-800 mt-2">{data?.totalStudents ?? 0}</p>
                <p className="text-xs text-teal-600 font-semibold mt-1 flex items-center gap-1">
                  <span>●</span> Active learners
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition duration-300">
                👨‍🎓
              </div>
            </div>
          </div>

          {/* Lecturers Card */}
          <div className="group relative overflow-hidden bg-white p-6 rounded-2xl shadow-xs border border-slate-100/80 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-400 to-rose-500" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Lecturers</p>
                <p className="text-3xl font-black text-slate-800 mt-2">{data?.totalLecturers ?? 0}</p>
                <p className="text-xs text-pink-600 font-semibold mt-1 flex items-center gap-1">
                  <span>●</span> Faculty staff
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition duration-300">
                👨‍🏫
              </div>
            </div>
          </div>

          {/* Courses Card */}
          <div className="group relative overflow-hidden bg-white p-6 rounded-2xl shadow-xs border border-slate-100/80 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Courses</p>
                <p className="text-3xl font-black text-slate-800 mt-2">{allCourses.length || data?.totalCourses || 0}</p>
                <p className="text-xs text-blue-600 font-semibold mt-1 flex items-center gap-1">
                  <span>●</span> {allCourses.filter((c) => c.status === 'APPROVED').length} Published
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition duration-300">
                📚
              </div>
            </div>
          </div>

          {/* Pending Approvals Card */}
          <div className={`group relative overflow-hidden bg-white p-6 rounded-2xl shadow-xs border transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${
            totalPendingCount > 0 ? 'border-amber-300 ring-4 ring-amber-400/10' : 'border-slate-100/80'
          }`}>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Approvals</p>
                  {totalPendingCount > 0 && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                  )}
                </div>
                <p className="text-3xl font-black text-amber-600 mt-2">{totalPendingCount}</p>
                <p className="text-xs text-amber-700 font-semibold mt-1">
                  {pendingCourses.length} Courses · {pendingUsers.length} Users
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition duration-300">
                ⏳
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PENDING APPROVALS & COURSE INSPECTION HUB */}
      <section className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
        {/* Header with Segmented Navigation Tabs */}
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/90 to-white px-6 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2.5">
                <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-sm shadow-md shadow-blue-500/20">
                  ⚡
                </span>
                <span>Institute Review &amp; Approval Hub</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Click any course to inspect its full syllabus and take action.
              </p>
            </div>

            {/* Segmented Tab Controls */}
            <div className="flex items-center bg-slate-100/90 p-1.5 rounded-2xl gap-1.5 self-start md:self-auto border border-slate-200/60 shadow-inner">
              <button
                onClick={() => setActiveTab('courses')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  activeTab === 'courses'
                    ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200/50'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>📚 Course Submissions</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  pendingCourses.length > 0
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {pendingCourses.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  activeTab === 'users'
                    ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200/50'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>👥 User Registrations</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  pendingUsers.length > 0
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {pendingUsers.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('all-courses')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  activeTab === 'all-courses'
                    ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200/50'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>📋 All Courses</span>
                <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-black">
                  {allCourses.length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab 1: Pending Course Submissions */}
        {activeTab === 'courses' && (
          <div className="p-6">
            {loading ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                Loading pending courses...
              </div>
            ) : pendingCourses.length === 0 ? (
              <div className="bg-slate-50/80 rounded-3xl p-12 text-center border border-dashed border-slate-200">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-3xl mb-3 shadow-inner">
                  ✨
                </div>
                <h4 className="font-extrabold text-slate-800 text-base">All Caught Up!</h4>
                <p className="text-slate-500 text-xs mt-1.5 max-w-md mx-auto leading-relaxed">
                  There are no pending course submissions waiting for review. When a lecturer creates a course, it will appear here for your review and approval.
                </p>
                <Link
                  to="/admin/courses"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline mt-4 px-4 py-2 bg-blue-50/80 rounded-xl"
                >
                  View all published courses →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {pendingCourses.map((course) => {
                  const lecturerInfo = lecturers[course.lecturerId];
                  const lecturerName = lecturerInfo?.name || `Lecturer #${course.lecturerId}`;
                  const isPendingAction =
                    actionLoading === `approve-course-${course.id}` ||
                    actionLoading === `reject-course-${course.id}`;

                  return (
                    <div
                      key={course.id}
                      className="group relative flex flex-col justify-between p-6 rounded-3xl border border-amber-200/90 bg-gradient-to-br from-amber-50/30 via-white to-white hover:border-blue-400 hover:shadow-lg transition-all duration-300"
                    >
                      {/* Clickable Area to View Full Course Details */}
                      <div
                        onClick={() => handleOpenCourseDetails(course)}
                        className="cursor-pointer"
                      >
                        {/* Course Header */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                ⏳ Pending Review
                              </span>
                              <span className="text-xs font-semibold text-slate-400">Course #{course.id}</span>
                            </div>
                            <h4 className="text-base font-extrabold text-slate-900 mt-2 line-clamp-1 group-hover:text-blue-600 transition">
                              {course.name}
                            </h4>
                          </div>

                          {/* Thumbnail / Image Preview */}
                          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner overflow-hidden border border-slate-100 group-hover:scale-105 transition">
                            {course.thumbnailUrl && course.thumbnailUrl.startsWith('http') ? (
                              <img
                                src={course.thumbnailUrl}
                                alt={course.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              '📚'
                            )}
                          </div>
                        </div>

                        {/* Description Preview */}
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                          {course.description || 'No description provided.'}
                        </p>

                        {/* Metadata Box */}
                        <div className="grid grid-cols-2 gap-2 p-3.5 bg-slate-50/90 rounded-2xl text-xs text-slate-600 mb-4 border border-slate-100/80 group-hover:bg-blue-50/40 transition">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Lecturer</span>
                            <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5 truncate">
                              👨‍🏫 {lecturerName}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Duration</span>
                            <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                              ⏱️ {course.durationWeeks || 12} Weeks
                            </span>
                          </div>
                        </div>

                        {/* Click indicator */}
                        <div className="flex items-center justify-between text-[11px] font-bold text-blue-600 mb-3 group-hover:translate-x-0.5 transition">
                          <span>🔍 Click to inspect full course &amp; syllabus</span>
                          <span>→</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2.5 pt-4 border-t border-slate-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApproveCourse(course.id);
                          }}
                          disabled={isPendingAction}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
                        >
                          <span>✅</span>
                          {actionLoading === `approve-course-${course.id}` ? 'Approving...' : 'Approve & Publish'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenRejectCourse(course);
                          }}
                          disabled={isPendingAction}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 text-xs font-bold border border-rose-200 transition disabled:opacity-50"
                        >
                          <span>❌</span>
                          Reject Course
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Pending User Registrations */}
        {activeTab === 'users' && (
          <div className="p-6">
            {loading ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                Loading pending registrations...
              </div>
            ) : pendingUsers.length === 0 ? (
              <div className="bg-slate-50/80 rounded-3xl p-12 text-center border border-dashed border-slate-200">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-3xl mb-3 shadow-inner">
                  🎉
                </div>
                <h4 className="font-extrabold text-slate-800 text-base">No Pending Users!</h4>
                <p className="text-slate-500 text-xs mt-1.5 max-w-md mx-auto leading-relaxed">
                  All student, lecturer, and parent registration requests for your institute have been approved.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingUsers.map((pendingUser) => {
                  const roleName = pendingUser.role?.replace('ROLE_', '') || 'STUDENT';
                  const roleBadgeColor =
                    roleName === 'LECTURER'
                      ? 'bg-pink-100 text-pink-700 border-pink-200'
                      : roleName === 'PARENT'
                      ? 'bg-purple-100 text-purple-700 border-purple-200'
                      : 'bg-blue-100 text-blue-700 border-blue-200';

                  const isPendingAction =
                    actionLoading === `approve-user-${pendingUser.id}` ||
                    actionLoading === `reject-user-${pendingUser.id}`;

                  return (
                    <div
                      key={pendingUser.id}
                      className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50/60 transition shadow-xs"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-800 flex items-center justify-center font-black text-sm shadow-inner">
                          {pendingUser.firstName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-sm">
                              {pendingUser.firstName} {pendingUser.lastName}
                            </span>
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black border ${roleBadgeColor}`}>
                              {roleName}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">@{pendingUser.username}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            ✉️ {pendingUser.email} · 📞 {pendingUser.phone || 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApproveUser(pendingUser.id)}
                          disabled={isPendingAction}
                          className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <span>✅</span>
                          {actionLoading === `approve-user-${pendingUser.id}` ? 'Approving...' : 'Approve User'}
                        </button>
                        <button
                          onClick={() => handleOpenRejectUser(pendingUser)}
                          disabled={isPendingAction}
                          className="py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 text-xs font-bold border border-rose-200 transition disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <span>❌</span>
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: All Institute Courses Overview */}
        {activeTab === 'all-courses' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-slate-500">
                Click any course row to view complete syllabus and details:
              </p>
              <Link
                to="/admin/courses"
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Advanced Course Manager →
              </Link>
            </div>

            {allCourses.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl p-10 text-center text-slate-400 text-xs">
                No courses created yet in this institute.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-200/80">
                    <tr>
                      <th className="px-5 py-3.5">Course Name</th>
                      <th className="px-5 py-3.5">Lecturer</th>
                      <th className="px-5 py-3.5">Duration</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allCourses.map((c) => {
                      const lecturerInfo = lecturers[c.lecturerId];
                      const lecturerName = lecturerInfo?.name || `Lecturer #${c.lecturerId}`;

                      return (
                        <tr
                          key={c.id}
                          onClick={() => handleOpenCourseDetails(c)}
                          className="hover:bg-blue-50/40 cursor-pointer transition"
                        >
                          <td className="px-5 py-4 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <span>{c.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono font-normal">#{c.id}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-slate-700 font-medium">
                            👨‍🏫 {lecturerName}
                          </td>
                          <td className="px-5 py-4 text-slate-600">⏱️ {c.durationWeeks || 12} weeks</td>
                          <td className="px-5 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                              c.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : c.status === 'PENDING_APPROVAL' || c.status === 'DRAFT'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {c.status?.replace('_', ' ') || 'DRAFT'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCourseDetails(c);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 font-bold text-[11px] transition"
                            >
                              Inspect 🔍
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 3. INSTITUTE MANAGEMENT QUICK ACTIONS */}
      <section>
        <h3 className="text-xl font-extrabold text-slate-900 mb-4 tracking-tight">⚡ Quick Management Tools</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Link
            to="/admin/students"
            className="group flex flex-col items-center justify-center p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-teal-300 hover:-translate-y-1 transition duration-300 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center text-2xl mb-2.5 group-hover:scale-110 transition duration-300 shadow-inner">
              👨‍🎓
            </div>
            <span className="text-xs font-bold text-slate-800">Manage Students</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Directory &amp; Records</span>
          </Link>

          <Link
            to="/admin/lecturers"
            className="group flex flex-col items-center justify-center p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-pink-300 hover:-translate-y-1 transition duration-300 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center text-2xl mb-2.5 group-hover:scale-110 transition duration-300 shadow-inner">
              👨‍🏫
            </div>
            <span className="text-xs font-bold text-slate-800">Manage Lecturers</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Faculty staff</span>
          </Link>

          <Link
            to="/admin/courses"
            className="group flex flex-col items-center justify-center p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-blue-300 hover:-translate-y-1 transition duration-300 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl mb-2.5 group-hover:scale-110 transition duration-300 shadow-inner">
              📚
            </div>
            <span className="text-xs font-bold text-slate-800">All Courses</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Curriculum &amp; Status</span>
          </Link>

          <Link
            to="/admin/reports"
            className="group flex flex-col items-center justify-center p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-indigo-300 hover:-translate-y-1 transition duration-300 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl mb-2.5 group-hover:scale-110 transition duration-300 shadow-inner">
              📊
            </div>
            <span className="text-xs font-bold text-slate-800">Reports &amp; Analytics</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Attendance &amp; Marks</span>
          </Link>

          <Link
            to="/announcements"
            className="group flex flex-col items-center justify-center p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-amber-300 hover:-translate-y-1 transition duration-300 text-center col-span-2 sm:col-span-1"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl mb-2.5 group-hover:scale-110 transition duration-300 shadow-inner">
              📢
            </div>
            <span className="text-xs font-bold text-slate-800">Announcements</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Publish alerts</span>
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. PROFESSIONAL COURSE DETAILS INSPECTOR MODAL */}
      {/* ========================================================================= */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp">
            {/* Modal Hero Header */}
            <div className="relative bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-950 p-6 md:p-8 text-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wide ${
                      selectedCourse.status === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : selectedCourse.status === 'PENDING_APPROVAL' || selectedCourse.status === 'DRAFT'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}>
                      {selectedCourse.status?.replace('_', ' ') || 'PENDING'}
                    </span>
                    <span className="text-xs text-slate-300 font-mono">Course ID #{selectedCourse.id}</span>
                  </div>

                  <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
                    {selectedCourse.name}
                  </h2>
                </div>

                {/* Close Button */}
                <button
                  onClick={handleCloseCourseDetails}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 bg-slate-50/40">
              {/* Lecturer & Spec Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Lecturer Card */}
                <div className="md:col-span-2 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-blue-500/20">
                    👨‍🏫
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">Instructor</span>
                    <h5 className="font-extrabold text-slate-900 text-sm">
                      {lecturers[selectedCourse.lecturerId]?.name || `Lecturer ID #${selectedCourse.lecturerId}`}
                    </h5>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {lecturers[selectedCourse.lecturerId]?.email || `@${lecturers[selectedCourse.lecturerId]?.username || 'faculty'}`}
                    </p>
                  </div>
                </div>

                {/* Duration & Institute */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-center">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">Duration</span>
                  <p className="text-base font-black text-slate-800 mt-0.5">
                    ⏱️ {selectedCourse.durationWeeks || 12} Weeks
                  </p>
                  <span className="text-[11px] text-slate-400 mt-1">
                    Institute ID: #{selectedCourse.instituteId}
                  </span>
                </div>
              </div>

              {/* Course Description */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-2">
                  📝 Course Description &amp; Syllabus Overview
                </h4>
                <p className="text-xs md:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {selectedCourse.description || 'No detailed description provided.'}
                </p>
              </div>

              {/* Rejection Alert if Rejected */}
              {selectedCourse.rejectionReason && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <h5 className="text-xs font-bold text-rose-800">Current Rejection Reason:</h5>
                    <p className="text-xs text-rose-700 mt-0.5">{selectedCourse.rejectionReason}</p>
                  </div>
                </div>
              )}

              {/* Course Modules Curriculum Section */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
                    📑 Attached Modules &amp; Lessons ({courseModules.length})
                  </h4>
                </div>

                {loadingModules ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    Loading modules...
                  </div>
                ) : courseModules.length === 0 ? (
                  <div className="bg-slate-50 rounded-xl p-5 text-center text-xs text-slate-500 border border-dashed border-slate-200">
                    No specific modules added yet. The lecturer will add lessons after approval.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {courseModules.map((mod, index) => (
                      <div
                        key={mod.id || index}
                        className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                            {index + 1}
                          </span>
                          <div>
                            <h6 className="font-bold text-xs text-slate-800">{mod.title || mod.name}</h6>
                            <p className="text-[11px] text-slate-500 mt-0.5">{mod.description || 'Module content'}</p>
                          </div>
                        </div>
                        {mod.lessons && (
                          <span className="text-[11px] font-semibold text-slate-400">
                            {mod.lessons.length} lessons
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Sticky Footer Actions */}
            <div className="p-5 md:p-6 bg-white border-t border-slate-200/80 flex items-center justify-between gap-4">
              <button
                onClick={handleCloseCourseDetails}
                className="py-2.5 px-5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition"
              >
                Close Inspector
              </button>

              <div className="flex items-center gap-3">
                {selectedCourse.status !== 'REJECTED' && (
                  <button
                    onClick={() => handleOpenRejectCourse(selectedCourse)}
                    className="py-2.5 px-5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition active:scale-95 flex items-center gap-1.5"
                  >
                    <span>❌</span> Reject Course
                  </button>
                )}

                {selectedCourse.status !== 'APPROVED' && (
                  <button
                    onClick={() => handleApproveCourse(selectedCourse.id)}
                    disabled={actionLoading === `approve-course-${selectedCourse.id}`}
                    className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <span>✅</span>
                    {actionLoading === `approve-course-${selectedCourse.id}` ? 'Publishing...' : 'Approve & Publish Course'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. REJECTION REASON MODAL */}
      {/* ========================================================================= */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl mb-4">
              ⚠️
            </div>
            <h4 className="text-base font-extrabold text-slate-900">{rejectModal.title}</h4>
            <p className="text-xs text-slate-500 mt-1">
              Please provide feedback on why this item is rejected.
            </p>

            {/* Quick Reason Suggestions */}
            <div className="flex flex-wrap gap-1.5 mt-3.5 mb-2">
              {[
                'Incomplete syllabus',
                'Missing course materials',
                'Course title unclear',
                'Duplicate registration',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() =>
                    setRejectModal((prev) => ({
                      ...prev,
                      reason: suggestion,
                    }))
                  }
                  className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={rejectModal.reason}
              onChange={(e) =>
                setRejectModal((prev) => ({
                  ...prev,
                  reason: e.target.value,
                }))
              }
              placeholder="e.g. Please add detailed lesson outlines and resubmit..."
              className="w-full mt-2 p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />

            <div className="flex items-center gap-2.5 mt-5">
              <button
                onClick={handleConfirmReject}
                disabled={Boolean(actionLoading)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Confirm Rejection'}
              </button>
              <button
                onClick={() =>
                  setRejectModal({
                    isOpen: false,
                    type: null,
                    id: null,
                    title: '',
                    reason: '',
                  })
                }
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstituteAdminDashboard;