import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { assignmentAPI, courseAPI } from '../services/api';
import toast from 'react-hot-toast';

const StudentAssignments = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const studentId = user?.id;

  // Get courseId from URL query params
  const queryParams = new URLSearchParams(location.search);
  const initialCourseId = queryParams.get('courseId');

  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId || '');
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Load enrolled courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await courseAPI.getEnrolled(studentId);
        const enrolledCourses = res.data || [];
        setCourses(enrolledCourses);
        
        // If no courseId in URL but we have courses, select first one
        if (!initialCourseId && enrolledCourses.length > 0) {
          setSelectedCourseId(enrolledCourses[0].id.toString());
          navigate(`/assignments?courseId=${enrolledCourses[0].id}`, { replace: true });
        }
      } catch (error) {
        console.error('Failed to fetch enrolled courses:', error);
        toast.error('Failed to load your courses');
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, [studentId]);

  // Load assignments when course changes
  useEffect(() => {
    if (!selectedCourseId) {
      setAssignments([]);
      setLoading(false);
      return;
    }
    fetchAssignments();
  }, [selectedCourseId]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await assignmentAPI.getByCourse(selectedCourseId);
      // Fetch submissions for this student
      const submissionsRes = await assignmentAPI.getStudentSubmissions(studentId);
      const submissions = submissionsRes.data || [];

      const assignmentsWithStatus = (res.data || []).map(assignment => {
        const submission = submissions.find(s => s.assignmentId === assignment.id);
        return {
          ...assignment,
          submissionStatus: submission?.status || 'NOT_SUBMITTED',
          submissionId: submission?.id,
          marks: submission?.marks,
          feedback: submission?.feedback,
        };
      });
      setAssignments(assignmentsWithStatus);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (assignmentId) => {
    if (!fileUrl.trim() && !selectedFile) {
      toast.error('Please choose a file or provide a submission link');
      return;
    }
    setSubmitting(assignmentId);
    try {
      let submissionUrl = fileUrl.trim();
      if (selectedFile) {
        const uploadResponse = await assignmentAPI.uploadSubmissionFile(studentId, selectedFile);
        submissionUrl = `${window.location.origin.replace(':5173', ':8080')}${uploadResponse.data.fileUrl}`;
      }
      await assignmentAPI.submit(assignmentId, studentId, { fileUrl: submissionUrl });
      toast.success('Assignment submitted successfully!');
      setFileUrl('');
      setSelectedFile(null);
      await fetchAssignments();
    } catch (error) {
      toast.error(error.response?.data || 'Failed to submit assignment');
    } finally {
      setSubmitting(null);
    }
  };

  const handleCourseChange = (e) => {
    const newCourseId = e.target.value;
    setSelectedCourseId(newCourseId);
    navigate(`/assignments?courseId=${newCourseId}`);
  };

  const selectedCourse = courses.find((course) => String(course.id) === String(selectedCourseId));
  const submittedCount = assignments.filter((assignment) => assignment.submissionStatus !== 'NOT_SUBMITTED').length;
  const gradedCount = assignments.filter((assignment) => assignment.submissionStatus === 'GRADED').length;

  if (loadingCourses) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="border-b border-slate-200 bg-white/90 px-4 py-4 shadow-sm backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xl shadow-sm shadow-blue-200">📝</div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Student workspace</p>
              <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">Assignments</h1>
            </div>
          </div>
          <Link to="/dashboard" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
            <span aria-hidden="true">←</span> Dashboard
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:py-10">
        <section className="mb-8 overflow-hidden rounded-2xl bg-linear-to-r from-slate-950 via-blue-950 to-indigo-950 p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-blue-300">Coursework hub</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Stay ahead of every deadline.</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">Submit your work, track feedback, and keep your course progress moving.</p>
              {selectedCourse && <p className="mt-5 text-sm font-semibold text-white">Currently viewing: <span className="text-blue-300">{selectedCourse.name}</span></p>}
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-center backdrop-blur"><p className="text-xs text-slate-300">Total</p><p className="mt-1 text-2xl font-bold">{assignments.length}</p></div>
              <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-center backdrop-blur"><p className="text-xs text-slate-300">Submitted</p><p className="mt-1 text-2xl font-bold text-blue-300">{submittedCount}</p></div>
              <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-center backdrop-blur"><p className="text-xs text-slate-300">Graded</p><p className="mt-1 text-2xl font-bold text-emerald-300">{gradedCount}</p></div>
            </div>
          </div>
        </section>

        {/* Course Selector */}
        <section className="mb-8 flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Course context</p>
            <h3 className="mt-1 text-lg font-bold text-slate-900">Choose your course</h3>
            <p className="mt-1 text-sm text-slate-500">Switch courses to view the assignments connected to each class.</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center md:w-auto">
            {courses.length === 0 ? (
              <p className="text-sm text-slate-500">You are not enrolled in any courses yet.</p>
            ) : (
              <select
                value={selectedCourseId}
                onChange={handleCourseChange}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:w-80"
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            )}
            {selectedCourseId && (
              <Link to={`/courses/${selectedCourseId}`} className="rounded-lg bg-blue-50 px-3 py-2 text-center text-sm font-bold text-blue-700 transition hover:bg-blue-100">
                View course <span aria-hidden="true">→</span>
              </Link>
            )}
          </div>
        </section>

        {/* Assignments List */}
        {!selectedCourseId ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-4xl">📋</div>
            <h3 className="mt-5 text-lg font-bold text-slate-800">Select a course</h3>
            <p className="mt-1 text-sm text-slate-500">Choose a course to view its assignments.</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : assignments.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-4xl">📋</div>
            <h3 className="mt-5 text-lg font-bold text-slate-800">No assignments yet</h3>
            <p className="mt-1 text-sm text-slate-500">This course has no assignments.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {assignments.map((assignment) => (
              <article key={assignment.id} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg">
                <div className="h-1 bg-linear-to-r from-blue-500 via-indigo-500 to-cyan-400" />
                <div className="p-5 sm:p-6">
                <div className="flex flex-col justify-between gap-5 lg:flex-row">
                  <div className="flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">Assignment #{assignment.id}</span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{assignment.maxMarks ?? 100} marks</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{assignment.title}</h3>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{assignment.description || 'No instructions provided.'}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                      <span className="rounded-lg bg-amber-50 px-3 py-1.5 text-amber-700">Due {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'N/A'}</span>
                      <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-slate-600">Maximum score {assignment.maxMarks ?? 100}</span>
                    </div>
                  </div>
                  <div className="lg:min-w-40 lg:text-right">
                    <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${
                      assignment.submissionStatus === 'GRADED' ? 'bg-emerald-100 text-emerald-700' :
                      assignment.submissionStatus === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                      assignment.submissionStatus === 'LATE' ? 'bg-rose-100 text-rose-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {assignment.submissionStatus.replace('_', ' ')}
                    </span>
                    {assignment.marks !== null && assignment.marks !== undefined && (
                      <p className="mt-2 text-xl font-bold text-slate-900">{assignment.marks} / {assignment.maxMarks}</p>
                    )}
                    {assignment.feedback && (
                      <p className="mt-2 text-sm italic text-slate-500">“{assignment.feedback}”</p>
                    )}
                  </div>
                </div>

                {(assignment.submissionStatus === 'NOT_SUBMITTED' || assignment.submissionStatus === 'RESUBMISSION_REQUESTED') && (
                  <div className="mt-6 rounded-xl border border-blue-100 bg-slate-50/80 p-4 flex flex-wrap gap-4 items-end">
                    <div className="min-w-50 flex-1">
                        <label className="mb-1 block text-xs font-semibold text-slate-700">Upload your work</label>
                        <input
                          type="file"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-blue-700"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.png,.jpg,.jpeg"
                        />
                        {selectedFile && <p className="mt-1 text-xs text-emerald-600">Selected: {selectedFile.name}</p>}
                      </div>
                      <div className="min-w-50 flex-1">
                        <label className="mb-1 block text-xs font-semibold text-slate-700">Or paste a submission link</label>
                      <input
                        type="url"
                        value={fileUrl}
                        onChange={(e) => setFileUrl(e.target.value)}
                        placeholder="https://drive.google.com/..."
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                    <button
                      onClick={() => handleSubmit(assignment.id)}
                      disabled={submitting === assignment.id}
                      className={`rounded-lg px-5 py-2.5 text-sm font-bold text-white transition ${
                        submitting === assignment.id ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {submitting === assignment.id ? 'Submitting...' : 'Submit Assignment'}
                    </button>
                  </div>
                )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentAssignments;