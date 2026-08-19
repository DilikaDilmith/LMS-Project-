import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { assignmentAPI, quizAPI, courseAPI } from '../../services/api';
import toast from 'react-hot-toast';

// Helper function for absolute file URLs
const getFullFileUrl = (url) => {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `http://localhost:8080${cleanPath}`;
};

// Calculate letter grade and color
const calculateGrade = (score, maxMarks = 100) => {
  if (score === null || score === undefined) return { label: 'PENDING', badge: 'bg-amber-100 text-amber-800 border-amber-200', percent: 0 };
  const percent = maxMarks > 0 ? Math.round((score / maxMarks) * 100) : score;

  if (percent >= 90) return { label: 'A+ (High Distinction)', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', percent, letter: 'A+' };
  if (percent >= 80) return { label: 'A (Distinction)', badge: 'bg-blue-100 text-blue-800 border-blue-300', percent, letter: 'A' };
  if (percent >= 70) return { label: 'B (Credit)', badge: 'bg-indigo-100 text-indigo-800 border-indigo-300', percent, letter: 'B' };
  if (percent >= 60) return { label: 'C (Pass)', badge: 'bg-purple-100 text-purple-800 border-purple-300', percent, letter: 'C' };
  if (percent >= 50) return { label: 'D (Pass)', badge: 'bg-amber-100 text-amber-800 border-amber-300', percent, letter: 'D' };
  return { label: 'F (Needs Improvement)', badge: 'bg-rose-100 text-rose-800 border-rose-300', percent, letter: 'F' };
};

const StudentResults = () => {
  const { user } = useAuth();
  const studentId = user?.id;

  // Data states
  const [submissions, setSubmissions] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'assignments' | 'quizzes'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'GRADED' | 'PENDING'

  // Selected Submission Modal
  const [selectedSub, setSelectedSub] = useState(null);

  useEffect(() => {
    if (studentId) {
      fetchResults();
    }
  }, [studentId]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const [submissionsRes, quizRes, enrolledRes] = await Promise.allSettled([
        assignmentAPI.getStudentSubmissions(studentId),
        quizAPI.getStudentResults(studentId),
        courseAPI.getEnrolled(studentId),
      ]);

      const subs = submissionsRes.status === 'fulfilled' && Array.isArray(submissionsRes.value.data)
        ? submissionsRes.value.data
        : [];
      const quizzes = quizRes.status === 'fulfilled' && Array.isArray(quizRes.value.data)
        ? quizRes.value.data
        : [];
      const enrolledCourses = enrolledRes.status === 'fulfilled' && Array.isArray(enrolledRes.value.data)
        ? enrolledRes.value.data
        : [];

      setSubmissions(subs);
      setQuizAttempts(quizzes);
      setCourses(enrolledCourses);
    } catch (error) {
      console.error('Failed to fetch results:', error);
      toast.error('Failed to load academic results');
    } finally {
      setLoading(false);
    }
  };

  // Performance Calculations
  const performanceStats = useMemo(() => {
    const gradedSubs = submissions.filter((s) => s.status === 'GRADED' && s.marks !== null);
    const totalAssignments = submissions.length;
    const pendingSubs = submissions.filter((s) => s.status !== 'GRADED');

    const totalQuizzes = quizAttempts.length;
    const passedQuizzes = quizAttempts.filter((q) => q.passed);

    // Calculate Average Assignment Score
    let assignmentTotalScore = 0;
    gradedSubs.forEach((s) => {
      assignmentTotalScore += s.marks || 0;
    });
    const avgAssignmentScore = gradedSubs.length > 0 ? Math.round(assignmentTotalScore / gradedSubs.length) : null;

    // Calculate Average Quiz Score
    let quizTotalScore = 0;
    quizAttempts.forEach((q) => {
      quizTotalScore += q.score || 0;
    });
    const avgQuizScore = totalQuizzes > 0 ? Math.round(quizTotalScore / totalQuizzes) : null;

    // Overall Average
    let overallItemsCount = gradedSubs.length + totalQuizzes;
    let overallTotal = assignmentTotalScore + quizTotalScore;
    const overallAvg = overallItemsCount > 0 ? Math.round(overallTotal / overallItemsCount) : 0;

    return {
      gradedSubsCount: gradedSubs.length,
      pendingSubsCount: pendingSubs.length,
      totalAssignments,
      totalQuizzes,
      passedQuizzesCount: passedQuizzes.length,
      avgAssignmentScore,
      avgQuizScore,
      overallAvg,
    };
  }, [submissions, quizAttempts]);

  // Filtered Assessments
  const filteredAssessments = useMemo(() => {
    let combined = [];

    // Add Assignments
    if (activeTab === 'all' || activeTab === 'assignments') {
      submissions.forEach((s) => {
        combined.push({
          type: 'assignment',
          id: s.id,
          referenceId: s.assignmentId,
          title: `Assignment #${s.assignmentId}`,
          date: s.submittedAt,
          score: s.marks,
          maxMarks: 100,
          status: s.status || 'SUBMITTED',
          feedback: s.feedback,
          fileUrl: s.fileUrl,
          remarks: s.remarks,
          isGraded: s.status === 'GRADED',
        });
      });
    }

    // Add Quizzes
    if (activeTab === 'all' || activeTab === 'quizzes') {
      quizAttempts.forEach((q) => {
        combined.push({
          type: 'quiz',
          id: q.id,
          referenceId: q.quizId,
          title: `Quiz Assessment #${q.quizId}`,
          date: q.attemptedAt || q.createdAt,
          score: q.score,
          maxMarks: 100,
          status: q.passed ? 'PASSED' : 'FAILED',
          feedback: q.passed ? 'Demonstrated strong subject mastery.' : 'Retake recommended to improve competency score.',
          isGraded: true,
          passed: q.passed,
        });
      });
    }

    // Apply Status Filter
    if (statusFilter === 'GRADED') {
      combined = combined.filter((item) => item.isGraded && item.status !== 'FAILED');
    } else if (statusFilter === 'PENDING') {
      combined = combined.filter((item) => !item.isGraded || item.status === 'SUBMITTED');
    }

    // Apply Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      combined = combined.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          (item.feedback && item.feedback.toLowerCase().includes(q)) ||
          String(item.score).includes(q) ||
          String(item.referenceId).includes(q)
      );
    }

    // Sort by Date Descending
    combined.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    return combined;
  }, [submissions, quizAttempts, activeTab, statusFilter, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="relative mx-auto w-16 h-16 mb-4">
            <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-xl">📊</div>
          </div>
          <h3 className="text-slate-800 font-extrabold text-base">Loading Academic Transcript</h3>
          <p className="text-slate-500 text-xs mt-1">Fetching your assessment marks and feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20 animate-fadeIn">
      {/* Top Navigation */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-6 py-3.5 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xl shadow-md shadow-blue-500/20">
            📊
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 tracking-tight">
              Academic Performance &amp; Results
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">Student Performance Transcript &amp; Feedback</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="text-xs font-bold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
            title="Print or Export Transcript"
          >
            <span>🖨️</span>
            <span className="hidden sm:inline">Print Transcript</span>
          </button>

          <Link
            to="/dashboard"
            className="text-xs font-bold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-4 py-2 rounded-xl transition flex items-center gap-1.5"
          >
            <span>←</span>
            <span>Dashboard</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
        {/* ========================================================================= */}
        {/* 🌟 HERO BANNER & GRADE POINT SUMMARY */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-blue-950 rounded-3xl text-white p-6 sm:p-10 shadow-2xl relative overflow-hidden mb-8 border border-white/10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-black uppercase tracking-widest px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full">
                  🎓 Academic Records
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {user?.firstName} {user?.lastName} (ID #{studentId})
                </span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Academic Score &amp; Grade Overview 🎯
              </h2>
              <p className="text-slate-300 mt-2 text-xs sm:text-sm max-w-xl leading-relaxed">
                Review your marks, instructor feedback, and quiz results across your enrolled courses.
              </p>
            </div>

            {/* Overall Score Badge Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-center min-w-[200px]">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-blue-300 block mb-1">
                Overall Average Score
              </span>
              <div className="text-4xl sm:text-5xl font-black text-white">
                {performanceStats.overallAvg}%
              </div>
              <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <span>🏆</span>
                <span>
                  {performanceStats.overallAvg >= 80
                    ? 'Distinction Standing'
                    : performanceStats.overallAvg >= 60
                    ? 'Good Standing'
                    : 'Active Candidate'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Analytics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-8 pt-6 border-t border-white/10">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between text-blue-300 text-lg mb-1">
                <span>📝</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assignments</span>
              </div>
              <p className="text-2xl font-black text-white">
                {performanceStats.gradedSubsCount}{' '}
                <span className="text-xs text-slate-400 font-normal">/ {performanceStats.totalAssignments}</span>
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {performanceStats.pendingSubsCount} Pending Evaluation
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between text-emerald-300 text-lg mb-1">
                <span>❓</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quizzes</span>
              </div>
              <p className="text-2xl font-black text-white">
                {performanceStats.passedQuizzesCount}{' '}
                <span className="text-xs text-slate-400 font-normal">/ {performanceStats.totalQuizzes}</span>
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5">Quizzes Passed</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between text-indigo-300 text-lg mb-1">
                <span>📈</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Assignment</span>
              </div>
              <p className="text-2xl font-black text-white">
                {performanceStats.avgAssignmentScore !== null ? `${performanceStats.avgAssignmentScore}%` : 'N/A'}
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5">Coursework Average</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between text-amber-300 text-lg mb-1">
                <span>⚡</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pass Rate</span>
              </div>
              <p className="text-2xl font-black text-emerald-400">
                {performanceStats.totalQuizzes > 0
                  ? `${Math.round((performanceStats.passedQuizzesCount / performanceStats.totalQuizzes) * 100)}%`
                  : '100%'}
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5">Quiz Mastery</p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 🔍 FILTER & SEARCH TOOLBAR */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-blue-100/90 shadow-sm mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Segmented Filter Pills */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-2 px-4 rounded-xl text-xs font-extrabold transition whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              🌟 All Assessments ({submissions.length + quizAttempts.length})
            </button>

            <button
              onClick={() => setActiveTab('assignments')}
              className={`py-2 px-4 rounded-xl text-xs font-extrabold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'assignments'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>📝 Assignments</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === 'assignments' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
                }`}
              >
                {submissions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('quizzes')}
              className={`py-2 px-4 rounded-xl text-xs font-extrabold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'quizzes'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>❓ Quizzes</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === 'quizzes' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
                }`}
              >
                {quizAttempts.length}
              </span>
            </button>
          </div>

          {/* Search & Status Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:flex-initial">
              <input
                type="text"
                placeholder="Search by title, score, keyword..."
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

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">Status: All Records</option>
              <option value="GRADED">Status: Graded &amp; Passed</option>
              <option value="PENDING">Status: Pending Evaluation</option>
            </select>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 📋 RESULTS LIST */}
        {/* ========================================================================= */}
        {filteredAssessments.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-blue-100 shadow-sm max-w-xl mx-auto my-6">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-inner">
              📊
            </div>
            <h3 className="text-lg font-black text-slate-900">No Assessment Records Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No results matching "${searchQuery}". Try a different keyword.`
                : 'You have not completed any graded assessments or quizzes in this category yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAssessments.map((item, index) => {
              const grade = calculateGrade(item.score, item.maxMarks);

              return (
                <div
                  key={`${item.type}-${item.id}-${index}`}
                  className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
                >
                  {/* Left Column: Icon + Details */}
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-sm ${
                        item.type === 'assignment'
                          ? 'bg-blue-50 text-blue-600 border border-blue-100'
                          : 'bg-purple-50 text-purple-600 border border-purple-100'
                      }`}
                    >
                      {item.type === 'assignment' ? '📝' : '❓'}
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            item.type === 'assignment'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {item.type === 'assignment' ? 'Assignment' : 'Quiz Attempt'}
                        </span>

                        <span className="text-xs text-slate-400 font-medium">
                          📅 {item.date ? new Date(item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recent'}
                        </span>
                      </div>

                      <h4 className="text-base font-black text-slate-900">
                        {item.title}
                      </h4>

                      {/* Instructor Feedback Box */}
                      {item.feedback && (
                        <div className="mt-3 p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs">
                          <span className="font-bold text-blue-800 text-[11px] block mb-0.5">
                            💬 Feedback:
                          </span>
                          <p className="text-slate-700 italic leading-relaxed">
                            "{item.feedback}"
                          </p>
                        </div>
                      )}

                      {/* Student Submitted File Link if any */}
                      {item.fileUrl && (
                        <div className="mt-2 pt-1 flex items-center gap-2">
                          <a
                            href={getFullFileUrl(item.fileUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold rounded-xl text-xs border border-slate-200 transition"
                          >
                            <span>📄</span>
                            <span>View Submitted Solution ↗</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Score & Grade Badge */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                    <div className="text-left lg:text-right">
                      {item.score !== null && item.score !== undefined ? (
                        <div>
                          <span className="text-2xl sm:text-3xl font-black text-slate-900">
                            {item.score}
                          </span>
                          <span className="text-xs font-bold text-slate-400 ml-1">
                            / {item.maxMarks} Marks
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                          ⏳ Pending Grading
                        </span>
                      )}
                    </div>

                    {/* Letter Grade Pill */}
                    {item.score !== null && item.score !== undefined && (
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${grade.badge}`}>
                        {grade.label}
                      </span>
                    )}

                    {item.type === 'quiz' && (
                      <span
                        className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          item.passed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.passed ? '✓ Passed' : '✗ Retake Required'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentResults;