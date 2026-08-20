import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { assignmentAPI, courseAPI } from '../../services/api';
import toast from 'react-hot-toast';

const LecturerGrading = () => {
  const { user } = useAuth();
  const lecturerId = user?.id;

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(null);
  const [gradeData, setGradeData] = useState({});
  const [assignmentsMap, setAssignmentsMap] = useState({});
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    fetchCourses();
    // Trigger fade-in animation after mount
    setTimeout(() => setFadeIn(true), 100);
  }, []);

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
        setSelectedCourse(list[0].id);
      }
    } catch (error) {
      console.warn('Primary fetch courses failed, attempting getAll fallback:', error);
      try {
        const allRes = await courseAPI.getAll();
        const list = allRes.data || [];
        setCourses(list);
        if (list.length > 0) {
          setSelectedCourse(list[0].id);
        }
      } catch (err2) {
        console.error('All course fetch attempts failed:', err2);
        toast.error('Failed to load courses');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCourse) {
      fetchSubmissions();
    }
  }, [selectedCourse]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const assignRes = await assignmentAPI.getByCourse(selectedCourse);
      const courseAssignments = assignRes.data || [];

      const map = {};
      courseAssignments.forEach(a => {
        map[a.id] = a;
      });
      setAssignmentsMap(map);

      const submissionPromises = courseAssignments.map(a =>
        assignmentAPI.getSubmissions(a.id).then(res => res.data || []).catch(() => [])
      );

      const submissionLists = await Promise.all(submissionPromises);
      const allSubmissions = submissionLists.flat();
      setSubmissions(allSubmissions);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (submissionId, field, value) => {
    setGradeData(prev => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        [field]: value
      }
    }));
  };

  const handleGradeSubmit = async (submissionId) => {
    const data = gradeData[submissionId];
    const assignment = assignmentsMap[submissions.find(s => s.id === submissionId)?.assignmentId];
    const maxMarks = assignment?.maxMarks || 100;

    if (data?.marks === undefined || data?.marks === '') {
      toast.error('Please enter marks');
      return;
    }
    if (parseFloat(data.marks) > maxMarks) {
      toast.error(`Marks cannot exceed ${maxMarks}`);
      return;
    }
    if (parseFloat(data.marks) < 0) {
      toast.error('Marks cannot be negative');
      return;
    }

    setGrading(submissionId);
    try {
      const activeLecturerId = lecturerId ? parseInt(lecturerId) : 1;
      await assignmentAPI.grade(submissionId, activeLecturerId, {
        marks: parseFloat(data.marks),
        feedback: data.feedback || ''
      });
      toast.success('✅ Grade submitted successfully!');
      await fetchSubmissions();
      setGradeData(prev => {
        const newData = { ...prev };
        delete newData[submissionId];
        return newData;
      });
    } catch (error) {
      toast.error(error.response?.data || 'Failed to grade submission');
    } finally {
      setGrading(null);
    }
  };

  if (loading && courses.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading submissions...</p>
        </div>
      </div>
    );
  }

  const pendingSubmissions = submissions.filter(s => s.status === 'SUBMITTED' || s.status === 'LATE');
  const gradedSubmissions = submissions.filter(s => s.status === 'GRADED');

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/40 transition-opacity duration-700 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
      {/* ========================================================
          NAVBAR
      ======================================================== */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 py-4 sm:px-8 shadow-sm">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">Grading Hub</p>
              <h1 className="text-lg font-bold text-slate-900 sm:text-xl">Grade Submissions</h1>
            </div>
          </div>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-all hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Dashboard
          </Link>
        </div>
      </nav>

      {/* ========================================================
          MAIN CONTENT
      ======================================================== */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:py-10">
        {/* ====================================================
            HEADER
        ==================================================== */}
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-purple-600 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
              Assessment Centre
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Review &amp; Grade Student Work
            </h2>
            <p className="mt-2 text-sm text-slate-500 max-w-2xl">
              View student submissions, provide meaningful feedback, and record marks that students can see instantly.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-3 text-center min-w-[100px] hover:shadow-md transition">
              <p className="text-xs font-medium text-amber-700">Pending Review</p>
              <p className="mt-1 text-2xl font-bold text-amber-800">{pendingSubmissions.length}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-3 text-center min-w-[100px] hover:shadow-md transition">
              <p className="text-xs font-medium text-emerald-700">Graded</p>
              <p className="mt-1 text-2xl font-bold text-emerald-800">{gradedSubmissions.length}</p>
            </div>
          </div>
        </div>

        {/* ====================================================
            COURSE SELECTOR
        ==================================================== */}
        <section className="mb-8 rounded-2xl bg-white border border-slate-200/80 shadow-sm p-5 sm:p-6 hover:shadow-md transition">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-purple-50">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">Select Course</p>
                {courses.length === 0 ? (
                  <p className="text-sm text-amber-600 font-medium">No courses available</p>
                ) : (
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="mt-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition"
                  >
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                {pendingSubmissions.length} pending
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {gradedSubmissions.length} graded
              </span>
            </div>
          </div>
        </section>

        {/* ====================================================
            SUBMISSIONS LIST
        ==================================================== */}
        {submissions.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-12 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-purple-50 text-5xl">
              📭
            </div>
            <h3 className="mt-5 text-xl font-bold text-slate-800">No submissions yet</h3>
            <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
              Student submissions for this course will appear here once they submit their assignments.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub, index) => {
              const assign = assignmentsMap[sub.assignmentId];
              const isGraded = sub.status === 'GRADED';
              const isPending = sub.status === 'SUBMITTED' || sub.status === 'LATE';
              const maxMarks = assign?.maxMarks || 100;

              return (
                <div
                  key={sub.id}
                  className={`group rounded-2xl bg-white border shadow-sm transition-all duration-300 hover:shadow-md animate-fade-in-up`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      {/* Left - Student Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Student #{sub.studentId}
                          </span>
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                            isGraded
                              ? 'bg-emerald-100 text-emerald-700'
                              : isPending
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              isGraded ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : 'bg-slate-400'
                            }`}></span>
                            {sub.status}
                          </span>
                          {isPending && (
                            <span className="text-xs text-amber-600 font-medium animate-pulse">⚡ Awaiting grading</span>
                          )}
                        </div>
                        <h4 className="mt-2.5 text-lg font-bold text-slate-900">
                          {sub.studentName || `Student #${sub.studentId}`}
                        </h4>
                        <p className="text-sm text-slate-500">{sub.studentEmail || 'Email unavailable'}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                          <span className="font-semibold text-slate-700">
                            📄 {assign?.title ? assign.title : `Assignment #${sub.assignmentId}`}
                          </span>
                          <span className="text-slate-400">· Max: {maxMarks} marks</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Submitted: {new Date(sub.submittedAt).toLocaleDateString()} at {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {sub.fileUrl && (
                          <a
                            href={sub.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-3.5 py-2 text-xs font-semibold text-purple-700 transition hover:bg-purple-100"
                          >
                            📎 View Submission
                          </a>
                        )}
                      </div>

                      {/* Right - Grading Controls */}
                      <div className="w-full lg:w-auto lg:min-w-[340px]">
                        {isGraded ? (
                          <div className="flex flex-col items-end gap-1 bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
                            <span className="text-2xl font-bold text-emerald-600">
                              {sub.marks}
                              <span className="text-sm font-normal text-slate-400"> / {maxMarks}</span>
                            </span>
                            {sub.feedback && (
                              <p className="text-sm text-slate-600 italic text-right">“{sub.feedback}”</p>
                            )}
                            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Graded
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-amber-50/50 rounded-xl p-4 border border-amber-100">
                            <div className="flex-1 w-full sm:w-auto">
                              <input
                                type="number"
                                placeholder={`Score / ${maxMarks}`}
                                defaultValue={sub.marks ?? ''}
                                onChange={(e) => handleGradeChange(sub.id, 'marks', e.target.value)}
                                className="w-full sm:w-28 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                              />
                            </div>
                            <div className="flex-1 w-full sm:w-auto">
                              <input
                                type="text"
                                placeholder="Feedback..."
                                defaultValue={sub.feedback || ''}
                                onChange={(e) => handleGradeChange(sub.id, 'feedback', e.target.value)}
                                className="w-full sm:w-44 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                              />
                            </div>
                            <button
                              onClick={() => handleGradeSubmit(sub.id)}
                              disabled={grading === sub.id}
                              className={`w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-all ${
                                grading === sub.id
                                  ? 'bg-slate-400 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-200'
                              }`}
                            >
                              {grading === sub.id ? (
                                <span className="flex items-center justify-center gap-2">
                                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                  </svg>
                                  Saving...
                                </span>
                              ) : (
                                'Submit Grade'
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default LecturerGrading;