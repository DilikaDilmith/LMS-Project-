import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { assignmentAPI, quizAPI, courseAPI } from '../../services/api';
import CertificateModal from '../../components/CertificateModal';
import toast from 'react-hot-toast';

/* ------------------------------------------------------------------ */
/*  Animated SVG ring                                                 */
/* ------------------------------------------------------------------ */
const ScoreRing = ({ value, max = 100, size = 64, stroke = 5, color }) => {
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = C * (1 - pct);
  const c = color || (pct >= 0.5 ? '#10b981' : '#f43f5e');
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-slate-100" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c} strokeWidth={stroke}
        strokeDasharray={C} strokeDashoffset={offset} strokeLinecap="round"
        className="transition-all duration-1000 ease-out" />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        className="rotate-90 origin-center fill-slate-800 text-[13px] font-black">{Math.round(pct * 100)}%</text>
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/*  Horizontal progress bar                                          */
/* ------------------------------------------------------------------ */
const ProgressBar = ({ value, max = 100, color = 'indigo' }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const colorMap = {
    emerald: 'from-emerald-500 to-teal-400',
    rose: 'from-rose-500 to-pink-400',
    indigo: 'from-indigo-500 to-violet-400',
    blue: 'from-blue-500 to-cyan-400',
    amber: 'from-amber-500 to-yellow-400',
  };
  return (
    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full bg-gradient-to-r ${colorMap[color] || colorMap.indigo} transition-all duration-700 ease-out`}
        style={{ width: `${pct}%` }} />
    </div>
  );
};

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
  const [activeTab, setActiveTab] = useState('quizzes');
  const [filterCourse, setFilterCourse] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [fadeIn, setFadeIn] = useState(false);

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
    if (effectiveStudentId) fetchResults();
    else setLoading(false);
    setTimeout(() => setFadeIn(true), 80);
  }, [effectiveStudentId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? 'Recently' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return 'Recently'; }
  };

  const getGradeInfo = (score, maxMarks = 100) => {
    if (maxMarks <= 0) return { letter: 'N/A', color: 'slate', gpa: '0.0', bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    const pct = Math.round((score / maxMarks) * 100);
    if (pct >= 90) return { letter: 'A+', color: 'emerald', gpa: '4.0', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (pct >= 80) return { letter: 'A', color: 'emerald', gpa: '3.7', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (pct >= 75) return { letter: 'B+', color: 'blue', gpa: '3.3', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (pct >= 70) return { letter: 'B', color: 'blue', gpa: '3.0', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (pct >= 60) return { letter: 'C', color: 'amber', gpa: '2.0', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (pct >= 50) return { letter: 'D', color: 'orange', gpa: '1.0', bg: 'bg-orange-50 text-orange-700 border-orange-200' };
    return { letter: 'F', color: 'rose', gpa: '0.0', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
  };

  /* ---- Data Fetching (unchanged logic) ---- */
  const fetchResults = async () => {
    setLoading(true);
    try {
      const [quizAttemptsRes, submissionsRes, enrolledRes] = await Promise.all([
        quizAPI.getStudentResults(effectiveStudentId).catch((err) => { console.warn('Failed to load student quiz results:', err); return { data: [] }; }),
        assignmentAPI.getStudentSubmissions(effectiveStudentId).catch((err) => { console.warn('Failed to load student assignments:', err); return { data: [] }; }),
        courseAPI.getEnrolled(effectiveStudentId).catch((err) => { console.warn('Failed to load student courses:', err); return { data: [] }; }),
      ]);

      const rawAttempts = Array.isArray(quizAttemptsRes?.data) ? quizAttemptsRes.data : [];
      const rawSubmissions = Array.isArray(submissionsRes?.data) ? submissionsRes.data : [];
      const rawCourses = Array.isArray(enrolledRes?.data) ? enrolledRes.data : [];

      setQuizAttempts(rawAttempts);
      setSubmissions(rawSubmissions);

      const cMap = {};
      rawCourses.forEach((c) => {
        const id = c.courseId ?? c.id;
        const name = c.courseName ?? c.name ?? c.title ?? `Course #${id}`;
        if (id) cMap[String(id)] = name;
      });

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
                qMap[String(q.id)] = { title: q.title || `Quiz #${q.id}`, passingScore: q.passingScore || 50, durationMinutes: q.durationMinutes || 30, courseId: q.courseId ?? cid, courseName: cMap[String(cid)] || `Course #${cid}` };
              });
              (Array.isArray(aRes?.data) ? aRes.data : []).forEach((a) => {
                aMap[String(a.id)] = { title: a.title || `Assignment #${a.id}`, maxMarks: a.maxMarks || 100, courseId: a.courseId ?? cid, courseName: cMap[String(cid)] || `Course #${cid}` };
              });
            } catch (e) { console.warn(`Error loading course ${cid} details:`, e); }
          })
        );
      }

      const missingQuizIds = [...new Set(rawAttempts.map((a) => a.quizId).filter((qid) => qid && !qMap[String(qid)]))];
      if (missingQuizIds.length > 0) {
        await Promise.all(
          missingQuizIds.map(async (qid) => {
            try {
              const res = await quizAPI.getById(qid);
              if (res.data) {
                const q = res.data;
                const cid = q.courseId;
                let cName = cid ? cMap[String(cid)] : null;
                if (!cName && cid) { try { const cRes = await courseAPI.getById(cid); cName = cRes.data?.name || cRes.data?.title || `Course #${cid}`; cMap[String(cid)] = cName; } catch {} }
                qMap[String(q.id)] = { title: q.title || `Quiz #${q.id}`, passingScore: q.passingScore || 50, durationMinutes: q.durationMinutes || 30, courseId: cid, courseName: cName || (cid ? `Course #${cid}` : 'Enrolled Course') };
              }
            } catch (err) { console.warn(`Failed to fetch quiz ${qid}:`, err); }
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

  const academicStanding = useMemo(() => {
    if (safeAttempts.length === 0 && safeSubmissions.length === 0) return { label: 'Enrolled & Active', color: 'blue', icon: '🎓' };
    if (passRate >= 80 && avgQuizScore >= 75) return { label: "Dean's Honors", color: 'emerald', icon: '🌟' };
    if (passRate >= 50) return { label: 'Good Standing', color: 'indigo', icon: '✨' };
    return { label: 'Progress Required', color: 'amber', icon: '📈' };
  }, [passRate, avgQuizScore, safeAttempts.length, safeSubmissions.length]);

  // Filtered data
  const filteredAttempts = useMemo(() => {
    return safeAttempts.filter((a) => {
      const qInfo = quizzesMap[String(a.quizId)];
      const title = (qInfo?.title || `Quiz #${a.quizId}`).toLowerCase();
      const courseName = (qInfo?.courseName || '').toLowerCase();
      const query = searchQuery.toLowerCase();
      if (filterCourse !== 'ALL') { if (qInfo?.courseId && String(qInfo.courseId) !== String(filterCourse)) return false; }
      const isPassed = a?.isPassed ?? a?.passed ?? ((a?.score ?? 0) >= (qInfo?.passingScore || 50));
      if (filterStatus === 'PASSED' && !isPassed) return false;
      if (filterStatus === 'FAILED' && isPassed) return false;
      if (query && !title.includes(query) && !courseName.includes(query) && !String(a.quizId).includes(query)) return false;
      return true;
    });
  }, [safeAttempts, quizzesMap, filterCourse, filterStatus, searchQuery]);

  const filteredSubmissions = useMemo(() => {
    return safeSubmissions.filter((s) => {
      const aInfo = assignmentsMap[String(s.assignmentId)];
      const title = (aInfo?.title || '').toLowerCase();
      const courseName = (aInfo?.courseName || '').toLowerCase();
      const query = searchQuery.toLowerCase();
      if (filterCourse !== 'ALL' && String(aInfo?.courseId) !== String(filterCourse)) return false;
      if (filterStatus === 'GRADED' && s.status !== 'GRADED') return false;
      if (filterStatus === 'PENDING' && s.status === 'GRADED') return false;
      if (query && !title.includes(query) && !courseName.includes(query) && !String(s.assignmentId).includes(query)) return false;
      return true;
    });
  }, [safeSubmissions, assignmentsMap, filterCourse, filterStatus, searchQuery]);

  /* ================================================================
     SVG ICONS (reusable)
  ================================================================ */
  const icons = {
    chart: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    back: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
    print: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>,
    quiz: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
    assignment: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
    analytics: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    search: <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
    grid: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
    table: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
    eye: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
    award: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
    check: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>,
  };

  /* ================================================================
     LOADING STATE
  ================================================================ */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto w-20 h-20 mb-5">
            <div className="w-20 h-20 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-indigo-600">{icons.chart}</div>
          </div>
          <h3 className="text-slate-800 font-extrabold text-lg">Loading Academic Transcript</h3>
          <p className="text-slate-400 text-sm mt-1">Aggregating quizzes and assignment evaluations…</p>
        </div>
      </div>
    );
  }

  /* ================================================================
     TAB CONFIG
  ================================================================ */
  const tabs = [
    { key: 'quizzes', label: 'Quizzes & Tests', count: safeAttempts.length, icon: icons.quiz },
    { key: 'assignments', label: 'Assignments', count: safeSubmissions.length, icon: icons.assignment },
    { key: 'analytics', label: 'Grade Summary', count: null, icon: icons.analytics },
  ];

  /* ================================================================
     MAIN RENDER
  ================================================================ */
  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 font-sans text-slate-800 pb-24 transition-opacity duration-700 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>

      {/* ============================================================
          STICKY NAV
      ============================================================ */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-violet-200/60">
              {icons.chart}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight">Academic Transcript</h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-violet-50 text-violet-700 border border-violet-200">
                  Official
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                ID #{studentId} · {user?.firstName} {user?.lastName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition border border-slate-200" title="Print Transcript">
              {icons.print}<span className="hidden md:inline">Print</span>
            </button>
            <Link to="/student/quizzes" className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl transition border border-indigo-200">
              {icons.quiz}<span className="hidden sm:inline">Quizzes</span>
            </Link>
            <Link to="/dashboard" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-4 py-2 rounded-xl transition">
              {icons.back} Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">

        {/* ============================================================
            HERO BANNER
        ============================================================ */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-950 via-indigo-950 to-slate-950 px-6 sm:px-8 py-8 shadow-2xl shadow-indigo-900/30">
          <div className="absolute top-0 right-0 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap mb-3">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 text-indigo-200 border border-white/10 backdrop-blur-md">
                  {academicStanding.icon} {academicStanding.label}
                </span>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {Object.keys(coursesMap).length} Active Course{Object.keys(coursesMap).length !== 1 ? 's' : ''}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.username}'s Transcript
              </h2>
              <p className="text-indigo-200/80 text-sm mt-1.5 max-w-xl">
                Comprehensive performance metrics, scorecards, and evaluation feedback across all course modules.
              </p>
            </div>

            {/* KPI capsules */}
            <div className="flex flex-wrap gap-2.5 shrink-0">
              {[
                { label: 'Pass Rate', value: `${passRate}%`, color: 'from-emerald-500/20 to-emerald-500/5', text: 'text-emerald-300' },
                { label: 'Avg Score', value: `${avgQuizScore}`, color: 'from-indigo-500/20 to-indigo-500/5', text: 'text-indigo-200' },
                { label: 'GPA', value: getGradeInfo(avgQuizScore, 100).gpa, color: 'from-violet-500/20 to-violet-500/5', text: 'text-violet-200' },
                { label: 'Grade', value: getGradeInfo(avgQuizScore, 100).letter, color: 'from-amber-500/20 to-amber-500/5', text: 'text-amber-300' },
              ].map((s) => (
                <div key={s.label} className={`bg-gradient-to-b ${s.color} backdrop-blur border border-white/10 rounded-2xl px-4 py-2.5 text-center min-w-[72px]`}>
                  <p className={`text-2xl font-black ${s.text}`}>{s.value}</p>
                  <p className="text-[9px] font-semibold text-indigo-200/50 uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================
            EXECUTIVE METRIC CARDS
        ============================================================ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Quizzes Passed */}
          <button onClick={() => { setActiveTab('quizzes'); setFilterStatus('PASSED'); }}
            className="group bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all text-left w-full">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quizzes Passed</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                {icons.check}
              </div>
            </div>
            <p className="text-3xl font-black text-emerald-600">{passedQuizzes.length} <span className="text-sm text-slate-400 font-bold">/ {safeAttempts.length}</span></p>
            <ProgressBar value={passedQuizzes.length} max={safeAttempts.length || 1} color="emerald" />
            <p className="text-[10px] text-emerald-600 font-bold mt-2 group-hover:underline">View passed →</p>
          </button>

          {/* Average Score */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Quiz Score</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </div>
            </div>
            <p className="text-3xl font-black text-indigo-600">{avgQuizScore} <span className="text-sm text-slate-400 font-bold">pts</span></p>
            <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400">Standing</span>
              <span className={`px-2 py-0.5 rounded-md font-black text-[10px] border ${getGradeInfo(avgQuizScore, 100).bg}`}>Grade {getGradeInfo(avgQuizScore, 100).letter}</span>
            </div>
          </div>

          {/* Graded Assignments */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assignments Graded</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">{icons.assignment}</div>
            </div>
            <p className="text-3xl font-black text-blue-600">{gradedSubmissions.length} <span className="text-sm text-slate-400 font-bold">/ {safeSubmissions.length}</span></p>
            <ProgressBar value={gradedSubmissions.length} max={safeSubmissions.length || 1} color="blue" />
            <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-slate-400">
              <span>Evaluated</span>
              <span className="text-blue-700 font-extrabold">{safeSubmissions.length > 0 ? Math.round((gradedSubmissions.length / safeSubmissions.length) * 100) : 0}%</span>
            </div>
          </div>

          {/* Total Evaluations */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Evaluations</span>
              <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">{icons.analytics}</div>
            </div>
            <p className="text-3xl font-black text-violet-700">{safeAttempts.length + safeSubmissions.length}</p>
            <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] font-bold text-slate-400">
              <span>Workload</span>
              <span className="text-violet-700 font-extrabold">Complete</span>
            </div>
          </div>
        </div>

        {/* ============================================================
            QUIZZES PASSED — MINI SECTION
        ============================================================ */}
        {safeAttempts.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-50/80 to-teal-50/60 border-b border-emerald-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">{icons.award}</div>
                <div>
                  <h3 className="text-sm font-extrabold text-emerald-900">Quizzes Passed</h3>
                  <p className="text-[10px] text-emerald-600 font-medium">{passedQuizzes.length} of {safeAttempts.length} · {passRate}% pass rate</p>
                </div>
              </div>
              <button onClick={() => { setActiveTab('quizzes'); setFilterStatus('PASSED'); }}
                className="text-[11px] font-extrabold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-xl transition border border-emerald-200">
                View All →
              </button>
            </div>

            {passedQuizzes.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mb-3">{icons.quiz}</div>
                <p className="text-sm font-bold text-slate-700">No quizzes passed yet</p>
                <p className="text-xs text-slate-400 mt-1">Attempt quizzes in your enrolled courses.</p>
                <Link to="/student/quizzes" className="mt-4 inline-block text-xs font-extrabold text-indigo-600 hover:text-indigo-800 underline underline-offset-2">
                  Go to My Quizzes →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {passedQuizzes.map((attempt) => {
                  const quizInfo = quizzesMap[String(attempt.quizId)];
                  const title = quizInfo?.title || `Quiz #${attempt.quizId}`;
                  const courseName = quizInfo?.courseName || (quizInfo?.courseId ? coursesMap[String(quizInfo.courseId)] : null) || 'Enrolled Course';
                  const score = attempt.score ?? 0;
                  const grade = getGradeInfo(score, 100);
                  const attemptDate = attempt.attemptedAt || attempt.endTime || attempt.startTime;

                  return (
                    <div key={attempt.id || attempt.quizId} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-emerald-50/30 transition group">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">{icons.check}</div>
                        <div className="min-w-0">
                          <p className="text-sm font-extrabold text-slate-900 truncate">{title}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-medium">
                            <span>{courseName}</span>
                            <span className="text-slate-200">·</span>
                            <span>{formatDate(attemptDate)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="hidden md:block w-36 shrink-0">
                        <ProgressBar value={score} max={100} color="emerald" />
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1">
                          <span>{score} pts</span>
                          <span>Pass: {quizInfo?.passingScore || 50}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded-lg font-black text-[10px] border ${grade.bg}`}>{grade.letter}</span>
                        <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">{score} pts</span>
                        <button onClick={() => navigate(`/student/quiz/${attempt.quizId}`)}
                          className="flex items-center gap-1 text-[11px] font-extrabold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-xl transition active:scale-95">
                          {icons.eye} Review
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            CONTROLS & FILTER BAR
        ============================================================ */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 print:hidden">
          {/* Tab Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl shrink-0 overflow-x-auto">
            {tabs.map((t) => (
              <button key={t.key} onClick={() => { setActiveTab(t.key); setFilterStatus('ALL'); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                  activeTab === t.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}>
                {t.icon}
                <span>{t.label}{t.count != null ? ` (${t.count})` : ''}</span>
              </button>
            ))}
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 min-w-[160px]">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">{icons.search}</div>
              <input type="text" placeholder="Search assessment…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition" />
            </div>

            {Object.keys(coursesMap).length > 0 && (
              <select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 transition cursor-pointer">
                <option value="ALL">All Courses</option>
                {Object.entries(coursesMap).map(([cid, cname]) => <option key={cid} value={cid}>{cname}</option>)}
              </select>
            )}

            {activeTab === 'quizzes' && (
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 transition cursor-pointer">
                <option value="ALL">All Results</option>
                <option value="PASSED">Passed Only</option>
                <option value="FAILED">Needs Retake</option>
              </select>
            )}

            {activeTab === 'assignments' && (
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 transition cursor-pointer">
                <option value="ALL">All Submissions</option>
                <option value="GRADED">Evaluated</option>
                <option value="PENDING">Under Review</option>
              </select>
            )}

            {activeTab !== 'analytics' && (
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`} title="Grid View">{icons.grid}</button>
                <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg transition ${viewMode === 'table' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`} title="Table View">{icons.table}</button>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================
            TAB 1: QUIZZES
        ============================================================ */}
        {activeTab === 'quizzes' && (
          <div>
            {filteredAttempts.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 shadow-sm">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-300 mb-3">{icons.quiz}</div>
                <h4 className="text-lg font-black text-slate-800">No Quiz Attempts Found</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {searchQuery || filterStatus !== 'ALL' || filterCourse !== 'ALL'
                    ? 'No quiz results match your active filters.'
                    : "You haven't attempted any quizzes yet."}
                </p>
                <Link to="/student/quizzes" className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-200 transition">
                  Explore Quizzes
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </Link>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredAttempts.map((attempt, idx) => {
                  const isPassed = attempt?.isPassed ?? attempt?.passed;
                  const quizInfo = quizzesMap[String(attempt.quizId)];
                  const title = quizInfo?.title || `Quiz Assessment #${attempt.quizId}`;
                  const courseName = quizInfo?.courseName || (quizInfo?.courseId ? coursesMap[String(quizInfo.courseId)] : null);
                  const attemptDate = attempt.attemptedAt || attempt.endTime || attempt.startTime;
                  const score = attempt.score ?? 0;
                  const grade = getGradeInfo(score, 100);

                  return (
                    <div key={attempt.id || attempt.quizId}
                      className="group bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col overflow-hidden"
                      style={{ animationDelay: `${idx * 40}ms` }}>
                      {/* accent bar */}
                      <div className={`h-1.5 ${isPassed ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-rose-400 to-pink-500'}`} />

                      <div className="px-5 pt-5 flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${isPassed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                              {isPassed ? '✅ Passed' : '❌ Failed'}
                            </span>
                            {courseName && <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">{courseName}</span>}
                          </div>
                          <h3 className="text-[15px] font-extrabold text-slate-900 leading-snug line-clamp-2 group-hover:text-indigo-700 transition-colors">{title}</h3>
                          <p className="text-[11px] text-slate-400 font-medium mt-1">{formatDate(attemptDate)}</p>
                        </div>
                        <ScoreRing value={score} max={100} color={isPassed ? '#10b981' : '#f43f5e'} />
                      </div>

                      <div className="px-5 py-4 flex-1">
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Score</span>
                            <div className="text-xl font-black text-slate-900">{score} <span className="text-xs text-slate-400 font-bold">pts</span></div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Grade</span>
                            <div><span className={`px-2.5 py-1 rounded-lg font-black text-xs border ${grade.bg}`}>{grade.letter}</span></div>
                          </div>
                        </div>
                      </div>

                      <div className="px-5 pb-5 flex gap-2">
                        {quizInfo?.courseId && (
                          <Link to={`/courses/${quizInfo.courseId}`} className="flex-1 py-2.5 text-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition">
                            Course Page
                          </Link>
                        )}
                        <button onClick={() => navigate(`/student/quiz/${attempt.quizId}`)}
                          className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-200/50 transition active:scale-[0.97] flex items-center justify-center gap-1.5">
                          {icons.eye} View Result
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* TABLE VIEW */
              <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
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
                            <td className="py-3.5 px-5 font-bold text-slate-900">{title}</td>
                            <td className="py-3.5 px-4 text-slate-500">{courseName}</td>
                            <td className="py-3.5 px-4 text-slate-400">{formatDate(attemptDate)}</td>
                            <td className="py-3.5 px-4 text-center font-black text-slate-900">{score} pts</td>
                            <td className="py-3.5 px-4 text-center"><span className={`px-2 py-0.5 rounded font-black text-[10px] border ${grade.bg}`}>{grade.letter}</span></td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${isPassed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                {isPassed ? 'Passed' : 'Failed'}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              <button onClick={() => navigate(`/student/quiz/${attempt.quizId}`)}
                                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[11px] rounded-lg transition border border-indigo-200">
                                Review
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            TAB 2: ASSIGNMENTS
        ============================================================ */}
        {activeTab === 'assignments' && (
          <div>
            {filteredSubmissions.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 shadow-sm">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-300 mb-3">{icons.assignment}</div>
                <h4 className="text-lg font-black text-slate-800">No Assignment Submissions Found</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {searchQuery || filterStatus !== 'ALL' || filterCourse !== 'ALL'
                    ? 'No submissions match your active filters.'
                    : "You haven't submitted any assignments yet."}
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredSubmissions.map((sub, idx) => {
                  const isGraded = sub.status === 'GRADED';
                  const asgnInfo = assignmentsMap[String(sub.assignmentId)];
                  const title = asgnInfo?.title || `Assignment #${sub.assignmentId}`;
                  const courseName = asgnInfo?.courseName || (asgnInfo?.courseId ? coursesMap[String(asgnInfo.courseId)] : null);
                  const marks = sub.marks ?? 0;
                  const maxMarks = asgnInfo?.maxMarks || 100;
                  const grade = getGradeInfo(marks, maxMarks);

                  return (
                    <div key={sub.id}
                      className="group bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col overflow-hidden"
                      style={{ animationDelay: `${idx * 40}ms` }}>
                      <div className={`h-1.5 ${isGraded ? 'bg-gradient-to-r from-blue-400 to-cyan-500' : 'bg-gradient-to-r from-amber-400 to-yellow-500'}`} />

                      <div className="px-5 pt-5 flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${isGraded ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                              {isGraded ? '✅ Graded' : '⏳ Under Review'}
                            </span>
                            {courseName && <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">{courseName}</span>}
                          </div>
                          <h3 className="text-[15px] font-extrabold text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors">{title}</h3>
                          <p className="text-[11px] text-slate-400 font-medium mt-1">Submitted {formatDate(sub.submittedAt)}</p>
                        </div>
                        {isGraded ? (
                          <ScoreRing value={marks} max={maxMarks} color="#3b82f6" />
                        ) : (
                          <div className="shrink-0 w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500">
                            <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                        )}
                      </div>

                      <div className="px-5 py-4 flex-1 space-y-3">
                        {isGraded ? (
                          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Marks</span>
                              <div className="text-xl font-black text-blue-700">{marks} <span className="text-xs text-slate-400 font-bold">/ {maxMarks}</span></div>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Grade</span>
                              <div><span className={`px-2.5 py-1 rounded-lg font-black text-xs border ${grade.bg}`}>{grade.letter}</span></div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100 flex items-center gap-2 text-xs font-bold text-amber-800">
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Awaiting evaluation by your instructor.
                          </div>
                        )}

                        {sub.feedback && (
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                            <span className="font-bold text-slate-900 block mb-0.5">💬 Feedback:</span>
                            "{sub.feedback}"
                          </div>
                        )}
                      </div>

                      <div className="px-5 pb-5 flex justify-end">
                        <Link to="/assignments" className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition">
                          View All Assignments →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* TABLE VIEW */
              <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
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
                            <td className="py-3.5 px-4 text-slate-500">{courseName}</td>
                            <td className="py-3.5 px-4 text-slate-400">{formatDate(sub.submittedAt)}</td>
                            <td className="py-3.5 px-4 text-center font-black text-slate-900">{isGraded ? `${marks} / ${maxMarks}` : '--'}</td>
                            <td className="py-3.5 px-4 text-center">{isGraded ? <span className={`px-2 py-0.5 rounded font-black text-[10px] border ${grade.bg}`}>{grade.letter}</span> : '--'}</td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${isGraded ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                                {isGraded ? 'Graded' : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            TAB 3: GRADE SUMMARY & ANALYTICS
        ============================================================ */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Academic Overview */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">Academic Standing Overview</h3>
                <p className="text-xs text-slate-400 mt-1">Aggregated scoring profile across all evaluation components.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Estimated GPA', value: getGradeInfo(avgQuizScore, 100).gpa, sub: '4.0 Scale', color: 'indigo' },
                  { label: 'Letter Standing', value: getGradeInfo(avgQuizScore, 100).letter, sub: 'Based on quiz average', color: 'emerald' },
                  { label: 'Completion Rate', value: safeAttempts.length > 0 ? `${Math.round((passedQuizzes.length / safeAttempts.length) * 100)}%` : '0%', sub: 'Tests Passed', color: 'blue' },
                ].map((m) => (
                  <div key={m.label} className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 text-center hover:shadow-md transition">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{m.label}</div>
                    <div className={`text-3xl font-black text-${m.color}-600 mt-1`}>{m.value}</div>
                    <div className="text-[11px] text-slate-400 font-semibold mt-1">{m.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Course-by-Course */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-lg font-black text-slate-900">Course-by-Course Breakdown</h3>
              <div className="space-y-3">
                {Object.entries(coursesMap).map(([cid, cname]) => {
                  const courseAttempts = safeAttempts.filter((a) => { const qInfo = quizzesMap[String(a.quizId)]; return String(qInfo?.courseId) === String(cid); });
                  const coursePassed = courseAttempts.filter((a) => a?.isPassed ?? a?.passed);
                  const coursePassRate = courseAttempts.length > 0 ? Math.round((coursePassed.length / courseAttempts.length) * 100) : 0;

                  return (
                    <div key={cid} className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50/80 to-white hover:shadow-md transition">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm">{cname}</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">{courseAttempts.length} Attempted · {coursePassed.length} Passed</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {coursePassed.length > 0 && (
                          <button onClick={() => setCertificateCourse({ id: cid, name: cname })}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-slate-950 text-xs font-black rounded-xl shadow-sm transition flex items-center gap-1.5">
                            {icons.award} Certificate
                          </button>
                        )}
                        <span className={`text-xs font-black px-3 py-1.5 rounded-xl ${coursePassed.length > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
                          {courseAttempts.length > 0 ? `${coursePassRate}% Pass` : 'No Assessments'}
                        </span>
                        <Link to={`/courses/${cid}`} className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800 underline underline-offset-2">
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

      {/* Certificate Modal */}
      <CertificateModal isOpen={!!certificateCourse} onClose={() => setCertificateCourse(null)} course={certificateCourse} user={user} />
    </div>
  );
};

export default StudentResults;