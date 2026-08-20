import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { assignmentAPI, quizAPI, courseAPI } from '../../services/api';
import CertificateModal from '../../components/CertificateModal';
import toast from 'react-hot-toast';

/* ─────────────────────────────────────────────────────────────────────────
   SVG Radial Progress Ring
───────────────────────────────────────────────────────────────────────── */
const RadialRing = ({ pct = 0, size = 88, stroke = 8, colorClass = '#6366f1', label, sublabel }) => {
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const offset = C * (1 - Math.min(pct, 100) / 100);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90 absolute inset-0">
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} />
          <circle
            cx={size/2} cy={size/2} r={r} fill="none"
            stroke={colorClass} strokeWidth={stroke}
            strokeDasharray={C} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)' }}
          />
        </svg>
        {/* percentage label rendered as HTML so color is always right */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span style={{ fontSize: size * 0.19, fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>
            {Math.round(pct)}%
          </span>
        </div>
      </div>
      {label    && <span className="text-[11px] font-bold text-white/90 text-center leading-tight whitespace-nowrap">{label}</span>}
      {sublabel && <span className="text-[10px] text-indigo-200/60 font-medium text-center whitespace-nowrap">{sublabel}</span>}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   Thin score bar
───────────────────────────────────────────────────────────────────────── */
const ScoreBar = ({ value = 0, max = 100, passed }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${passed ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-rose-500 to-pink-400'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   Grade badge
───────────────────────────────────────────────────────────────────────── */
const GradeBadge = ({ score, max = 100 }) => {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  if (pct >= 90) return <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">A+</span>;
  if (pct >= 80) return <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">A</span>;
  if (pct >= 75) return <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-black bg-blue-50 text-blue-700 border border-blue-200">B+</span>;
  if (pct >= 70) return <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-black bg-blue-50 text-blue-700 border border-blue-200">B</span>;
  if (pct >= 60) return <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-black bg-amber-50 text-amber-700 border border-amber-200">C</span>;
  if (pct >= 50) return <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-black bg-orange-50 text-orange-700 border border-orange-200">D</span>;
  return <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200">F</span>;
};

const getGradeInfo = (score, max = 100) => {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  if (pct >= 90) return { letter: 'A+', gpa: '4.0', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (pct >= 80) return { letter: 'A',  gpa: '3.7', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (pct >= 75) return { letter: 'B+', gpa: '3.3', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
  if (pct >= 70) return { letter: 'B',  gpa: '3.0', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
  if (pct >= 60) return { letter: 'C',  gpa: '2.0', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
  if (pct >= 50) return { letter: 'D',  gpa: '1.0', bg: 'bg-orange-50 text-orange-700 border-orange-200' };
  return { letter: 'F', gpa: '0.0', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
};

/* ═══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════ */
const StudentResults = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const studentId = user?.id;

  const [submissions,    setSubmissions]    = useState([]);
  const [quizAttempts,   setQuizAttempts]   = useState([]);
  const [coursesMap,     setCoursesMap]     = useState({});
  const [quizzesMap,     setQuizzesMap]     = useState({});
  const [assignmentsMap, setAssignmentsMap] = useState({});
  const [loading,        setLoading]        = useState(true);
  const [certificateCourse, setCertificateCourse] = useState(null);
  const [mounted, setMounted] = useState(false);

  // View controls
  const [activeTab,    setActiveTab]    = useState('quizzes');
  const [filterCourse, setFilterCourse] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [viewMode,     setViewMode]     = useState('grid');

  const effectiveStudentId =
    studentId ||
    (() => { try { return JSON.parse(localStorage.getItem('user'))?.id; } catch { return null; } })();

  useEffect(() => {
    if (effectiveStudentId) fetchResults();
    else setLoading(false);
    setTimeout(() => setMounted(true), 100);
  }, [effectiveStudentId]);

  const formatDate = (d) => {
    if (!d) return '—';
    try {
      const date = new Date(d);
      return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return '—'; }
  };

  const fetchResults = async () => {
    setLoading(true);
    try {
      const [quizRes, subRes, enrollRes] = await Promise.all([
        quizAPI.getStudentResults(effectiveStudentId).catch(() => ({ data: [] })),
        assignmentAPI.getStudentSubmissions(effectiveStudentId).catch(() => ({ data: [] })),
        courseAPI.getEnrolled(effectiveStudentId).catch(() => ({ data: [] })),
      ]);

      const rawAttempts     = Array.isArray(quizRes?.data)    ? quizRes.data    : [];
      const rawSubmissions  = Array.isArray(subRes?.data)     ? subRes.data     : [];
      const rawCourses      = Array.isArray(enrollRes?.data)  ? enrollRes.data  : [];

      setQuizAttempts(rawAttempts);
      setSubmissions(rawSubmissions);

      const cMap = {};
      rawCourses.forEach((c) => {
        const id = c.courseId ?? c.id;
        if (id) cMap[String(id)] = c.courseName ?? c.name ?? c.title ?? `Course #${id}`;
      });

      const courseIds = rawCourses.map((c) => c.courseId ?? c.id).filter(Boolean);
      const qMap = {}, aMap = {};

      if (courseIds.length > 0) {
        await Promise.all(courseIds.map(async (cid) => {
          try {
            const [qRes2, aRes] = await Promise.all([
              quizAPI.getByCourse(cid).catch(() => ({ data: [] })),
              assignmentAPI.getByCourse(cid).catch(() => ({ data: [] })),
            ]);
            (Array.isArray(qRes2?.data) ? qRes2.data : []).forEach((q) => {
              qMap[String(q.id)] = { title: q.title || `Quiz #${q.id}`, passingScore: q.passingScore || 50, durationMinutes: q.durationMinutes || 30, courseId: q.courseId ?? cid, courseName: cMap[String(cid)] || `Course #${cid}` };
            });
            (Array.isArray(aRes?.data) ? aRes.data : []).forEach((a) => {
              aMap[String(a.id)] = { title: a.title || `Assignment #${a.id}`, maxMarks: a.maxMarks || 100, courseId: a.courseId ?? cid, courseName: cMap[String(cid)] || `Course #${cid}` };
            });
          } catch {}
        }));
      }

      const missingIds = [...new Set(rawAttempts.map((a) => a.quizId).filter((qid) => qid && !qMap[String(qid)]))];
      if (missingIds.length > 0) {
        await Promise.all(missingIds.map(async (qid) => {
          try {
            const res = await quizAPI.getById(qid);
            if (res.data) {
              const q = res.data; const cid = q.courseId;
              let cName = cid ? cMap[String(cid)] : null;
              if (!cName && cid) { try { const cr = await courseAPI.getById(cid); cName = cr.data?.name || cr.data?.title || `Course #${cid}`; cMap[String(cid)] = cName; } catch {} }
              qMap[String(q.id)] = { title: q.title || `Quiz #${q.id}`, passingScore: q.passingScore || 50, durationMinutes: q.durationMinutes || 30, courseId: cid, courseName: cName || (cid ? `Course #${cid}` : 'Enrolled Course') };
            }
          } catch {}
        }));
      }

      setCoursesMap(cMap); setQuizzesMap(qMap); setAssignmentsMap(aMap);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load academic transcript');
    } finally { setLoading(false); }
  };

  /* ── Derived data ── */
  const safeAttempts    = Array.isArray(quizAttempts) ? quizAttempts : [];
  const safeSubmissions = Array.isArray(submissions)  ? submissions  : [];

  const passedQuizzes       = safeAttempts.filter((a) => a?.isPassed ?? a?.passed ?? false);
  const gradedSubmissions   = safeSubmissions.filter((s) => s?.status === 'GRADED');
  const totalQuizScore      = safeAttempts.reduce((s, a) => s + (a.score || 0), 0);
  const avgQuizScore        = safeAttempts.length > 0 ? Math.round(totalQuizScore / safeAttempts.length) : 0;
  const passRate            = safeAttempts.length > 0 ? Math.round((passedQuizzes.length / safeAttempts.length) * 100) : 0;
  const gradeRate           = safeSubmissions.length > 0 ? Math.round((gradedSubmissions.length / safeSubmissions.length) * 100) : 0;

  const academicStanding = useMemo(() => {
    if (safeAttempts.length === 0 && safeSubmissions.length === 0) return { label: 'Enrolled & Active', color: '#6366f1', ring: '#6366f1', icon: '🎓' };
    if (passRate >= 80 && avgQuizScore >= 75) return { label: "Dean's Honors Standing", color: '#10b981', ring: '#10b981', icon: '🌟' };
    if (passRate >= 50) return { label: 'Good Academic Standing', color: '#6366f1', ring: '#6366f1', icon: '✨' };
    return { label: 'Academic Progress Required', color: '#f59e0b', ring: '#f59e0b', icon: '📈' };
  }, [passRate, avgQuizScore, safeAttempts.length, safeSubmissions.length]);

  /* ── Filtered quiz attempts ── */
  const filteredAttempts = useMemo(() => safeAttempts.filter((a) => {
    const qInfo = quizzesMap[String(a.quizId)];
    if (filterCourse !== 'ALL' && String(qInfo?.courseId) !== String(filterCourse)) return false;
    const passed = a?.isPassed ?? a?.passed ?? false;
    if (filterStatus === 'PASSED' && !passed) return false;
    if (filterStatus === 'FAILED' && passed) return false;
    const q = searchQuery.toLowerCase();
    if (q && !(qInfo?.title || '').toLowerCase().includes(q) && !(qInfo?.courseName || '').toLowerCase().includes(q)) return false;
    return true;
  }), [safeAttempts, quizzesMap, filterCourse, filterStatus, searchQuery]);

  /* ── Filtered submissions ── */
  const filteredSubmissions = useMemo(() => safeSubmissions.filter((s) => {
    const aInfo = assignmentsMap[String(s.assignmentId)];
    if (filterCourse !== 'ALL' && String(aInfo?.courseId) !== String(filterCourse)) return false;
    if (filterStatus === 'GRADED'  && s.status !== 'GRADED') return false;
    if (filterStatus === 'PENDING' && s.status === 'GRADED') return false;
    const q = searchQuery.toLowerCase();
    if (q && !(aInfo?.title || '').toLowerCase().includes(q) && !(aInfo?.courseName || '').toLowerCase().includes(q)) return false;
    return true;
  }), [safeSubmissions, assignmentsMap, filterCourse, filterStatus, searchQuery]);

  /* ════════════════════════════════════════════════
     LOADING
  ════════════════════════════════════════════════ */
  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 flex items-center justify-center">
      <div className="text-center">
        <div className="relative mx-auto w-20 h-20 mb-5">
          <div className="w-20 h-20 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-7 h-7 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
        <h3 className="text-slate-800 font-extrabold text-lg">Loading Academic Transcript</h3>
        <p className="text-slate-400 text-sm mt-1">Compiling your performance data…</p>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════
     MAIN RENDER
  ════════════════════════════════════════════════ */
  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 font-sans text-slate-800 pb-24 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>

      {/* ──────────────────────────────────────────────
          STICKY NAV
      ────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200/60 shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight">Academic Transcript</h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">Official Record</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {user?.firstName} {user?.lastName} · ID #{studentId}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => window.print()} className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition border border-slate-200">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Print
            </button>
            <Link to="/student/quizzes" className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl transition border border-indigo-200">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              Quizzes
            </Link>
            <Link to="/dashboard" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-700 bg-slate-100 hover:bg-indigo-50 px-4 py-2 rounded-xl transition">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">

        {/* ──────────────────────────────────────────────
            HERO BANNER
        ────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-violet-950 to-slate-950 shadow-2xl shadow-indigo-900/30 border border-indigo-900/40">
          {/* decorative blobs */}
          <div className="pointer-events-none absolute -top-20 -right-20 w-80 h-80 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 left-1/4 w-72 h-72 rounded-full bg-indigo-600/10 blur-3xl" />
          <div className="pointer-events-none absolute top-4 left-1/2 w-1 h-1 rounded-full bg-white/30 shadow-[0_0_60px_30px_rgba(255,255,255,0.04)]" />

          <div className="relative z-10 px-6 sm:px-8 py-8 flex flex-col lg:flex-row lg:items-center gap-8">
            {/* Left: identity */}
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur text-[11px] font-bold text-indigo-200 uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  {academicStanding.icon} {academicStanding.label}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/25 text-[11px] font-bold text-emerald-300">
                  {Object.keys(coursesMap).length} Enrolled Course{Object.keys(coursesMap).length !== 1 ? 's' : ''}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}'s` : `${user?.username}'s`} Transcript
              </h2>
              <p className="text-sm text-indigo-200/70 max-w-xl leading-relaxed">
                Comprehensive performance metrics, score cards, and evaluation feedback across all enrolled course modules.
              </p>

              {/* Quick stat chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { val: safeAttempts.length,     label: 'Quiz Attempts',   color: 'bg-white/10 text-indigo-200 border-white/10' },
                  { val: passedQuizzes.length,     label: 'Quizzes Passed',  color: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/20' },
                  { val: safeSubmissions.length,   label: 'Submissions',     color: 'bg-blue-500/15 text-blue-300 border-blue-400/20' },
                  { val: gradedSubmissions.length, label: 'Graded',          color: 'bg-violet-500/15 text-violet-300 border-violet-400/20' },
                ].map((s) => (
                  <div key={s.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur text-xs font-bold ${s.color}`}>
                    <span className="text-lg font-black">{s.val}</span>
                    <span className="opacity-80">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: 3 Radial Rings */}
            <div className="flex items-center gap-6 shrink-0 bg-white/5 backdrop-blur border border-white/10 rounded-2xl px-6 py-5">
              <RadialRing pct={passRate}  colorClass="#10b981" label="Pass Rate"    sublabel="Quizzes" />
              <div className="w-px h-16 bg-white/10" />
              <RadialRing pct={Math.min(avgQuizScore, 100)} colorClass="#6366f1" label="Avg Score"    sublabel="pts / 100" />
              <div className="w-px h-16 bg-white/10" />
              <RadialRing pct={gradeRate} colorClass="#8b5cf6" label="Graded"       sublabel="Assignments" />
            </div>
          </div>
        </div>

        {/* ──────────────────────────────────────────────
            METRIC CARDS ROW
        ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            {
              label: 'Quizzes Passed',
              value: `${passedQuizzes.length}`,
              sub: `of ${safeAttempts.length} attempted`,
              pct: passRate,
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              ),
              iconBg: 'bg-emerald-50 text-emerald-600',
              valueColor: 'text-emerald-700',
              barColor: 'from-emerald-500 to-teal-400',
              borderColor: 'border-emerald-100 hover:border-emerald-300',
              click: () => { setActiveTab('quizzes'); setFilterStatus('PASSED'); },
              cta: 'View passed →',
              ctaColor: 'text-emerald-600',
            },
            {
              label: 'Average Quiz Mark',
              value: `${avgQuizScore}`,
              sub: `pts · Grade ${getGradeInfo(avgQuizScore, 100).letter}`,
              pct: Math.min(avgQuizScore, 100),
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              ),
              iconBg: 'bg-indigo-50 text-indigo-600',
              valueColor: 'text-indigo-700',
              barColor: 'from-indigo-500 to-violet-500',
              borderColor: 'border-indigo-100 hover:border-indigo-300',
              click: null,
            },
            {
              label: 'Assignments Graded',
              value: `${gradedSubmissions.length}`,
              sub: `of ${safeSubmissions.length} submitted`,
              pct: gradeRate,
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              ),
              iconBg: 'bg-blue-50 text-blue-600',
              valueColor: 'text-blue-700',
              barColor: 'from-blue-500 to-cyan-400',
              borderColor: 'border-blue-100 hover:border-blue-300',
              click: () => { setActiveTab('assignments'); setFilterStatus('GRADED'); },
              cta: 'View graded →',
              ctaColor: 'text-blue-600',
            },
            {
              label: 'Total Evaluations',
              value: `${safeAttempts.length + safeSubmissions.length}`,
              sub: `${Object.keys(coursesMap).length} active courses`,
              pct: 100,
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              ),
              iconBg: 'bg-violet-50 text-violet-600',
              valueColor: 'text-violet-700',
              barColor: 'from-violet-500 to-purple-400',
              borderColor: 'border-violet-100 hover:border-violet-300',
              click: null,
            },
          ].map((c, i) => (
            <div
              key={i}
              onClick={c.click || undefined}
              className={`bg-white rounded-2xl border ${c.borderColor} shadow-sm p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-lg ${c.click ? 'cursor-pointer group' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{c.label}</p>
                  <p className={`text-2xl sm:text-3xl font-black mt-1.5 ${c.valueColor}`}>{c.value}</p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">{c.sub}</p>
                </div>
                <div className={`w-10 h-10 rounded-2xl ${c.iconBg} flex items-center justify-center shrink-0`}>{c.icon}</div>
              </div>
              <div className="mt-4 space-y-1.5">
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${c.barColor} rounded-full transition-all duration-1000`} style={{ width: `${c.pct}%` }} />
                </div>
                {c.cta && <p className={`text-[11px] font-bold ${c.ctaColor} group-hover:underline`}>{c.cta}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* ──────────────────────────────────────────────
            QUIZZES PASSED — quick preview section
        ────────────────────────────────────────────── */}
        {safeAttempts.length > 0 && (
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-50/80 to-teal-50/60 border-b border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-emerald-900">Quizzes Passed</h3>
                  <p className="text-[11px] text-emerald-600 font-medium">
                    {passedQuizzes.length} of {safeAttempts.length} passed · {passRate}% pass rate
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
              <div className="px-5 py-10 text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
                  <svg className="w-7 h-7 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                </div>
                <p className="text-sm font-bold text-slate-700">No quizzes passed yet</p>
                <p className="text-xs text-slate-400 mt-1">Attempt quizzes in your enrolled courses to see results here.</p>
                <Link to="/student/quizzes" className="mt-3 inline-block text-xs font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-2">Go to My Quizzes →</Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {passedQuizzes.slice(0, 5).map((attempt) => {
                  const qInfo = quizzesMap[String(attempt.quizId)];
                  const title = qInfo?.title || `Quiz #${attempt.quizId}`;
                  const courseName = qInfo?.courseName || 'Enrolled Course';
                  const score = attempt.score ?? 0;
                  const date = attempt.attemptedAt || attempt.endTime || attempt.startTime;
                  return (
                    <div key={attempt.id || attempt.quizId} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-emerald-50/30 transition group">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-extrabold text-slate-900 truncate group-hover:text-indigo-700 transition-colors">{title}</p>
                          <p className="text-[11px] text-slate-400 font-medium">{courseName} · {formatDate(date)}</p>
                        </div>
                      </div>
                      <div className="hidden md:block w-36 shrink-0">
                        <ScoreBar value={score} max={100} passed={true} />
                        <p className="text-[10px] text-slate-400 font-bold mt-1">{score} pts</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <GradeBadge score={score} max={100} />
                        <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg">{score} pts</span>
                        <button onClick={() => navigate(`/student/quiz/${attempt.quizId}`)} className="text-[11px] font-extrabold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-xl transition active:scale-95">
                          Review
                        </button>
                      </div>
                    </div>
                  );
                })}
                {passedQuizzes.length > 5 && (
                  <div className="px-5 py-3 text-center">
                    <button onClick={() => { setActiveTab('quizzes'); setFilterStatus('PASSED'); }} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-2">
                      + {passedQuizzes.length - 5} more passed quizzes
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ──────────────────────────────────────────────
            CONTROLS BAR
        ────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 print:hidden">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-xl shrink-0">
              {[
                { key: 'quizzes',     icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>, label: `Quizzes (${safeAttempts.length})` },
                { key: 'assignments', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>, label: `Assignments (${safeSubmissions.length})` },
                { key: 'analytics',  icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, label: 'Grade Summary' },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => { setActiveTab(t.key); setFilterStatus('ALL'); }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-extrabold transition-all whitespace-nowrap ${
                    activeTab === t.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* Filters row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search assessments…"
                  className="pl-9 pr-3 py-2 w-44 rounded-xl border border-slate-200 bg-slate-50 text-xs outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition"
                />
              </div>

              {/* Course filter */}
              {Object.keys(coursesMap).length > 0 && (
                <select
                  value={filterCourse}
                  onChange={(e) => setFilterCourse(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition"
                >
                  <option value="ALL">All Courses</option>
                  {Object.entries(coursesMap).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </select>
              )}

              {/* Status filter */}
              {activeTab === 'quizzes' && (
                <div className="flex items-center gap-1">
                  {[
                    { val: 'ALL',    label: 'All' },
                    { val: 'PASSED', label: '✅ Passed' },
                    { val: 'FAILED', label: '❌ Failed' },
                  ].map((f) => (
                    <button
                      key={f.val}
                      onClick={() => setFilterStatus(f.val)}
                      className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${
                        filterStatus === f.val ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'assignments' && (
                <div className="flex items-center gap-1">
                  {[
                    { val: 'ALL',     label: 'All' },
                    { val: 'GRADED',  label: '✅ Graded' },
                    { val: 'PENDING', label: '⏳ Pending' },
                  ].map((f) => (
                    <button
                      key={f.val}
                      onClick={() => setFilterStatus(f.val)}
                      className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${
                        filterStatus === f.val ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}

              {/* View mode */}
              {activeTab !== 'analytics' && (
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`} title="Grid View">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                  </button>
                  <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition ${viewMode === 'table' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`} title="Table View">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ──────────────────────────────────────────────
            TAB: QUIZZES
        ────────────────────────────────────────────── */}
        {activeTab === 'quizzes' && (
          filteredAttempts.length === 0 ? (
            <div className="bg-white rounded-2xl p-14 text-center border border-slate-200 shadow-sm">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <h4 className="text-base font-extrabold text-slate-800">No Quiz Attempts Found</h4>
              <p className="text-sm text-slate-400 mt-1.5 max-w-sm mx-auto">
                {searchQuery || filterStatus !== 'ALL' || filterCourse !== 'ALL'
                  ? 'No results match your filters.'
                  : "You haven't attempted any quizzes yet."}
              </p>
              {(searchQuery || filterStatus !== 'ALL' || filterCourse !== 'ALL') && (
                <button onClick={() => { setSearchQuery(''); setFilterStatus('ALL'); setFilterCourse('ALL'); }} className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-2">Clear filters</button>
              )}
              <Link to="/student/quizzes" className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-200 transition hover:from-indigo-700 hover:to-violet-700">
                Browse Quizzes <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </Link>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAttempts.map((attempt, idx) => {
                const isPassed = attempt?.isPassed ?? attempt?.passed ?? false;
                const qInfo = quizzesMap[String(attempt.quizId)];
                const title = qInfo?.title || `Quiz #${attempt.quizId}`;
                const courseName = qInfo?.courseName || (qInfo?.courseId ? coursesMap[String(qInfo.courseId)] : null) || 'Enrolled Course';
                const date = attempt.attemptedAt || attempt.endTime || attempt.startTime;
                const score = attempt.score ?? 0;
                const gi = getGradeInfo(score, 100);
                return (
                  <div
                    key={attempt.id || attempt.quizId}
                    className={`bg-white rounded-2xl border shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group ${isPassed ? 'border-emerald-200/80 hover:border-emerald-300' : 'border-rose-200/80 hover:border-rose-300'}`}
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    {/* accent bar */}
                    <div className={`h-1.5 ${isPassed ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : 'bg-gradient-to-r from-rose-400 to-pink-400'}`} />

                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${isPassed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                            {isPassed ? '✅ Passed' : '❌ Failed'}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black border ${gi.bg}`}>{gi.letter}</span>
                        </div>
                        <h3 className="text-[15px] font-extrabold text-slate-900 leading-snug line-clamp-2 group-hover:text-indigo-700 transition-colors">{title}</h3>
                        <p className="text-[11px] text-slate-400 font-medium">📚 {courseName} · {formatDate(date)}</p>
                      </div>

                      <div className={`p-4 rounded-2xl flex items-center justify-between ${isPassed ? 'bg-emerald-50/60 border border-emerald-100' : 'bg-rose-50/60 border border-rose-100'}`}>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Score</p>
                          <p className={`text-2xl font-black ${isPassed ? 'text-emerald-700' : 'text-rose-700'}`}>{score}<span className="text-xs text-slate-400 font-bold ml-1">pts</span></p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Pass Mark</p>
                          <p className="text-sm font-black text-slate-600">{qInfo?.passingScore || 50}%</p>
                        </div>
                      </div>

                      <ScoreBar value={score} max={100} passed={isPassed} />

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        {qInfo?.courseId ? (
                          <Link to={`/courses/${qInfo.courseId}`} className="text-xs font-bold text-slate-400 hover:text-slate-700 transition">Course →</Link>
                        ) : <div />}
                        <button onClick={() => navigate(`/student/quiz/${attempt.quizId}`)} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-200/50 transition active:scale-95">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          View Result
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View – Quiz */
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['Assessment', 'Course', 'Date', 'Score', 'Grade', 'Status', ''].map((h) => (
                      <th key={h} className="py-3.5 px-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {filteredAttempts.map((attempt) => {
                    const isPassed = attempt?.isPassed ?? attempt?.passed ?? false;
                    const qInfo = quizzesMap[String(attempt.quizId)];
                    const title = qInfo?.title || `Quiz #${attempt.quizId}`;
                    const courseName = qInfo?.courseName || 'Enrolled Course';
                    const date = attempt.attemptedAt || attempt.endTime || attempt.startTime;
                    const score = attempt.score ?? 0;
                    const gi = getGradeInfo(score, 100);
                    return (
                      <tr key={attempt.id || attempt.quizId} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900 max-w-[200px] truncate">{title}</td>
                        <td className="py-3.5 px-4 text-slate-500 max-w-[160px] truncate">{courseName}</td>
                        <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">{formatDate(date)}</td>
                        <td className="py-3.5 px-4 font-black text-slate-900 whitespace-nowrap">{score} pts</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-lg font-black text-[11px] border ${gi.bg}`}>{gi.letter}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {isPassed ? 'Passed' : 'Failed'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button onClick={() => navigate(`/student/quiz/${attempt.quizId}`)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[11px] rounded-lg transition whitespace-nowrap">
                            Review →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* ──────────────────────────────────────────────
            TAB: ASSIGNMENTS
        ────────────────────────────────────────────── */}
        {activeTab === 'assignments' && (
          filteredSubmissions.length === 0 ? (
            <div className="bg-white rounded-2xl p-14 text-center border border-slate-200 shadow-sm">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </div>
              <h4 className="text-base font-extrabold text-slate-800">No Assignment Submissions Found</h4>
              <p className="text-sm text-slate-400 mt-1.5 max-w-sm mx-auto">
                {searchQuery || filterStatus !== 'ALL' || filterCourse !== 'ALL'
                  ? 'No submissions match your filters.'
                  : "You haven't submitted any assignments yet."}
              </p>
              {(searchQuery || filterStatus !== 'ALL' || filterCourse !== 'ALL') && (
                <button onClick={() => { setSearchQuery(''); setFilterStatus('ALL'); setFilterCourse('ALL'); }} className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-2">Clear filters</button>
              )}
              <Link to="/assignments" className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-200 transition">
                View Assignments
              </Link>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredSubmissions.map((sub, idx) => {
                const isGraded = sub.status === 'GRADED';
                const aInfo = assignmentsMap[String(sub.assignmentId)];
                const title = aInfo?.title || `Assignment #${sub.assignmentId}`;
                const courseName = aInfo?.courseName || (aInfo?.courseId ? coursesMap[String(aInfo.courseId)] : null) || 'Enrolled Course';
                const marks = sub.marks ?? 0;
                const maxMarks = aInfo?.maxMarks || 100;
                const gi = getGradeInfo(marks, maxMarks);
                return (
                  <div
                    key={sub.id}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group"
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <div className={`h-1.5 ${isGraded ? 'bg-gradient-to-r from-blue-400 to-cyan-400' : 'bg-gradient-to-r from-amber-400 to-yellow-400'}`} />
                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${isGraded ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                            {isGraded ? '✅ Graded' : '⏳ Under Review'}
                          </span>
                          {isGraded && <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black border ${gi.bg}`}>{gi.letter}</span>}
                        </div>
                        <h3 className="text-[15px] font-extrabold text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors">{title}</h3>
                        <p className="text-[11px] text-slate-400 font-medium">📚 {courseName} · Submitted {formatDate(sub.submittedAt)}</p>
                      </div>

                      {isGraded ? (
                        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Marks Awarded</p>
                            <p className="text-2xl font-black text-blue-700">{marks}<span className="text-xs text-slate-400 font-bold ml-1">/ {maxMarks}</span></p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Percentage</p>
                            <p className="text-sm font-black text-emerald-600">{Math.round((marks / maxMarks) * 100)}%</p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 flex items-center gap-3 text-sm font-bold text-amber-800">
                          <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          Awaiting evaluation by your instructor.
                        </div>
                      )}

                      {isGraded && <ScoreBar value={marks} max={maxMarks} passed={marks / maxMarks >= 0.5} />}

                      {sub.feedback && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                          <span className="font-bold text-slate-800 block mb-0.5">💬 Instructor Feedback</span>
                          "{sub.feedback}"
                        </div>
                      )}

                      <div className="flex justify-end pt-2 border-t border-slate-100">
                        <Link to="/assignments" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition">
                          All Assignments →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View – Assignments */
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['Assignment', 'Course', 'Submitted', 'Marks', 'Grade', 'Status'].map((h) => (
                      <th key={h} className="py-3.5 px-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {filteredSubmissions.map((sub) => {
                    const isGraded = sub.status === 'GRADED';
                    const aInfo = assignmentsMap[String(sub.assignmentId)];
                    const title = aInfo?.title || `Assignment #${sub.assignmentId}`;
                    const courseName = aInfo?.courseName || 'Enrolled Course';
                    const marks = sub.marks ?? 0;
                    const maxMarks = aInfo?.maxMarks || 100;
                    const gi = getGradeInfo(marks, maxMarks);
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900 max-w-[200px] truncate">{title}</td>
                        <td className="py-3.5 px-4 text-slate-500 max-w-[160px] truncate">{courseName}</td>
                        <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">{formatDate(sub.submittedAt)}</td>
                        <td className="py-3.5 px-4 font-black text-slate-900 whitespace-nowrap">{isGraded ? `${marks} / ${maxMarks}` : '—'}</td>
                        <td className="py-3.5 px-4">
                          {isGraded ? <span className={`px-2.5 py-0.5 rounded-lg font-black text-[11px] border ${gi.bg}`}>{gi.letter}</span> : '—'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${isGraded ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                            {isGraded ? 'Graded' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* ──────────────────────────────────────────────
            TAB: ANALYTICS / GRADE SUMMARY
        ────────────────────────────────────────────── */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Top metrics */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
              <h3 className="text-lg font-extrabold text-slate-900 mb-1">Academic Standing Overview</h3>
              <p className="text-xs text-slate-400 mb-6">Aggregated scoring profile across all evaluation components.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Estimated GPA', value: getGradeInfo(avgQuizScore, 100).gpa, sub: '4.0 Scale', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-100' },
                  { label: 'Letter Standing', value: getGradeInfo(avgQuizScore, 100).letter, sub: 'Based on quiz avg', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                  { label: 'Completion Rate', value: `${passRate}%`, sub: 'Tests passed', color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-100' },
                ].map((m) => (
                  <div key={m.label} className={`flex flex-col items-center justify-center p-5 rounded-2xl border ${m.border} ${m.bg} text-center`}>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{m.label}</p>
                    <p className={`text-4xl font-black ${m.color}`}>{m.value}</p>
                    <p className="text-[11px] text-slate-400 font-medium mt-1">{m.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Course breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Course-by-Course Breakdown</h3>
                <p className="text-xs text-slate-400 mt-0.5">Performance summary per enrolled course.</p>
              </div>
              {Object.keys(coursesMap).length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">No enrolled courses found.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(coursesMap).map(([cid, cname]) => {
                    const courseAttempts = safeAttempts.filter((a) => String(quizzesMap[String(a.quizId)]?.courseId) === String(cid));
                    const coursePassed = courseAttempts.filter((a) => a?.isPassed ?? a?.passed ?? false);
                    const courseSubmissions = safeSubmissions.filter((s) => String(assignmentsMap[String(s.assignmentId)]?.courseId) === String(cid));
                    const courseGraded = courseSubmissions.filter((s) => s.status === 'GRADED');
                    const cPassRate = courseAttempts.length > 0 ? Math.round((coursePassed.length / courseAttempts.length) * 100) : null;
                    return (
                      <div key={cid} className="border border-slate-200 rounded-2xl p-4 sm:p-5 hover:border-indigo-200 hover:bg-indigo-50/30 transition group">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                              <svg className="w-4.5 h-4.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                            </div>
                            <div>
                              <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-indigo-800 transition">{cname}</h4>
                              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                {courseAttempts.length} quiz attempt{courseAttempts.length !== 1 ? 's' : ''} · {coursePassed.length} passed · {courseGraded.length}/{courseSubmissions.length} assignments graded
                              </p>
                              {cPassRate !== null && (
                                <div className="mt-2 w-40">
                                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full bg-gradient-to-r ${cPassRate >= 50 ? 'from-emerald-500 to-teal-400' : 'from-rose-500 to-pink-400'}`} style={{ width: `${cPassRate}%` }} />
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-medium mt-1">{cPassRate}% quiz pass rate</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {coursePassed.length > 0 && (
                              <button
                                onClick={() => setCertificateCourse({ id: cid, name: cname })}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-slate-950 text-xs font-extrabold rounded-xl shadow-sm transition"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                                Certificate
                              </button>
                            )}
                            <span className={`text-xs font-black px-3 py-1.5 rounded-xl ${cPassRate !== null ? (cPassRate >= 50 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800') : 'bg-slate-100 text-slate-600'}`}>
                              {cPassRate !== null ? `${cPassRate}% Pass` : 'No Quizzes'}
                            </span>
                            <Link to={`/courses/${cid}`} className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800 underline underline-offset-2 transition">
                              Course Page →
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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