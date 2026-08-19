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

  useEffect(() => {
    fetchCourses();
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

  const [assignmentsMap, setAssignmentsMap] = useState({});

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
    if (data?.marks === undefined || data?.marks === '') {
      toast.error('Please enter marks');
      return;
    }
    setGrading(submissionId);
    try {
      const activeLecturerId = lecturerId ? parseInt(lecturerId) : 1;
      await assignmentAPI.grade(submissionId, activeLecturerId, {
        marks: parseFloat(data.marks),
        feedback: data.feedback || ''
      });
      toast.success('Grade submitted successfully! 🎉');
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const pendingSubmissions = submissions.filter(s => s.status === 'SUBMITTED' || s.status === 'LATE');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="border-b border-slate-200 bg-white/90 px-4 py-4 shadow-sm backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-xl shadow-sm shadow-emerald-200">✅</div>
            <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Teaching workspace</p><h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">Grade submissions</h1></div>
          </div>
          <Link to="/dashboard" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"><span aria-hidden="true">←</span> Dashboard</Link>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:py-10">
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="max-w-2xl"><p className="mb-2 text-sm font-semibold text-emerald-600">Assessment centre</p><h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Give every submission useful feedback.</h2><p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">Review student work, open submitted files, and record marks that students can see immediately.</p></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3"><div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center"><p className="text-xs text-amber-700">To review</p><p className="mt-1 text-2xl font-bold text-amber-900">{pendingSubmissions.length}</p></div><div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center"><p className="text-xs text-emerald-700">Graded</p><p className="mt-1 text-2xl font-bold text-emerald-900">{submissions.filter(s => s.status === 'GRADED').length}</p></div></div>
        </div>
        {/* Course Selector */}
        <section className="mb-8 flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Course context</p><h3 className="mt-1 text-lg font-bold text-slate-900">Select a course to review</h3></div>
            {courses.length === 0 ? (
              <p className="text-sm text-gray-500">You don't have any courses yet.</p>
            ) : (
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            )}
            <span className="text-sm text-gray-500">
              {pendingSubmissions.length} pending submissions
            </span>
          </div>
        </section>

        {/* Submissions List */}
        {submissions.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-4xl">🎉</div><h3 className="mt-5 text-lg font-bold text-slate-800">No submissions yet</h3><p className="mt-1 text-sm text-slate-500">Student submissions for this course will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub) => {
              const assign = assignmentsMap[sub.assignmentId];
              return (
                <article key={sub.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md sm:p-6">
                  <div className="flex flex-col justify-between gap-5 lg:flex-row">
                    <div>
                      <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">Student #{sub.studentId}</span><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${sub.status === 'GRADED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{sub.status}</span></div>
                      <h4 className="mt-3 text-lg font-bold text-slate-900">{sub.studentName || `Student #${sub.studentId}`}</h4>
                      <p className="text-sm text-slate-500">{sub.studentEmail || 'Email unavailable'}</p>
                      <p className="mt-3 text-sm font-semibold text-slate-700">
                        {assign?.title ? assign.title : `Assignment #${sub.assignmentId}`}
                        {assign?.maxMarks ? ` (Max Marks: ${assign.maxMarks})` : ''}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Submitted: {new Date(sub.submittedAt).toLocaleDateString()} {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <a
                        href={sub.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100"
                      >
                        📎 View Submission File
                      </a>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 lg:max-w-xl lg:justify-end">
                      {sub.status === 'GRADED' && <span className="text-xl font-bold text-emerald-700">{sub.marks} / {assign?.maxMarks || 100}</span>}
                      <div className="w-28">
                        <input
                          type="number"
                          defaultValue={sub.marks ?? ''}
                          placeholder={assign?.maxMarks ? `Score / ${assign.maxMarks}` : 'Marks'}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                          onChange={(e) => handleGradeChange(sub.id, 'marks', e.target.value)}
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Feedback (optional)"
                        defaultValue={sub.feedback || ''}
                        className="min-w-50 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                        onChange={(e) => handleGradeChange(sub.id, 'feedback', e.target.value)}
                      />
                      <button
                        onClick={() => handleGradeSubmit(sub.id)}
                        disabled={grading === sub.id}
                        className={`rounded-lg px-4 py-2 text-sm font-bold text-white transition-all ${grading === sub.id ? 'bg-slate-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                      >
                        {grading === sub.id ? 'Saving...' : sub.status === 'GRADED' ? 'Update grade' : 'Save grade'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default LecturerGrading;