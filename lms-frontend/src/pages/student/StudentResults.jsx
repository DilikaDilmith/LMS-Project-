import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { assignmentAPI, quizAPI, courseAPI } from '../../services/api';
import CertificateModal from '../../components/CertificateModal';
import toast from 'react-hot-toast';

const StudentResults = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const studentId = user?.id;

  const [submissions, setSubmissions] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [coursesMap, setCoursesMap] = useState({});
  const [quizzesMap, setQuizzesMap] = useState({});
  const [assignmentsMap, setAssignmentsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [certificateCourse, setCertificateCourse] = useState(null);

  // Filters & View Controls
  const [activeTab, setActiveTab] = useState('quizzes'); // 'quizzes' | 'assignments' | 'analytics'
  const [filterCourse, setFilterCourse] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'PASSED' | 'FAILED' | 'GRADED' | 'PENDING'
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  const effectiveStudentId =
    studentId ||
    user?.id ||
    (() => {
      try {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored)?.id : null;
      } catch {
        return null;
      }
    })();

  useEffect(() => {
    if (effectiveStudentId) {
      fetchResults();
    } else {
      setLoading(false);
    }
  }, [effectiveStudentId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime())
        ? 'Recently'
        : d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
    } catch {
      return 'Recently';
    }
  };

  const getGradeInfo = (score, maxMarks = 100) => {
    if (maxMarks <= 0) return { letter: 'N/A', color: 'slate', gpa: '0.0' };
    const pct = Math.round((score / maxMarks) * 100);
    if (pct >= 90) return { letter: 'A+', color: 'emerald', gpa: '4.0', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (pct >= 80) return { letter: 'A', color: 'emerald', gpa: '3.7', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (pct >= 75) return { letter: 'B+', color: 'blue', gpa: '3.3', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (pct >= 70) return { letter: 'B', color: 'blue', gpa: '3.0', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (pct >= 60) return { letter: 'C', color: 'amber', gpa: '2.0', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (pct >= 50) return { letter: 'D', color: 'orange', gpa: '1.0', bg: 'bg-orange-50 text-orange-700 border-orange-200' };
    return { letter: 'F', color: 'rose', gpa: '0.0', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
  };

  const fetchResults = async () => {
    setLoading(true);
    try {
      // 1. Fetch Student Quiz Attempts, Submissions & Enrolled Courses
      const [quizAttemptsRes, submissionsRes, enrolledRes] = await Promise.all([
        quizAPI.getStudentResults(effectiveStudentId).catch((err) => {
          console.warn('Failed to load student quiz results:', err);
          return { data: [] };
        }),
        assignmentAPI.getStudentSubmissions(effectiveStudentId).catch((err) => {
          console.warn('Failed to load student assignments:', err);
          return { data: [] };
        }),
        courseAPI.getEnrolled(effectiveStudentId).catch((err) => {
          console.warn('Failed to load student courses:', err);
          return { data: [] };
        }),
      ]);

      const rawAttempts = Array.isArray(quizAttemptsRes?.data) ? quizAttemptsRes.data : [];
      const rawSubmissions = Array.isArray(submissionsRes?.data) ? submissionsRes.data : [];
      const rawCourses = Array.isArray(enrolledRes?.data) ? enrolledRes.data : [];

      setQuizAttempts(rawAttempts);
      setSubmissions(rawSubmissions);

      // Build Course Map
      const cMap = {};
      rawCourses.forEach((c) => {
        const id = c.courseId ?? c.id;
        const name = c.courseName ?? c.name ?? c.title ?? `Course #${id}`;
        if (id) cMap[String(id)] = name;
      });

      // 2. Fetch Quizzes and Assignments for all enrolled courses to enrich titles and total marks
      const courseIds = rawCourses.map((c) => c.courseId ?? c.id).filter(Boolean);
      const qMap = {};
      const aMap = {};

      if (courseIds.length > 0) {
        await Promise.all(
          courseIds.map(async (cid) => {
            try {
              const [qRes, aRes] = await Promise.all([
                quizAPI.getByCourse(cid).catch(() => ({ data: [] })),
                assignmentAPI.getByCourse(cid).catch(() => ({ data: [] })),
              ]);
              (Array.isArray(qRes?.data) ? qRes.data : []).forEach((q) => {
                qMap[String(q.id)] = {
                  title: q.title || `Quiz #${q.id}`,
                  passingScore: q.passingScore || 50,
                  durationMinutes: q.durationMinutes || 30,
                  courseId: q.courseId ?? cid,
                  courseName: cMap[String(cid)] || `Course #${cid}`,
                };
              });
              (Array.isArray(aRes?.data) ? aRes.data : []).forEach((a) => {
                aMap[String(a.id)] = {
                  title: a.title || `Assignment #${a.id}`,
                  maxMarks: a.maxMarks || 100,
                  courseId: a.courseId ?? cid,
                  courseName: cMap[String(cid)] || `Course #${cid}`,
                };
              });
            } catch (e) {
              console.warn(`Error loading course ${cid} details:`, e);
            }
          })
        );
      }

      // Also enrich any attempt quiz that wasn't in qMap yet
      const missingQuizIds = [...new Set(
        rawAttempts
          .map((a) => a.quizId)
          .filter((qid) => qid && !qMap[String(qid)])
      )];

      if (missingQuizIds.length > 0) {
        await Promise.all(
          missingQuizIds.map(async (qid) => {
            try {
              const res = await quizAPI.getById(qid);
              if (res.data) {
                const q = res.data;
                const cid = q.courseId;
                let cName = cid ? cMap[String(cid)] : null;
                if (!cName && cid) {
                  try {
                    const cRes = await courseAPI.getById(cid);
                    cName = cRes.data?.name || cRes.data?.title || `Course #${cid}`;
                    cMap[String(cid)] = cName;
                  } catch {}
                }
                qMap[String(q.id)] = {
                  title: q.title || `Quiz #${q.id}`,
                  passingScore: q.passingScore || 50,
                  durationMinutes: q.durationMinutes || 30,
                  courseId: cid,
                  courseName: cName || (cid ? `Course #${cid}` : 'Enrolled Course'),
                };
              }
            } catch (err) {
              console.warn(`Failed to fetch quiz ${qid}:`, err);
            }
          })
        );
      }

      setCoursesMap(cMap);
      setQuizzesMap(qMap);
      setAssignmentsMap(aMap);
    } catch (error) {
      console.error('Failed to load student transcript:', error);
      toast.error('Failed to load performance transcript');
    } finally {
      setLoading(false);
    }
  };

  // Safe Arrays
  const safeAttempts = Array.isArray(quizAttempts) ? quizAttempts : [];
  const safeSubmissions = Array.isArray(submissions) ? submissions : [];

  // Metrics
  const passedQuizzes = safeAttempts.filter((q) => {
    const qInfo = quizzesMap[String(q?.quizId)];
    return q?.isPassed ?? q?.passed ?? ((q?.score ?? 0) >= (qInfo?.passingScore || 50));
  });
  const gradedSubmissions = safeSubmissions.filter((s) => s?.status === 'GRADED');
  
  const totalQuizScore = safeAttempts.reduce((sum, a) => sum + (a.score || 0), 0);
  const avgQuizScore = safeAttempts.length > 0 ? Math.round(totalQuizScore / safeAttempts.length) : 0;
  
  const passRate = safeAttempts.length > 0 ? Math.round((passedQuizzes.length / safeAttempts.length) * 100) : 0;

  // Academic Standing badge
  const academicStanding = useMemo(() => {
    if (safeAttempts.length === 0 && safeSubmissions.length === 0) return { label: 'Enrolled & Active', color: 'blue', icon: '🎓' };
    if (passRate >= 80 && avgQuizScore >= 75) return { label: 'Dean’s Honors Standing', color: 'emerald', icon: '🌟' };
    if (passRate >= 50) return { label: 'Good Academic Standing', color: 'indigo', icon: '✨' };
    return { label: 'Academic Progress Required', color: 'amber', icon: '📈' };
  }, [passRate, avgQuizScore, safeAttempts.length, safeSubmissions.length]);

  // Filtered Quizzes
  const filteredAttempts = useMemo(() => {
    return safeAttempts.filter((a) => {
      const qInfo = quizzesMap[String(a.quizId)];
      const title = (qInfo?.title || `Quiz #${a.quizId}`).toLowerCase();
      const courseName = (qInfo?.courseName || '').toLowerCase();
      const query = searchQuery.toLowerCase();

      // Course filter
      if (filterCourse !== 'ALL') {
        const attemptCourseId = qInfo?.courseId;
        if (attemptCourseId && String(attemptCourseId) !== String(filterCourse)) {
          return false;
        }
      }
      // Status filter
      const isPassed = a?.isPassed ?? a?.passed ?? ((a?.score ?? 0) >= (qInfo?.passingScore || 50));
      if (filterStatus === 'PASSED' && !isPassed) return false;
      if (filterStatus === 'FAILED' && isPassed) return false;

      // Search filter
      if (query && !title.includes(query) && !courseName.includes(query) && !String(a.quizId).includes(query)) {
        return false;
      }

      return true;
    });
  }, [safeAttempts, quizzesMap, filterCourse, filterStatus, searchQuery]);

  // Filtered Assignments
  const filteredSubmissions = useMemo(() => {
    return safeSubmissions.filter((s) => {
      const aInfo = assignmentsMap[String(s.assignmentId)];
      const title = (aInfo?.title || '').toLowerCase();
      const courseName = (aInfo?.courseName || '').toLowerCase();
      const query = searchQuery.toLowerCase();

      // Course filter
      if (filterCourse !== 'ALL' && String(aInfo?.courseId) !== String(filterCourse)) {
        return false;
      }
      // Status filter
      if (filterStatus === 'GRADED' && s.status !== 'GRADED') return false;
      if (filterStatus === 'PENDING' && s.status === 'GRADED') return false;

      // Search filter
      if (query && !title.includes(query) && !courseName.includes(query) && !String(s.assignmentId).includes(query)) {
        return false;
      }

      return true;
    });
  }, [safeSubmissions, assignmentsMap, filterCourse, filterStatus, searchQuery]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto w-16 h-16 mb-4">
            <div className="w-16 h-16 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-xl">📊</div>
          </div>
          <h3 className="text-slate-800 font-extrabold text-base">Loading Academic Transcript</h3>
          <p className="text-slate-500 text-xs mt-1">Aggregating quizzes and assignment evaluations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/80 font-sans text-slate-800 pb-24 animate-fadeIn">
      {/* Top Navbar */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-6 py-3.5 flex justify-between items-center shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-purple-600 text-white flex items-center justify-center text-lg font-black shadow-md shadow-indigo-500/20">
            📊
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-slate-900 tracking-tight">
                Academic Grade Transcript
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                Official Record
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Student ID: #{studentId} &nbsp;·&nbsp; {user?.firstName} {user?.lastName} ({user?.username})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 border border-slate-200"
            title="Print or Save PDF"
          >
            <span>🖨️</span>
            <span className="hidden sm:inline">Print Transcript</span>
          </button>
          <Link
            to="/student/quizzes"
            className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl transition border border-blue-200 flex items-center gap-1.5"
          >
            <span>❓</span>
            <span className="hidden sm:inline">Quizzes</span>
          </Link>
          <Link
            to="/dashboard"
            className="text-xs font-bold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition flex items-center gap-1.5"
          >
            <span>←</span>
            <span>Dashboard</span>
          </Link>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
        {/* ========================================================================= */}
        {/* 🎓 HERO BANNER */}
        {/* ========================================================================= */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 border border-indigo-900/50">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/10 text-blue-300 border border-white/10 backdrop-blur-md">
                  {academicStanding.icon} {academicStanding.label}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {Object.keys(coursesMap).length} Active Enrolled Course{Object.keys(coursesMap).length !== 1 ? 's' : ''}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.username}'s Transcript
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                Comprehensive performance metrics, score cards, and evaluation feedback across all course modules.
              </p>
            </div>

            {/* Quick KPI Badge */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-center min-w-[160px] shrink-0">
              <div className="text-xs font-extrabold uppercase text-blue-200 tracking-wider">Overall Pass Rate</div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-400 mt-1">
                {passRate}%
              </div>
              <div className="text-[11px] text-slate-300 font-medium mt-0.5">
                {passedQuizzes.length} of {safeAttempts.length} Quizzes Cleared
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 📊 EXECUTIVE METRIC CARDS */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: Quizzes Passed — clickable, jumps to filtered quiz list */}
          <button
            onClick={() => { setActiveTab('quizzes'); setFilterStatus('PASSED'); }}
            className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-xs hover:shadow-md hover:border-emerald-300 transition flex flex-col justify-between text-left w-full cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>Quizzes Passed</span>
                <span className="text-base group-hover:scale-110 transition-transform inline-block">🏆</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">
                {passedQuizzes.length} <span className="text-xs text-slate-400 font-bold">/ {safeAttempts.length}</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${safeAttempts.length > 0 ? (passedQuizzes.length / safeAttempts.length) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mt-1.5">
                <span>Pass Rate</span>
                <span className="text-emerald-700 font-extrabold">{passRate}%</span>
              </div>
              <p className="text-[10px] text-emerald-600 font-bold mt-1.5 group-hover:underline">View passed quizzes →</p>
            </div>
          </button>

          {/* Card 2: Average Score */}
          <div className="bg-white p-5 rounded-3xl border border-indigo-100 shadow-xs hover:shadow-md transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>Average Quiz Mark</span>
                <span className="text-base">🎯</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-indigo-600 mt-2">
                {avgQuizScore} <span className="text-xs text-slate-400 font-bold">pts</span>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] font-bold text-slate-500">
              <span>Grade Standing:</span>
              <span className={`px-2 py-0.5 rounded-md font-black text-xs ${getGradeInfo(avgQuizScore, 100).bg}`}>
                Grade {getGradeInfo(avgQuizScore, 100).letter}
              </span>
            </div>
          </div>

          {/* Card 3: Graded Assignments */}
          <div className="bg-white p-5 rounded-3xl border border-blue-100 shadow-xs hover:shadow-md transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>Assignments Graded</span>
                <span className="text-base">📝</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-blue-600 mt-2">
                {gradedSubmissions.length} <span className="text-xs text-slate-400 font-bold">/ {safeSubmissions.length}</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${safeSubmissions.length > 0 ? (gradedSubmissions.length / safeSubmissions.length) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mt-1.5">
                <span>Evaluated</span>
                <span className="text-blue-700 font-extrabold">
                  {safeSubmissions.length > 0 ? Math.round((gradedSubmissions.length / safeSubmissions.length) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Total Submissions */}
          <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-xs hover:shadow-md transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>Total Evaluations</span>
                <span className="text-base">📈</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-purple-700 mt-2">
                {safeAttempts.length + safeSubmissions.length}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] font-bold text-slate-500">
              <span>Course Workload:</span>
              <span className="text-purple-700 font-extrabold">Complete</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ✅ QUIZZES PASSED — live list from backend */}
        {/* ========================================================================= */}
        {safeAttempts.length > 0 && (
          <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm mb-6 overflow-hidden">
            {/* Section header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-base">🏆</div>
                <div>
                  <h3 className="text-sm font-black text-emerald-900 leading-tight">Quizzes Passed</h3>
                  <p className="text-[11px] text-emerald-600 font-medium">
                    {passedQuizzes.length} of {safeAttempts.length} quiz{safeAttempts.length !== 1 ? 'zes' : ''} passed · {passRate}% pass rate
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setActiveTab('quizzes'); setFilterStatus('PASSED'); }}
                className="text-[11px] font-extrabold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-xl transition border border-emerald-200"
              >
                View All →
              </button>
            </div>

            {passedQuizzes.length === 0 ? (
              /* No quizzes passed yet */
              <div className="px-5 py-10 text-center">
                <div className="text-3xl mb-2">📝</div>
                <p className="text-sm font-bold text-slate-700">No quizzes passed yet</p>
                <p className="text-xs text-slate-400 mt-1">Attempt quizzes in your enrolled courses to see your results here.</p>
                <Link
                  to="/student/quizzes"
                  className="mt-4 inline-block text-xs font-extrabold text-indigo-600 hover:text-indigo-800 underline"
                >
                  Go to My Quizzes →
                </Link>
              </div>
            ) : (
              /* List of passed quizzes */
              <div className="divide-y divide-slate-50">
                {passedQuizzes.map((attempt) => {
                  const quizInfo = quizzesMap[String(attempt.quizId)];
                  const title = quizInfo?.title || `Quiz #${attempt.quizId}`;
                  const courseName =
                    quizInfo?.courseName ||
                    (quizInfo?.courseId ? coursesMap[String(quizInfo.courseId)] : null) ||
                    'Enrolled Course';
                  const score = attempt.score ?? 0;
                  const passingScore = quizInfo?.passingScore || 50;
                  const grade = getGradeInfo(score, 100);
                  const attemptDate = attempt.attemptedAt || attempt.endTime || attempt.startTime;
                  const barWidth = Math.min(score, 100);

                  return (
                    <div
                      key={attempt.id || attempt.quizId}
                      className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-emerald-50/30 transition"
                    >
                      {/* Left: icon + title + meta */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm shrink-0 mt-0.5 font-black">
                          ✅
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-extrabold text-slate-900 leading-snug truncate">{title}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[11px] text-slate-500 font-medium">📚 {courseName}</span>
                            <span className="text-slate-200 text-[10px]">·</span>
                            <span className="text-[11px] text-slate-400 font-medium">{formatDate(attemptDate)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Center: score progress bar */}
                      <div className="hidden md:block w-40 shrink-0">
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1">
                          <span>{score} pts scored</span>
                          <span>Pass: {passingScore}%</span>
                        </div>
                      </div>

                      {/* Right: grade + score badge + review button */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded-lg font-black text-xs border ${grade.bg}`}>
                          {grade.letter}
                        </span>
                        <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg">
                          {score} pts
                        </span>
                        <button
                          onClick={() => navigate(`/student/quiz/${attempt.quizId}`)}
                          className="text-[11px] font-extrabold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-xl transition active:scale-95"
                        >
                          Review 🔍
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 🎛️ CONTROLS & FILTER BAR */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 print:hidden">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl shrink-0 overflow-x-auto">
            <button
              onClick={() => { setActiveTab('quizzes'); setFilterStatus('ALL'); }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 shrink-0 ${
                activeTab === 'quizzes'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>❓</span>
              <span>Quizzes &amp; Tests ({safeAttempts.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('assignments'); setFilterStatus('ALL'); }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 shrink-0 ${
                activeTab === 'assignments'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📝</span>
              <span>Assignments ({safeSubmissions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 shrink-0 ${
                activeTab === 'analytics'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📈</span>
              <span>Grade Summary</span>
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-56">
              <input
                type="text"
                placeholder="Search assessment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <span className="absolute left-2.5 top-2.5 text-xs text-slate-400">🔍</span>
            </div>

            {/* Course Filter */}
            {Object.keys(coursesMap).length > 0 && (
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="ALL">All Courses</option>
                {Object.entries(coursesMap).map(([cid, cname]) => (
                  <option key={cid} value={cid}>
                    {cname}
                  </option>
                ))}
              </select>
            )}

            {/* Status Filter */}
            {activeTab === 'quizzes' && (
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="ALL">All Results</option>
                <option value="PASSED">Passed Only (🏆)</option>
                <option value="FAILED">Needs Retake (❌)</option>
              </select>
            )}

            {activeTab === 'assignments' && (
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="ALL">All Submissions</option>
                <option value="GRADED">Evaluated (✅)</option>
                <option value="PENDING">Under Review (⏳)</option>
              </select>
            )}

            {/* View Mode Toggle */}
            {activeTab !== 'analytics' && (
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg text-xs transition ${
                    viewMode === 'grid' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Grid View"
                >
                  🔲
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs transition ${
                    viewMode === 'table' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Table View"
                >
                  📄
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ❓ TAB 1: QUIZZES & ASSESSMENTS */}
        {/* ========================================================================= */}
        {activeTab === 'quizzes' && (
          <div>
            {filteredAttempts.length === 0 ? (
              <div className="bg-white rounded-3xl p-14 text-center border border-slate-200 shadow-sm">
                <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-3xl mx-auto mb-3">
                  ❓
                </div>
                <h4 className="text-base font-black text-slate-800">No Quiz Attempts Found</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {searchQuery || filterStatus !== 'ALL' || filterCourse !== 'ALL'
                    ? 'No quiz results match your active filters. Try clearing your search.'
                    : "You haven't attempted any quizzes yet. Visit the Quizzes section to start your assessments."}
                </p>
                <Link
                  to="/student/quizzes"
                  className="mt-5 inline-block px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition"
                >
                  Explore Available Quizzes 🚀
                </Link>
              </div>
            ) : viewMode === 'grid' ? (
              /* Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAttempts.map((attempt) => {
                  const isPassed = attempt?.isPassed ?? attempt?.passed;
                  const quizInfo = quizzesMap[String(attempt.quizId)];
                  const title = quizInfo?.title || `Quiz Assessment #${attempt.quizId}`;
                  const courseName = quizInfo?.courseName || (quizInfo?.courseId ? coursesMap[String(quizInfo.courseId)] : null);
                  const attemptDate = attempt.attemptedAt || attempt.endTime || attempt.startTime;
                  const score = attempt.score ?? 0;
                  const grade = getGradeInfo(score, 100);

                  return (
                    <div
                      key={attempt.id || attempt.quizId}
                      className={`bg-white rounded-3xl p-6 border shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between ${
                        isPassed ? 'border-emerald-200/90' : 'border-rose-200/90'
                      }`}
                    >
                      <div>
                        {/* Card Header Tag Row */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                                isPassed
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-rose-100 text-rose-800 border border-rose-200'
                              }`}
                            >
                              {isPassed ? '✅ Passed' : '❌ Failed'}
                            </span>
                            {courseName && (
                              <span className="text-[11px] font-bold text-slate-500 truncate max-w-[180px]">
                                📚 {courseName}
                              </span>
                            )}
                          </div>

                          <span className={`px-2 py-0.5 rounded-md font-black text-xs border ${grade.bg}`}>
                            {grade.letter}
                          </span>
                        </div>

                        {/* Quiz Title */}
                        <h3 className="text-base font-black text-slate-900 leading-snug line-clamp-2">
                          {title}
                        </h3>

                        <p className="text-[11px] text-slate-400 font-medium mt-1">
                          Completed on {formatDate(attemptDate)}
                        </p>

                        {/* Score Metric Container */}
                        <div className="my-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Recorded Mark</span>
                            <div className="text-2xl font-black text-slate-900">
                              {score} <span className="text-xs text-slate-400 font-bold">pts</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Requirement</span>
                            <div className={`text-xs font-black ${isPassed ? 'text-emerald-700' : 'text-rose-700'}`}>
                              Pass Mark: {quizInfo?.passingScore || 50}%
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        {quizInfo?.courseId ? (
                          <Link
                            to={`/courses/${quizInfo.courseId}`}
                            className="text-xs font-bold text-slate-500 hover:text-slate-800 transition"
                          >
                            Course Page →
                          </Link>
                        ) : <div />}

                        <button
                          onClick={() => navigate(`/student/quiz/${attempt.quizId}`)}
                          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5"
                        >
                          <span>🔍</span>
                          <span>View Result Card</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Table View */
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-5">Assessment</th>
                      <th className="py-3.5 px-4">Course</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4 text-center">Score</th>
                      <th className="py-3.5 px-4 text-center">Grade</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {filteredAttempts.map((attempt) => {
                      const isPassed = attempt?.isPassed ?? attempt?.passed;
                      const quizInfo = quizzesMap[String(attempt.quizId)];
                      const title = quizInfo?.title || `Quiz #${attempt.quizId}`;
                      const courseName = quizInfo?.courseName || 'Enrolled Course';
                      const attemptDate = attempt.attemptedAt || attempt.endTime || attempt.startTime;
                      const score = attempt.score ?? 0;
                      const grade = getGradeInfo(score, 100);

                      return (
                        <tr key={attempt.id || attempt.quizId} className="hover:bg-slate-50/60 transition">
                          <td className="py-3.5 px-5 font-bold text-slate-900">
                            {title}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">{courseName}</td>
                          <td className="py-3.5 px-4 text-slate-400">{formatDate(attemptDate)}</td>
                          <td className="py-3.5 px-4 text-center font-black text-slate-900">{score} pts</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded font-black text-[11px] border ${grade.bg}`}>
                              {grade.letter}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {isPassed ? 'Passed' : 'Failed'}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <button
                              onClick={() => navigate(`/student/quiz/${attempt.quizId}`)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[11px] rounded-lg transition"
                            >
                              Review 🔍
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

        {/* ========================================================================= */}
        {/* 📝 TAB 2: ASSIGNMENTS & HOMEWORK */}
        {/* ========================================================================= */}
        {activeTab === 'assignments' && (
          <div>
            {filteredSubmissions.length === 0 ? (
              <div className="bg-white rounded-3xl p-14 text-center border border-slate-200 shadow-sm">
                <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl mx-auto mb-3">
                  📝
                </div>
                <h4 className="text-base font-black text-slate-800">No Assignment Submissions Found</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {searchQuery || filterStatus !== 'ALL' || filterCourse !== 'ALL'
                    ? 'No assignment submissions match your active filters.'
                    : "You haven't submitted any assignments yet."}
                </p>
                <Link
                  to="/assignments"
                  className="mt-5 inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 transition"
                >
                  View Course Assignments 📝
                </Link>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSubmissions.map((sub) => {
                  const isGraded = sub.status === 'GRADED';
                  const asgnInfo = assignmentsMap[String(sub.assignmentId)];
                  const title = asgnInfo?.title || `Assignment #${sub.assignmentId}`;
                  const courseName = asgnInfo?.courseName || (asgnInfo?.courseId ? coursesMap[String(asgnInfo.courseId)] : null);
                  const marks = sub.marks ?? 0;
                  const maxMarks = asgnInfo?.maxMarks || 100;
                  const grade = getGradeInfo(marks, maxMarks);

                  return (
                    <div
                      key={sub.id}
                      className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                    >
                      <div>
                        {/* Header Tag */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                                isGraded
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {isGraded ? 'Graded' : 'Submitted (Under Review)'}
                            </span>
                            {courseName && (
                              <span className="text-[11px] font-bold text-slate-500 truncate max-w-[180px]">
                                📚 {courseName}
                              </span>
                            )}
                          </div>

                          {isGraded && (
                            <span className={`px-2 py-0.5 rounded-md font-black text-xs border ${grade.bg}`}>
                              {grade.letter}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-black text-slate-900 leading-snug line-clamp-2">
                          {title}
                        </h3>

                        <p className="text-[11px] text-slate-400 font-medium mt-1">
                          Submitted on {formatDate(sub.submittedAt)}
                        </p>

                        {/* Marks & Feedback */}
                        {isGraded ? (
                          <div className="my-4 p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Awarded Marks</span>
                              <div className="text-2xl font-black text-blue-700">
                                {marks} <span className="text-xs text-slate-400 font-bold">/ {maxMarks}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Evaluation</span>
                              <div className="text-xs font-black text-emerald-700">
                                {Math.round((marks / maxMarks) * 100)}% Grade
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="my-4 p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-center gap-2 text-xs font-bold text-amber-800">
                            <span>⏳</span>
                            <span>Awaiting evaluation by your course instructor.</span>
                          </div>
                        )}

                        {sub.feedback && (
                          <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                            <span className="font-bold text-slate-900 block mb-0.5">💬 Instructor Feedback:</span>
                            "{sub.feedback}"
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex justify-end">
                        <Link
                          to="/assignments"
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                        >
                          View All Assignments →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-5">Assignment</th>
                      <th className="py-3.5 px-4">Course</th>
                      <th className="py-3.5 px-4">Submitted</th>
                      <th className="py-3.5 px-4 text-center">Marks</th>
                      <th className="py-3.5 px-4 text-center">Grade</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {filteredSubmissions.map((sub) => {
                      const isGraded = sub.status === 'GRADED';
                      const asgnInfo = assignmentsMap[String(sub.assignmentId)];
                      const title = asgnInfo?.title || `Assignment #${sub.assignmentId}`;
                      const courseName = asgnInfo?.courseName || 'Enrolled Course';
                      const marks = sub.marks ?? 0;
                      const maxMarks = asgnInfo?.maxMarks || 100;
                      const grade = getGradeInfo(marks, maxMarks);

                      return (
                        <tr key={sub.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3.5 px-5 font-bold text-slate-900">{title}</td>
                          <td className="py-3.5 px-4 text-slate-600">{courseName}</td>
                          <td className="py-3.5 px-4 text-slate-400">{formatDate(sub.submittedAt)}</td>
                          <td className="py-3.5 px-4 text-center font-black text-slate-900">
                            {isGraded ? `${marks} / ${maxMarks}` : '--'}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {isGraded ? (
                              <span className={`px-2 py-0.5 rounded font-black text-[11px] border ${grade.bg}`}>
                                {grade.letter}
                              </span>
                            ) : '--'}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              isGraded ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {isGraded ? 'Graded' : 'Pending'}
                            </span>
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

        {/* ========================================================================= */}
        {/* 📈 TAB 3: GRADE SUMMARY & ANALYTICS */}
        {/* ========================================================================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">Academic Standing Overview</h3>
                <p className="text-xs text-slate-500 mt-1">Aggregated scoring profile across all evaluation components.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <div className="text-xs font-bold text-slate-400 uppercase">Estimated GPA</div>
                  <div className="text-3xl font-black text-indigo-700 mt-1">{getGradeInfo(avgQuizScore, 100).gpa}</div>
                  <div className="text-[11px] text-slate-400 font-semibold mt-1">4.0 Scale Standard</div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <div className="text-xs font-bold text-slate-400 uppercase">Letter Standing</div>
                  <div className="text-3xl font-black text-emerald-600 mt-1">{getGradeInfo(avgQuizScore, 100).letter}</div>
                  <div className="text-[11px] text-slate-400 font-semibold mt-1">Based on quiz average</div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <div className="text-xs font-bold text-slate-400 uppercase">Completion Rate</div>
                  <div className="text-3xl font-black text-blue-600 mt-1">
                    {safeAttempts.length > 0 ? `${Math.round((passedQuizzes.length / safeAttempts.length) * 100)}%` : '0%'}
                  </div>
                  <div className="text-[11px] text-slate-400 font-semibold mt-1">Tests Passed</div>
                </div>
              </div>
            </div>

            {/* Course-by-Course breakdown */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
              <h3 className="text-lg font-black text-slate-900">Course-by-Course Evaluation Breakdown</h3>
              <div className="space-y-3">
                {Object.entries(coursesMap).map(([cid, cname]) => {
                  const courseAttempts = safeAttempts.filter((a) => {
                    const qInfo = quizzesMap[String(a.quizId)];
                    return String(qInfo?.courseId) === String(cid);
                  });
                  const coursePassed = courseAttempts.filter((a) => a?.isPassed ?? a?.passed);

                  return (
                    <div key={cid} className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">📚 {cname}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {courseAttempts.length} Quizzes Attempted &nbsp;·&nbsp; {coursePassed.length} Passed
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {coursePassed.length > 0 && (
                          <button
                            onClick={() => setCertificateCourse({ id: cid, name: cname })}
                            className="px-3 py-1 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-slate-950 text-xs font-black rounded-full shadow-xs transition flex items-center gap-1"
                          >
                            <span>🎓</span>
                            <span>Certificate</span>
                          </button>
                        )}
                        <span className={`text-xs font-black px-3 py-1 rounded-full ${
                          coursePassed.length > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {courseAttempts.length > 0 ? `${Math.round((coursePassed.length / courseAttempts.length) * 100)}% Pass` : 'No Assessments'}
                        </span>
                        <Link
                          to={`/courses/${cid}`}
                          className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800"
                        >
                          Course Page →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 📜 Certificate of Completion Modal */}
      <CertificateModal
        isOpen={!!certificateCourse}
        onClose={() => setCertificateCourse(null)}
        course={certificateCourse}
        user={user}
      />
    </div>
  );
};

export default StudentResults;