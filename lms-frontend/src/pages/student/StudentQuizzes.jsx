import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { courseAPI, quizAPI } from '../../services/api';
import toast from 'react-hot-toast';

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

/* ------------------------------------------------------------------ */
/*  Animated SVG ring for the score circle                            */
/* ------------------------------------------------------------------ */
const ScoreRing = ({ score, total = 100, size = 52, stroke = 5, passed }) => {
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(score / total, 1) : 0;
  const offset = C * (1 - pct);
  const color = passed ? '#10b981' : '#f43f5e';
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-slate-100" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={C} strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
      />
      <text
        x={size / 2} y={size / 2}
        textAnchor="middle" dominantBaseline="central"
        className="rotate-90 origin-center fill-slate-800 text-[11px] font-black"
      >
        {score ?? 0}
      </text>
    </svg>
  );
};

const StudentQuizzes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const studentId = user?.id;

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

  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | PENDING | PASSED | FAILED
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    if (effectiveStudentId) {
      fetchInitialData();
    } else {
      setLoadingInit(false);
    }
    setTimeout(() => setFadeIn(true), 80);
  }, [effectiveStudentId]);

  const normalizeCourse = (c) => ({
    id: c.courseId ?? c.id,
    name: c.courseName ?? c.name ?? c.title ?? `Course #${c.courseId ?? c.id}`,
  });

  const fetchInitialData = async () => {
    setLoadingInit(true);
    try {
      const enrolledRes = await courseAPI.getEnrolled(effectiveStudentId);
      const rawCourses = toArray(enrolledRes.data);
      const courses = rawCourses.map(normalizeCourse).filter((c) => c.id != null);
      setEnrolledCourses(courses);

      try {
        const attemptsRes = await quizAPI.getStudentResults(effectiveStudentId);
        setAttempts(toArray(attemptsRes.data));
      } catch (err) {
        console.warn('Failed to fetch quiz attempts:', err);
        setAttempts([]);
      }

      if (courses.length > 0) {
        await fetchAllQuizzes(courses);
      } else {
        setQuizzes([]);
      }
    } catch (error) {
      console.error('Failed to load quizzes data:', error);
      toast.error('Failed to load quizzes. Make sure you are enrolled in courses.');
    } finally {
      setLoadingInit(false);
    }
  };

  const fetchAllQuizzes = async (coursesList) => {
    setLoadingQuizzes(true);
    try {
      const quizPromises = coursesList.map((course) =>
        quizAPI
          .getByCourse(course.id)
          .then((res) =>
            (res.data || []).map((q) => ({
              ...q,
              courseName: course.name,
              courseId: q.courseId ?? course.id,
            }))
          )
          .catch((err) => {
            console.warn(`Failed to fetch quizzes for course ${course.id}:`, err);
            return [];
          })
      );
      const results = await Promise.all(quizPromises);
      setQuizzes(results.flat());
    } catch (err) {
      console.error('Error fetching course quizzes:', err);
      setQuizzes([]);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const getAttemptForQuiz = (quizId) => {
    const safeAttempts = Array.isArray(attempts) ? attempts : [];
    return (
      safeAttempts
        .filter((a) => String(a.quizId) === String(quizId))
        .sort(
          (a, b) =>
            new Date(b.endTime || b.attemptedAt || b.startTime || 0) -
            new Date(a.endTime || a.attemptedAt || a.startTime || 0)
        )[0] || null
    );
  };

  /* ---------- derived stats ---------- */
  const stats = useMemo(() => {
    const total = quizzes.length;
    let attempted = 0, passed = 0, failed = 0, pending = 0;
    quizzes.forEach((q) => {
      const a = getAttemptForQuiz(q.id);
      if (a) {
        attempted++;
        if (a.isPassed ?? a.passed) passed++;
        else failed++;
      } else {
        pending++;
      }
    });
    return { total, attempted, passed, failed, pending };
  }, [quizzes, attempts]);

  /* ---------- filtered list ---------- */
  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((q) => {
      // course filter
      if (selectedCourse !== 'ALL' && String(q.courseId) !== String(selectedCourse)) return false;
      // status filter
      if (statusFilter !== 'ALL') {
        const a = getAttemptForQuiz(q.id);
        if (statusFilter === 'PENDING' && a) return false;
        if (statusFilter === 'PASSED' && !(a && (a.isPassed ?? a.passed))) return false;
        if (statusFilter === 'FAILED' && !(a && !(a.isPassed ?? a.passed))) return false;
      }
      // search
      if (searchQuery) {
        const q2 = searchQuery.toLowerCase();
        if (
          !(q.title || '').toLowerCase().includes(q2) &&
          !(q.courseName || '').toLowerCase().includes(q2) &&
          !(q.description || '').toLowerCase().includes(q2)
        )
          return false;
      }
      return true;
    });
  }, [quizzes, selectedCourse, statusFilter, searchQuery, attempts]);

  /* ================================================================
     LOADING STATE
  ================================================================ */
  if (loadingInit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto w-20 h-20 mb-5">
            <div className="w-20 h-20 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <h3 className="text-slate-800 font-extrabold text-lg">Loading Your Quizzes</h3>
          <p className="text-slate-400 text-sm mt-1">Fetching assessments from all enrolled courses…</p>
        </div>
      </div>
    );
  }

  /* ================================================================
     MAIN RENDER
  ================================================================ */
  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 font-sans text-slate-800 pb-24 transition-opacity duration-700 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>

      {/* ============================================================
          STICKY NAV
      ============================================================ */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200/60">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight">My Quizzes & Assessments</h1>
              <p className="text-[11px] text-slate-400 font-medium">
                {quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''} · {enrolledCourses.length} course{enrolledCourses.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/student/results" className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 px-3.5 py-2 rounded-xl transition border border-violet-200">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              My Results
            </Link>
            <Link to="/dashboard" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-4 py-2 rounded-xl transition">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* ============================================================
            HERO + STATS
        ============================================================ */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-violet-950 to-slate-950 px-6 sm:px-8 py-8 shadow-2xl shadow-indigo-900/30">
          {/* decorative blobs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-[11px] font-bold uppercase tracking-widest">Live Dashboard</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Online Assessments & Quizzes
              </h2>
              <p className="text-indigo-200/80 text-sm mt-1.5 max-w-xl">
                Test your knowledge, track your progress, and prepare for exams across all your enrolled courses.
              </p>
            </div>

            {/* Stat Capsules */}
            <div className="flex flex-wrap gap-2.5 shrink-0">
              {[
                { label: 'Total', value: stats.total, color: 'from-white/10 to-white/5', text: 'text-white' },
                { label: 'Pending', value: stats.pending, color: 'from-amber-500/20 to-amber-500/5', text: 'text-amber-300' },
                { label: 'Passed', value: stats.passed, color: 'from-emerald-500/20 to-emerald-500/5', text: 'text-emerald-300' },
                { label: 'Failed', value: stats.failed, color: 'from-rose-500/20 to-rose-500/5', text: 'text-rose-300' },
              ].map((s) => (
                <div key={s.label} className={`bg-gradient-to-b ${s.color} backdrop-blur border border-white/10 rounded-2xl px-4 py-2.5 text-center min-w-[76px]`}>
                  <p className={`text-2xl font-black ${s.text}`}>{s.value}</p>
                  <p className="text-[10px] font-semibold text-indigo-200/60 uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================
            CONTROLS BAR — Course filter, status filter, search
        ============================================================ */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: course pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mr-1">Course</span>
            <button
              onClick={() => setSelectedCourse('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCourse === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
              }`}
            >
              All ({quizzes.length})
            </button>
            {enrolledCourses.map((c) => {
              const count = quizzes.filter((q) => String(q.courseId) === String(c.id)).length;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCourse(String(c.id))}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedCourse === String(c.id)
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
                  }`}
                >
                  {c.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Right: status + search */}
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { key: 'ALL', label: 'All', icon: '🔵' },
              { key: 'PENDING', label: 'Pending', icon: '🟡' },
              { key: 'PASSED', label: 'Passed', icon: '✅' },
              { key: 'FAILED', label: 'Failed', icon: '❌' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                  statusFilter === f.key
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                    : 'bg-slate-50 text-slate-500 hover:bg-violet-50 hover:text-violet-700 border border-slate-200'
                }`}
              >
                {f.icon} {f.label}
              </button>
            ))}
            <div className="relative ml-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search quizzes…"
                className="pl-9 pr-3 py-2 w-44 rounded-xl border border-slate-200 bg-slate-50 text-xs outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition"
              />
            </div>
          </div>
        </div>

        {/* ============================================================
            QUIZ CARDS GRID
        ============================================================ */}
        {loadingQuizzes ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Loading quizzes…</p>
          </div>
        ) : enrolledCourses.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm">
            <div className="mx-auto w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center text-4xl mb-4">📚</div>
            <h3 className="text-xl font-black text-slate-800">No Enrolled Courses</h3>
            <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto">
              Enroll in a course to access quizzes and assessments.
            </p>
            <Link to="/courses" className="mt-5 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-200 transition">
              Browse Courses
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Link>
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm">
            <div className="mx-auto w-20 h-20 rounded-3xl bg-violet-50 flex items-center justify-center text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-black text-slate-800">No Quizzes Found</h3>
            <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
              {searchQuery
                ? `No quizzes match "${searchQuery}". Try a different keyword.`
                : selectedCourse === 'ALL'
                ? 'No quizzes have been published for your enrolled courses yet.'
                : 'No quizzes published for this course yet. Check back soon!'}
            </p>
            {(searchQuery || statusFilter !== 'ALL' || selectedCourse !== 'ALL') && (
              <button
                onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); setSelectedCourse('ALL'); }}
                className="mt-4 text-sm font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-2"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-400 font-medium">
              Showing {filteredQuizzes.length} of {quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredQuizzes.map((quiz, idx) => {
                const attempt = getAttemptForQuiz(quiz.id);
                const isPassed = attempt ? (attempt.isPassed ?? attempt.passed) : false;
                const isCompleted = !!attempt;

                return (
                  <div
                    key={quiz.id}
                    className="group bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col overflow-hidden"
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    {/* ---- top accent bar ---- */}
                    <div className={`h-1.5 ${
                      isCompleted
                        ? isPassed ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-rose-400 to-pink-500'
                        : 'bg-gradient-to-r from-indigo-400 to-violet-500'
                    }`} />

                    {/* ---- header ---- */}
                    <div className="px-5 pt-5 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                          {quiz.courseName || 'Course Quiz'}
                        </span>
                        <h3 className="text-[15px] font-extrabold text-slate-900 leading-snug mt-1 line-clamp-2 group-hover:text-indigo-700 transition-colors">
                          {quiz.title}
                        </h3>
                      </div>

                      {/* Status badge or score ring */}
                      {isCompleted ? (
                        <ScoreRing score={attempt.score ?? 0} passed={isPassed} />
                      ) : (
                        <div className="shrink-0 w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                          <span className="text-lg">📝</span>
                        </div>
                      )}
                    </div>

                    {/* ---- body ---- */}
                    <div className="px-5 pt-3 pb-4 flex-1 space-y-3">
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {quiz.description || 'Test your knowledge on course materials with this timed assessment.'}
                      </p>

                      {/* meta chips */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                          <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {quiz.durationMinutes || 30} mins
                        </span>
                        <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                          <svg className="w-3.5 h-3.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          Pass: {quiz.passingScore || 50}%
                        </span>
                        {isCompleted && (
                          <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                            isPassed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {isPassed ? '✅ Passed' : '❌ Failed'}
                          </span>
                        )}
                        {!isCompleted && (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg px-2.5 py-1 text-[11px] font-bold">
                            🟡 Not Attempted
                          </span>
                        )}
                      </div>

                      {/* Score bar for completed */}
                      {isCompleted && (
                        <div className="pt-1">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                            <span>Your Score</span>
                            <span className={isPassed ? 'text-emerald-600' : 'text-rose-600'}>
                              {attempt.score ?? 0} pts
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ease-out ${
                                isPassed
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                  : 'bg-gradient-to-r from-rose-500 to-pink-400'
                              }`}
                              style={{ width: `${Math.min((attempt.score || 0), 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ---- footer ---- */}
                    <div className="px-5 pb-5">
                      {isCompleted ? (
                        <div className="flex gap-2">
                          <Link
                            to="/student/results"
                            className="flex-1 py-2.5 text-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                            View Transcript
                          </Link>
                          <button
                            onClick={() => navigate(`/student/quiz/${quiz.id}`)}
                            className="py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-indigo-200"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            Review
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => navigate(`/student/quiz/${quiz.id}`)}
                          className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-200/50 transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          Attempt Quiz Now
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentQuizzes;
