import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  courseAPI,
  moduleAPI,
  progressAPI,
  assignmentAPI,
  announcementAPI,
  quizAPI,
  lessonAPI,
} from '../services/api';
import toast from 'react-hot-toast';

// Helper function to extract embeddable video URL (YouTube, Vimeo, MP4)
const getEmbedVideoUrl = (url) => {
  if (!url) return null;
  const trimmed = url.trim();

  // YouTube match: youtu.be/ID or youtube.com/watch?v=ID or youtube.com/embed/ID
  const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return { type: 'youtube', url: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0` };
  }

  // Vimeo match
  const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return { type: 'vimeo', url: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
  }

  // Direct MP4 / WebM video
  if (trimmed.match(/\.(mp4|webm|ogg)$/i)) {
    return { type: 'video', url: trimmed };
  }

  // Generic link
  return { type: 'link', url: trimmed };
};

// Helper function to construct absolute file URL for uploaded files
const getFullFileUrl = (url) => {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `http://localhost:8080${cleanPath}`;
};

const CourseDetails = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const studentId = user?.id;
  const userRole = user?.role?.replace('ROLE_', '');
  const isLecturer = userRole === 'LECTURER';
  const isAdmin = userRole === 'INSTITUTE_ADMIN' || userRole === 'SYSTEM_ADMIN';

  // Core Data States
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [completing, setCompleting] = useState(null);
  const [activeTab, setActiveTab] = useState('modules'); // 'modules' | 'assignments' | 'enrollments' | 'quizzes' | 'announcements'

  // Video / Lesson Player Modal
  const [activeLesson, setActiveLesson] = useState(null);

  // Module & Lesson Form States
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [moduleData, setModuleData] = useState({
    title: '',
    description: '',
    orderIndex: 1,
  });

  const [lessonData, setLessonData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    pdfUrl: '',
    orderIndex: 1,
    durationMinutes: 15,
    isPublished: true,
  });

  // =========================================================================
  // ASSIGNMENT SPECIFIC STATES & MODALS (UPGRADED BLUE & WHITE UI/UX)
  // =========================================================================
  const [assignmentFilter, setAssignmentFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'SUBMITTED'
  const [assignmentSearch, setAssignmentSearch] = useState('');

  // 1. Student Submit Assignment Modal
  const [submitModal, setSubmitModal] = useState({
    isOpen: false,
    assignment: null,
    fileUrl: '',
    remarks: '',
  });

  // 2. Student View Submission Details Modal
  const [viewSubmissionModal, setViewSubmissionModal] = useState({
    isOpen: false,
    assignment: null,
  });

  // 3. Lecturer Create Assignment Modal
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState(false);
  const [newAssignmentData, setNewAssignmentData] = useState({
    title: '',
    description: '',
    maxMarks: 100,
    dueDate: '',
  });

  // 4. Lecturer Review Submissions Modal
  const [gradingModal, setGradingModal] = useState({
    isOpen: false,
    assignment: null,
    submissions: [],
    loading: false,
  });

  const [gradeInput, setGradeInput] = useState({}); // { [submissionId]: { marks: number, feedback: string } }
  const [gradingSubmitting, setGradingSubmitting] = useState(null);

  // Reset forms
  const resetModuleForm = () => {
    setModuleData({ title: '', description: '', orderIndex: modules.length + 1 });
    setShowModuleForm(false);
  };

  const resetLessonForm = () => {
    setLessonData({
      title: '',
      description: '',
      videoUrl: '',
      pdfUrl: '',
      orderIndex: 1,
      durationMinutes: 15,
      isPublished: true,
    });
    setSelectedModuleId('');
    setShowLessonForm(false);
  };

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId, studentId]);

  const fetchCourseDetails = async () => {
    setLoading(true);
    try {
      // 1. Fetch Course details
      try {
        const courseRes = await courseAPI.getById(courseId);
        setCourse(courseRes.data);
      } catch (err) {
        console.error('Failed to fetch course:', err);
      }

      // 2. Check Enrollment for students
      if (studentId && !isLecturer && !isAdmin) {
        try {
          const enrolledRes = await courseAPI.getEnrolled(studentId);
          const enrolledList = Array.isArray(enrolledRes.data) ? enrolledRes.data : [];
          const enrolled = enrolledList.some(
            (c) => String(c.courseId) === String(courseId) || String(c.id) === String(courseId)
          );
          setIsEnrolled(enrolled);
        } catch (err) {
          console.warn('Enrollment check:', err);
        }
      } else if (isLecturer || isAdmin) {
        setIsEnrolled(true);
      }

      // Fetch Completed Lessons for student
      let completedLessonSet = new Set();
      if (studentId) {
        try {
          const progressRes = await progressAPI.getCompletedLessons(studentId);
          const list = Array.isArray(progressRes.data) ? progressRes.data : [];
          completedLessonSet = new Set(list.map(String));
        } catch (pErr) {
          console.warn('Progress check:', pErr);
        }
      }

      // 3. Fetch Modules with Lessons & progress
      try {
        const modulesRes = await moduleAPI.getByCourse(courseId);
        const rawModules = Array.isArray(modulesRes.data) ? modulesRes.data : [];
        const mappedModules = rawModules.map((m) => ({
          ...m,
          lessons: (m.lessons || []).map((l) => ({
            ...l,
            isCompleted: l.isCompleted || completedLessonSet.has(String(l.id)),
          })),
        }));
        setModules(mappedModules);
      } catch (err) {
        console.warn('Modules fetch:', err);
        setModules([]);
      }

      // 4. Fetch Assignments & Student Submissions
      try {
        const assignmentsRes = await assignmentAPI.getByCourse(courseId);
        const asgnList = Array.isArray(assignmentsRes.data) ? assignmentsRes.data : [];

        let studentSubs = [];
        if (studentId && !isLecturer && !isAdmin) {
          try {
            const subRes = await assignmentAPI.getStudentSubmissions(studentId);
            studentSubs = Array.isArray(subRes.data) ? subRes.data : [];
          } catch (subErr) {
            console.warn('Student submissions fetch:', subErr);
          }
        }

        const mappedAssignments = asgnList.map((a) => {
          const sub = studentSubs.find((s) => s.assignmentId === a.id);
          return {
            ...a,
            submission: sub || null,
            submissionStatus: sub ? sub.status : 'NOT_SUBMITTED',
            marks: sub ? sub.marks : null,
            feedback: sub ? sub.feedback : null,
          };
        });

        setAssignments(mappedAssignments);
      } catch (err) {
        console.warn('Assignments fetch:', err);
        setAssignments([]);
      }

      // 5. Fetch Announcements
      try {
        const announcementsRes = await announcementAPI.getCourse(courseId);
        setAnnouncements(Array.isArray(announcementsRes.data) ? announcementsRes.data : []);
      } catch (err) {
        console.warn('Announcements fetch:', err);
        setAnnouncements([]);
      }

      // 6. Fetch Quizzes (Ensure array)
      try {
        const quizzesRes = await quizAPI.getByCourse(courseId);
        const qList = Array.isArray(quizzesRes.data) ? quizzesRes.data : [];
        setQuizzes(qList);
      } catch (err) {
        console.warn('Quizzes fetch:', err);
        setQuizzes([]);
      }

      // 7. Fetch Enrolled Students for Lecturer/Admin
      if (isLecturer || isAdmin) {
        try {
          const enrollmentsRes = await courseAPI.getEnrollments(courseId);
          setEnrollments(Array.isArray(enrollmentsRes.data) ? enrollmentsRes.data : []);
        } catch (err) {
          console.warn('Enrollments fetch:', err);
          setEnrollments([]);
        }
      }
    } catch (error) {
      console.error('Error loading course details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Module Add
  const handleAddModule = async (e) => {
    e.preventDefault();
    if (!moduleData.title.trim()) {
      toast.error('Module title is required');
      return;
    }
    setSubmitting(true);
    try {
      await moduleAPI.create({ ...moduleData, courseId: parseInt(courseId) });
      toast.success('✅ Module added successfully!');
      resetModuleForm();
      await fetchCourseDetails();
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data || 'Failed to add module');
    } finally {
      setSubmitting(false);
    }
  };

  // Lesson Add
  const handleAddLesson = async (e) => {
    e.preventDefault();
    if (!lessonData.title.trim() || !selectedModuleId) {
      toast.error('Lesson title and Module selection are required');
      return;
    }
    setSubmitting(true);
    try {
      await lessonAPI.create({ ...lessonData, moduleId: parseInt(selectedModuleId) });
      toast.success('✅ Lesson added successfully with resources!');
      resetLessonForm();
      await fetchCourseDetails();
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data || 'Failed to add lesson');
    } finally {
      setSubmitting(false);
    }
  };

  // Student Enroll
  const handleEnroll = async () => {
    if (!studentId) {
      toast.error('Please log in first');
      return;
    }
    setEnrolling(true);
    try {
      await courseAPI.enroll(courseId, studentId);
      toast.success('🎉 Successfully enrolled in this course!');
      setIsEnrolled(true);
      await fetchCourseDetails();
    } catch (error) {
      const errorMsg =
        error.response?.data?.error ||
        (typeof error.response?.data === 'string' ? error.response.data : null) ||
        'Failed to enroll in course';

      if (String(errorMsg).toLowerCase().includes('already enrolled')) {
        setIsEnrolled(true);
        toast.success('You are already enrolled in this course! ✓');
        await fetchCourseDetails();
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setEnrolling(false);
    }
  };

  // Complete Lesson
  const handleCompleteLesson = async (lessonId) => {
    const effectiveStudentId = studentId || user?.id || 1;
    setCompleting(lessonId);
    try {
      await progressAPI.completeLesson(lessonId, effectiveStudentId);
      toast.success('Lesson marked as completed! 🎯');
      await fetchCourseDetails();
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data || 'Failed to complete lesson');
    } finally {
      setCompleting(null);
    }
  };

  // =========================================================================
  // ASSIGNMENT HANDLERS
  // =========================================================================

  // 1. Student Submit Assignment
  const handleOpenSubmitModal = (assignment) => {
    setSubmitModal({
      isOpen: true,
      assignment,
      fileUrl: assignment.submission?.fileUrl || '',
      remarks: assignment.submission?.remarks || '',
    });
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!submitModal.fileUrl.trim() && !submitModal.remarks.trim()) {
      toast.error('Please provide a file URL or submission answer.');
      return;
    }
    setSubmitting(true);
    try {
      await assignmentAPI.submit(submitModal.assignment.id, studentId, {
        fileUrl: submitModal.fileUrl.trim(),
        remarks: submitModal.remarks.trim(),
      });
      toast.success('🎉 Assignment submitted successfully!');
      setSubmitModal({ isOpen: false, assignment: null, fileUrl: '', remarks: '' });
      await fetchCourseDetails();
    } catch (error) {
      console.error('Failed to submit assignment:', error);
      toast.error(error.response?.data?.error || error.response?.data || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Lecturer Create Assignment
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!newAssignmentData.title.trim()) {
      toast.error('Assignment title is required.');
      return;
    }
    setSubmitting(true);
    try {
      await assignmentAPI.create({
        ...newAssignmentData,
        courseId: parseInt(courseId),
        lecturerId: user?.id,
        maxMarks: parseInt(newAssignmentData.maxMarks) || 100,
      });
      toast.success('✅ Assignment published successfully!');
      setShowCreateAssignmentModal(false);
      setNewAssignmentData({ title: '', description: '', maxMarks: 100, dueDate: '' });
      await fetchCourseDetails();
    } catch (error) {
      console.error('Failed to create assignment:', error);
      toast.error(error.response?.data?.error || error.response?.data || 'Failed to create assignment');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Lecturer Open Grading Modal
  const handleOpenGradingModal = async (assignment) => {
    setGradingModal({
      isOpen: true,
      assignment,
      submissions: [],
      loading: true,
    });
    try {
      const res = await assignmentAPI.getSubmissions(assignment.id);
      const subs = Array.isArray(res.data) ? res.data : [];
      setGradingModal((prev) => ({
        ...prev,
        submissions: subs,
        loading: false,
      }));

      // Pre-fill existing grades in input map
      const initialInputs = {};
      subs.forEach((s) => {
        initialInputs[s.id] = {
          marks: s.marks !== null && s.marks !== undefined ? s.marks : '',
          feedback: s.feedback || '',
        };
      });
      setGradeInput(initialInputs);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      toast.error('Failed to load student submissions');
      setGradingModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // 4. Lecturer Submit Grade
  const handleSaveGrade = async (submissionId) => {
    const input = gradeInput[submissionId];
    if (!input || input.marks === '' || isNaN(input.marks)) {
      toast.error('Please enter valid numeric marks.');
      return;
    }
    setGradingSubmitting(submissionId);
    try {
      await assignmentAPI.grade(submissionId, user?.id, {
        marks: parseFloat(input.marks),
        feedback: input.feedback || '',
      });
      toast.success('Grade & feedback recorded! 🎯');

      // Refresh grading modal submissions
      if (gradingModal.assignment) {
        const res = await assignmentAPI.getSubmissions(gradingModal.assignment.id);
        setGradingModal((prev) => ({
          ...prev,
          submissions: Array.isArray(res.data) ? res.data : [],
        }));
      }
      await fetchCourseDetails();
    } catch (error) {
      console.error('Grading failed:', error);
      toast.error(error.response?.data?.error || error.response?.data || 'Failed to submit grade');
    } finally {
      setGradingSubmitting(null);
    }
  };

  // Stats
  const totalLessons = modules.reduce((acc, m) => acc + (m.lessons ? m.lessons.length : 0), 0);
  const completedLessons = modules.reduce(
    (acc, m) => acc + (m.lessons ? m.lessons.filter((l) => l.isCompleted).length : 0),
    0
  );
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Filtered Assignments
  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch =
      a.title?.toLowerCase().includes(assignmentSearch.toLowerCase()) ||
      a.description?.toLowerCase().includes(assignmentSearch.toLowerCase());

    if (!matchesSearch) return false;

    if (assignmentFilter === 'PENDING') {
      return a.submissionStatus === 'NOT_SUBMITTED' || a.submissionStatus === 'PENDING';
    }
    if (assignmentFilter === 'SUBMITTED') {
      return a.submissionStatus === 'SUBMITTED' || a.submissionStatus === 'GRADED';
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-bold text-sm">Loading course workspace...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-lg border border-slate-200">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
            ⚠️
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Course Not Found</h2>
          <p className="text-xs text-slate-500 mt-2 mb-6">
            The course you are looking for does not exist or has been removed.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  const activeEmbed = activeLesson?.videoUrl ? getEmbedVideoUrl(activeLesson.videoUrl) : null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-16 animate-fadeIn">
      {/* Top Header Navbar */}
      <nav className="bg-white border-b border-slate-200/80 sticky top-0 z-30 px-6 py-3.5 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition text-sm font-bold flex items-center gap-1"
          >
            <span>←</span> Back
          </button>
          <div className="h-5 w-px bg-slate-200"></div>
          <h1 className="text-base font-extrabold text-slate-900 truncate max-w-md">
            {course.name}
          </h1>
        </div>
        <Link
          to={isLecturer ? '/lecturer/courses' : isAdmin ? '/dashboard' : '/student/courses'}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50/80 px-4 py-2 rounded-xl transition hover:bg-blue-100"
        >
          {isLecturer ? 'My Teaching Courses' : isAdmin ? 'Admin Dashboard' : 'My Courses'}
        </Link>
      </nav>

      <div className="max-w-6xl mx-auto px-4 mt-6">
        {/* Course Hero Banner */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-blue-950 rounded-3xl text-white p-6 sm:p-8 shadow-xl relative overflow-hidden mb-8 border border-white/10">
          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full">
                  ⏱️ {course.durationWeeks ? `${course.durationWeeks} Weeks` : 'Self-Paced'}
                </span>
                <span className="text-xs font-mono text-slate-400">Course #{course.id}</span>
              </div>

              {isLecturer || isAdmin ? (
                <span className="text-xs font-bold px-3.5 py-1 bg-white/10 text-white border border-white/20 rounded-full">
                  Status: {course.status ? course.status.replace('_', ' ') : 'ACTIVE'}
                </span>
              ) : isEnrolled ? (
                <span className="text-xs font-bold px-3.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full flex items-center gap-1">
                  <span>✓</span> Enrolled
                </span>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/25 transition active:scale-95 disabled:opacity-50"
                >
                  {enrolling ? 'Enrolling...' : 'Enroll in Course'}
                </button>
              )}
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {course.name}
            </h2>

            <p className="text-slate-300 mt-2.5 text-sm sm:text-base max-w-3xl leading-relaxed">
              {course.description || 'Comprehensive learning course.'}
            </p>

            {/* Quick Stats Counter Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 text-center">
                <p className="text-[11px] text-slate-300 font-bold uppercase tracking-wider">Modules</p>
                <p className="text-xl font-extrabold text-white mt-1">{modules.length}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 text-center">
                <p className="text-[11px] text-slate-300 font-bold uppercase tracking-wider">Lessons</p>
                <p className="text-xl font-extrabold text-white mt-1">{totalLessons}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 text-center">
                <p className="text-[11px] text-slate-300 font-bold uppercase tracking-wider">Assignments</p>
                <p className="text-xl font-extrabold text-white mt-1">{assignments.length}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 text-center">
                <p className="text-[11px] text-slate-300 font-bold uppercase tracking-wider">
                  {isLecturer || isAdmin ? 'Enrolled Students' : 'Your Progress'}
                </p>
                <p className="text-xl font-extrabold text-emerald-400 mt-1">
                  {isLecturer || isAdmin ? enrollments.length : `${progressPercent}%`}
                </p>
              </div>
            </div>

            {/* Progress Bar for Students */}
            {!isLecturer && !isAdmin && isEnrolled && totalLessons > 0 && (
              <div className="mt-5">
                <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-semibold">
                  <span>Overall Completion</span>
                  <span>{completedLessons} of {totalLessons} Lessons Finished</span>
                </div>
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex border-b border-slate-200 mb-6 bg-white rounded-2xl p-1.5 shadow-xs gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveTab('modules')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'modules'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            📖 Curriculum &amp; Lessons ({modules.length})
          </button>

          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'assignments'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            📝 Assignments ({assignments.length})
          </button>

          {(isLecturer || isAdmin) && (
            <button
              onClick={() => setActiveTab('enrollments')}
              className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'enrollments'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              👥 Enrolled Students ({enrollments.length})
            </button>
          )}

          <button
            onClick={() => setActiveTab('quizzes')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'quizzes'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            ❓ Quizzes ({quizzes.length})
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'announcements'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            📢 Announcements ({announcements.length})
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: MODULES & LESSONS WORKSPACE */}
        {/* ========================================================================= */}
        {activeTab === 'modules' && (
          <div className="space-y-6">
            {/* Lecturer Add Module Button */}
            {isLecturer && (
              <div className="flex justify-end">
                <button
                  onClick={() => setShowModuleForm(!showModuleForm)}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95"
                >
                  <span>{showModuleForm ? '✕ Cancel' : '➕ Add New Module'}</span>
                </button>
              </div>
            )}

            {/* Lecturer Add Module Form */}
            {isLecturer && showModuleForm && (
              <div className="bg-purple-50/80 border border-purple-200 rounded-3xl p-6 shadow-sm animate-scaleUp">
                <h3 className="font-extrabold text-purple-900 text-sm mb-3">➕ Add New Module to Course</h3>
                <form onSubmit={handleAddModule} className="space-y-3.5">
                  <input
                    type="text"
                    placeholder="Module Title (e.g. Module 1: Introduction to Full-Stack) *"
                    value={moduleData.title}
                    onChange={(e) => setModuleData({ ...moduleData, title: e.target.value })}
                    className="w-full px-4 py-2.5 border border-purple-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    required
                  />
                  <textarea
                    placeholder="Module Description (Optional)"
                    value={moduleData.description}
                    onChange={(e) => setModuleData({ ...moduleData, description: e.target.value })}
                    className="w-full px-4 py-2.5 border border-purple-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    rows={2}
                  />
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      placeholder="Order Index"
                      value={moduleData.orderIndex}
                      onChange={(e) => setModuleData({ ...moduleData, orderIndex: parseInt(e.target.value) || 1 })}
                      className="w-32 px-4 py-2.5 border border-purple-200 rounded-xl text-xs bg-white"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                    >
                      {submitting ? 'Saving Module...' : 'Save Module'}
                    </button>
                    <button
                      type="button"
                      onClick={resetModuleForm}
                      className="px-4 py-2.5 bg-white border border-purple-200 text-purple-700 rounded-xl text-xs font-bold hover:bg-purple-100/50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Modules List */}
            {modules.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-sm p-12 text-center border border-slate-200">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto text-3xl mb-3 shadow-inner">
                  📖
                </div>
                <h3 className="text-base font-extrabold text-slate-800">No Modules Created Yet</h3>
                <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                  {isLecturer
                    ? 'Click "+ Add New Module" above to start adding lessons, video links, and learning materials.'
                    : 'The instructor has not uploaded any modules for this course yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {modules.map((module, idx) => (
                  <div
                    key={module.id}
                    className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"
                  >
                    {/* Module Header */}
                    <div className="bg-gradient-to-r from-slate-50 to-white px-6 py-4 border-b border-slate-200/80 flex flex-wrap justify-between items-center gap-3">
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-sm">
                          {idx + 1}
                        </span>
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900">{module.title}</h3>
                          {module.description && (
                            <p className="text-xs text-slate-500 mt-0.5">{module.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Add Lesson Button (Lecturer Only) */}
                      {isLecturer && (
                        <button
                          onClick={() => {
                            setSelectedModuleId(module.id);
                            setShowLessonForm(selectedModuleId === module.id ? !showLessonForm : true);
                          }}
                          className="text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-3.5 py-1.5 rounded-xl transition"
                        >
                          {showLessonForm && selectedModuleId === module.id ? '✕ Cancel' : '➕ Add Lesson'}
                        </button>
                      )}
                    </div>

                    {/* Add Lesson Form (Lecturer Only) */}
                    {isLecturer && showLessonForm && selectedModuleId === module.id && (
                      <div className="bg-blue-50/70 border-b border-blue-200 p-6 animate-scaleUp">
                        <h4 className="font-extrabold text-blue-900 mb-3 text-xs uppercase tracking-wider">
                          ➕ New Lesson for "{module.title}"
                        </h4>
                        <form onSubmit={handleAddLesson} className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                              type="text"
                              placeholder="Lesson Title (e.g. 1.1 Intro to React Components) *"
                              value={lessonData.title}
                              onChange={(e) => setLessonData({ ...lessonData, title: e.target.value })}
                              className="w-full px-3.5 py-2.5 border border-blue-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              required
                            />
                            <input
                              type="text"
                              placeholder="Video URL (YouTube or direct video link)"
                              value={lessonData.videoUrl}
                              onChange={(e) => setLessonData({ ...lessonData, videoUrl: e.target.value })}
                              className="w-full px-3.5 py-2.5 border border-blue-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                              type="text"
                              placeholder="PDF URL / Learning Material Link"
                              value={lessonData.pdfUrl}
                              onChange={(e) => setLessonData({ ...lessonData, pdfUrl: e.target.value })}
                              className="w-full px-3.5 py-2.5 border border-blue-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                            <textarea
                              placeholder="Lesson Description & Notes"
                              value={lessonData.description}
                              onChange={(e) => setLessonData({ ...lessonData, description: e.target.value })}
                              className="w-full px-3.5 py-2.5 border border-blue-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              rows={2}
                            />
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                            <div className="flex items-center gap-3">
                              <input
                                type="number"
                                placeholder="Duration (mins)"
                                value={lessonData.durationMinutes}
                                onChange={(e) => setLessonData({ ...lessonData, durationMinutes: parseInt(e.target.value) || 15 })}
                                className="w-28 px-3 py-2 border border-blue-200 rounded-xl text-xs bg-white"
                              />
                              <label className="flex items-center gap-1.5 text-xs text-slate-700 font-bold cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={lessonData.isPublished}
                                  onChange={(e) => setLessonData({ ...lessonData, isPublished: e.target.checked })}
                                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                Published
                              </label>
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="submit"
                                disabled={submitting}
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
                              >
                                {submitting ? 'Saving...' : 'Save Lesson'}
                              </button>
                              <button
                                type="button"
                                onClick={resetLessonForm}
                                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Lessons List in Module */}
                    <div className="divide-y divide-slate-100">
                      {module.lessons && module.lessons.length > 0 ? (
                        module.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 transition hover:bg-slate-50/80"
                          >
                            <div className="flex items-center gap-3.5 flex-1 min-w-[200px]">
                              <button
                                onClick={() => setActiveLesson(lesson)}
                                className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center text-sm transition shadow-xs flex-shrink-0"
                                title="Play Lesson"
                              >
                                ▶️
                              </button>
                              <div>
                                <h4
                                  onClick={() => setActiveLesson(lesson)}
                                  className="font-bold text-slate-900 text-sm hover:text-blue-600 cursor-pointer transition"
                                >
                                  {lesson.title}
                                </h4>
                                <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                                  {lesson.durationMinutes && (
                                    <span>⏱️ {lesson.durationMinutes} mins</span>
                                  )}
                                  {lesson.videoUrl && (
                                    <span className="text-blue-600 font-semibold">📺 Video Available</span>
                                  )}
                                  {lesson.pdfUrl && (
                                    <span className="text-purple-600 font-semibold">📄 PDF Attached</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2.5">
                              {/* Open Video Player Button */}
                              <button
                                onClick={() => setActiveLesson(lesson)}
                                className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition flex items-center gap-1"
                              >
                                <span>📺</span>
                                View Lesson
                              </button>

                              {/* Student Complete Toggle */}
                              {!isLecturer && !isAdmin && (
                                lesson.isCompleted ? (
                                  <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1">
                                    ✓ Finished
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleCompleteLesson(lesson.id)}
                                    disabled={completing === lesson.id || !isEnrolled}
                                    className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition ${
                                      completing === lesson.id
                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        : isEnrolled
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    }`}
                                  >
                                    {completing === lesson.id ? 'Saving...' : 'Mark Done'}
                                  </button>
                                )
                              )}
                            </div>

                            {/* Description & Links Details */}
                            {lesson.description && (
                              <p className="w-full text-xs text-slate-600 pl-13 pt-1 border-t border-slate-50">
                                {lesson.description}
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="px-6 py-6 text-xs text-slate-400 italic text-center">
                          No lessons added in this module yet.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ASSIGNMENTS WORKSPACE (UPGRADED BLUE & WHITE MODERN UI/UX) */}
        {/* ========================================================================= */}
        {activeTab === 'assignments' && (
          <div className="space-y-6">
            {/* Header Toolbar: Search, Filters & Action */}
            <div className="bg-white rounded-3xl p-6 border border-blue-100/90 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm shadow-md shadow-blue-500/20">
                    📘
                  </span>
                  <span>Course Assignments &amp; Coursework</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Track deadlines, submit homework, and view grades with feedback.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search assignments..."
                    value={assignmentSearch}
                    onChange={(e) => setAssignmentSearch(e.target.value)}
                    className="pl-8 pr-3.5 py-2 text-xs bg-slate-50 border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 w-44 sm:w-56"
                  />
                  <span className="absolute left-2.5 top-2.5 text-xs text-slate-400">🔍</span>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 text-xs">
                  <button
                    onClick={() => setAssignmentFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition ${
                      assignmentFilter === 'ALL'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({assignments.length})
                  </button>
                  <button
                    onClick={() => setAssignmentFilter('PENDING')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition ${
                      assignmentFilter === 'PENDING'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setAssignmentFilter('SUBMITTED')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition ${
                      assignmentFilter === 'SUBMITTED'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Submitted
                  </button>
                </div>

                {/* Lecturer Create Assignment Button */}
                {(isLecturer || isAdmin) && (
                  <button
                    onClick={() => setShowCreateAssignmentModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition flex items-center gap-1.5 active:scale-95"
                  >
                    <span>➕</span>
                    <span>Create Assignment</span>
                  </button>
                )}
              </div>
            </div>

            {/* Assignments Grid */}
            {filteredAssignments.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-sm p-12 text-center border border-blue-100">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto text-3xl mb-3 shadow-inner">
                  📝
                </div>
                <h4 className="font-extrabold text-slate-900 text-base">No Assignments Found</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {isLecturer
                    ? 'Click "+ Create Assignment" above to post coursework and due dates for your students.'
                    : 'There are no active assignments matching your filter.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredAssignments.map((asgn) => {
                  const isSubmitted = asgn.submissionStatus === 'SUBMITTED' || asgn.submissionStatus === 'GRADED' || asgn.submissionStatus === 'LATE';
                  const isGraded = asgn.submissionStatus === 'GRADED' || asgn.marks !== null;

                  return (
                    <div
                      key={asgn.id}
                      className="group relative flex flex-col justify-between p-6 rounded-3xl bg-white border border-blue-100/90 shadow-xs hover:shadow-xl hover:border-blue-400 hover:-translate-y-1 transition-all duration-300"
                    >
                      {/* Top Accent Gradient Bar */}
                      <div className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-3xl ${
                        isGraded
                          ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                          : isSubmitted
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                          : 'bg-gradient-to-r from-blue-400 via-indigo-400 to-sky-400'
                      }`} />

                      <div>
                        {/* Header Row: Badge & Max Marks */}
                        <div className="flex items-center justify-between gap-3 mb-3 pt-1">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full text-[11px] font-black bg-blue-50 text-blue-700 border border-blue-200 tracking-wide">
                              ASSIGNMENT #{asgn.id}
                            </span>
                            {/* Student Status Badge */}
                            {!isLecturer && !isAdmin && (
                              isGraded ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  ✓ Graded ({asgn.marks}/{asgn.maxMarks || 100})
                                </span>
                              ) : isSubmitted ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                  ● Submitted
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  ⏳ Pending
                                </span>
                              )
                            )}
                          </div>

                          <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-50 text-slate-700 border border-slate-200">
                            {asgn.maxMarks || 100} Marks
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition tracking-tight">
                          {asgn.title}
                        </h4>

                        {/* Description */}
                        <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                          {asgn.description || 'No detailed instructions provided.'}
                        </p>

                        {/* Due Date & Lecturer Info Strip */}
                        <div className="mt-4 p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <span>📅 Due:</span>
                            <span className="font-bold text-blue-700">
                              {asgn.dueDate ? new Date(asgn.dueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'No Deadline'}
                            </span>
                          </span>
                          <span className="text-[11px] font-medium text-slate-500">
                            Coursework Task
                          </span>
                        </div>

                        {/* Grade Feedback Box for Student */}
                        {!isLecturer && !isAdmin && isGraded && asgn.feedback && (
                          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900">
                            <span className="font-bold block">💬 Instructor Feedback:</span>
                            <p className="mt-0.5 text-[11px] text-emerald-800">{asgn.feedback}</p>
                          </div>
                        )}
                      </div>

                      {/* Bottom Action Row */}
                      <div className="flex items-center gap-2.5 pt-5 mt-4 border-t border-slate-100">
                        {/* Student Actions */}
                        {!isLecturer && !isAdmin && (
                          <>
                            {isSubmitted ? (
                              <button
                                onClick={() => setViewSubmissionModal({ isOpen: true, assignment: asgn })}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition flex items-center justify-center gap-1.5"
                              >
                                <span>📄</span>
                                <span>View My Submission</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenSubmitModal(asgn)}
                                disabled={!isEnrolled}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                              >
                                <span>📤</span>
                                <span>{isEnrolled ? 'Submit Assignment' : 'Enroll to Submit'}</span>
                              </button>
                            )}
                          </>
                        )}

                        {/* Lecturer / Admin Actions */}
                        {(isLecturer || isAdmin) && (
                          <button
                            onClick={() => handleOpenGradingModal(asgn)}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition active:scale-95 flex items-center justify-center gap-1.5"
                          >
                            <span>👨‍🏫</span>
                            <span>Review &amp; Grade Submissions</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: ENROLLED STUDENTS */}
        {/* ========================================================================= */}
        {activeTab === 'enrollments' && (isLecturer || isAdmin) && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50 px-6 py-5">
              <h3 className="text-base font-extrabold text-slate-900">Enrolled Student Roster</h3>
              <p className="text-xs text-slate-500 mt-0.5">Students who enrolled and have access to this course.</p>
            </div>
            {enrollments.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No students enrolled yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3">Student Name</th>
                      <th className="px-6 py-3">Email</th>
                      <th className="px-6 py-3">Enrolled Date</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {enrollments.map((enr) => (
                      <tr key={enr.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-3.5 font-bold text-slate-900">{enr.studentName || `Student #${enr.studentId}`}</td>
                        <td className="px-6 py-3.5 text-slate-600">{enr.studentEmail || 'N/A'}</td>
                        <td className="px-6 py-3.5 text-slate-500">{enr.enrolledAt ? new Date(enr.enrolledAt).toLocaleDateString() : 'Active'}</td>
                        <td className="px-6 py-3.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {enr.status || 'ACTIVE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: QUIZZES */}
        {/* ========================================================================= */}
        {activeTab === 'quizzes' && (
          <div>
            {quizzes.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-sm p-12 text-center border border-slate-200">
                <div className="text-3xl mb-2">❓</div>
                <h4 className="font-extrabold text-slate-800 text-sm">No Quizzes Available</h4>
                <p className="text-xs text-slate-500 mt-1">No quizzes created for this course yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quizzes.map((quiz) => (
                  <div key={quiz.id} className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 hover:shadow-md transition flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-900 text-sm">{quiz.title}</h4>
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-extrabold">
                          {quiz.durationMinutes || 30} mins
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2">{quiz.description || 'Assessment quiz'}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => navigate(`/student/quiz/${quiz.id}`)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition"
                      >
                        Attempt Quiz 📝
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: ANNOUNCEMENTS */}
        {/* ========================================================================= */}
        {activeTab === 'announcements' && (
          <div>
            {announcements.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-sm p-12 text-center border border-slate-200">
                <div className="text-3xl mb-2">📢</div>
                <h4 className="font-extrabold text-slate-800 text-sm">No Announcements</h4>
                <p className="text-xs text-slate-500 mt-1">No announcements published for this course yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map((anc) => (
                  <div key={anc.id} className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200">
                    <h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-2">
                      <span>📢</span> {anc.title}
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{anc.message || anc.content}</p>
                    <p className="text-[10px] text-slate-400 mt-3">{anc.createdAt ? new Date(anc.createdAt).toLocaleDateString() : 'Recently'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 🎬 LESSON VIDEO CINEMA PLAYER MODAL */}
      {/* ========================================================================= */}
      {activeLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-scaleUp">
            {/* Player Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-400">Lesson Video Player</span>
                <h3 className="text-base font-extrabold text-white mt-0.5">{activeLesson.title}</h3>
              </div>
              <button
                onClick={() => setActiveLesson(null)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition"
              >
                ✕
              </button>
            </div>

            {/* Video Player Area */}
            <div className="bg-black flex items-center justify-center relative aspect-video w-full max-h-[460px]">
              {activeEmbed && activeEmbed.type === 'youtube' ? (
                <iframe
                  src={activeEmbed.url}
                  title={activeLesson.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : activeEmbed && activeEmbed.type === 'vimeo' ? (
                <iframe
                  src={activeEmbed.url}
                  title={activeLesson.title}
                  className="w-full h-full border-0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : activeEmbed && activeEmbed.type === 'video' ? (
                <video
                  src={activeEmbed.url}
                  controls
                  autoPlay
                  className="w-full h-full max-h-[460px]"
                >
                  Your browser does not support the video tag.
                </video>
              ) : activeLesson.videoUrl ? (
                <div className="p-8 text-center text-white">
                  <div className="text-4xl mb-2">🔗</div>
                  <p className="text-sm font-bold mb-3">External Video URL Link</p>
                  <a
                    href={activeLesson.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition"
                  >
                    Open Video in New Tab ↗
                  </a>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <div className="text-4xl mb-2">📄</div>
                  <p className="text-xs">No video attached to this lesson. Review reading materials below.</p>
                </div>
              )}
            </div>

            {/* Player Details & Action Footer */}
            <div className="p-6 bg-slate-50/70 border-t border-slate-200 overflow-y-auto space-y-4">
              {activeLesson.description && (
                <div>
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Lesson Notes</h5>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{activeLesson.description}</p>
                </div>
              )}

              {activeLesson.pdfUrl && (
                <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📄</span>
                    <div>
                      <h6 className="font-bold text-xs text-purple-900">Learning Materials Attached</h6>
                      <p className="text-[11px] text-purple-700">PDF document / Lecture slides</p>
                    </div>
                  </div>
                  <a
                    href={activeLesson.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition"
                  >
                    Download / Open PDF ↗
                  </a>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setActiveLesson(null)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition"
                >
                  Close Player
                </button>

                {!isLecturer && !isAdmin && (
                  <button
                    onClick={() => {
                      handleCompleteLesson(activeLesson.id);
                      setActiveLesson(null);
                    }}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                  >
                    Mark Lesson as Completed ✓
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 📤 UPGRADED STUDENT SUBMIT ASSIGNMENT MODAL (BLUE & WHITE UI/UX) */}
      {/* ========================================================================= */}
      {submitModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-blue-100 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-950 text-white p-6 relative">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md text-white flex items-center justify-center text-2xl shadow-inner border border-white/20">
                    📤
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">
                        Assignment Submission
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                        {submitModal.assignment?.maxMarks || 100} Marks
                      </span>
                    </div>
                    <h4 className="text-xl font-black text-white mt-0.5 tracking-tight">
                      {submitModal.assignment?.title}
                    </h4>
                  </div>
                </div>

                <button
                  onClick={() => setSubmitModal({ isOpen: false, assignment: null, fileUrl: '', remarks: '', mode: 'upload', selectedFile: null, textAnswer: '', agreedPledge: false })}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition"
                >
                  ✕
                </button>
              </div>

              {/* Due Date & Course Strip */}
              <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-white/10 text-xs text-slate-300">
                <span className="flex items-center gap-1 font-semibold">
                  <span>📅 Due:</span>
                  <span className="text-white font-bold">
                    {submitModal.assignment?.dueDate
                      ? new Date(submitModal.assignment.dueDate).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'No Deadline'}
                  </span>
                </span>
                <span>•</span>
                <span>Course #{course?.id} - {course?.name}</span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-7 overflow-y-auto space-y-5 flex-1 bg-slate-50/50">
              {/* Assignment Instructions Accordion */}
              {submitModal.assignment?.description && (
                <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
                    <span className="flex items-center gap-1.5 text-blue-700">
                      <span>📋</span> Task Guidelines &amp; Instructions
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {submitModal.assignment.description}
                  </p>
                </div>
              )}

              {/* Submission Mode Selector Tabs */}
              <div>
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2">
                  Choose Submission Method
                </label>
                <div className="grid grid-cols-3 gap-2 bg-slate-200/70 p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setSubmitModal((prev) => ({ ...prev, mode: 'upload' }))}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      (submitModal.mode || 'upload') === 'upload'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>📂</span>
                    <span>Upload File</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubmitModal((prev) => ({ ...prev, mode: 'link' }))}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      submitModal.mode === 'link'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>🔗</span>
                    <span>Cloud Link</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubmitModal((prev) => ({ ...prev, mode: 'text' }))}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      submitModal.mode === 'text'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>✍️</span>
                    <span>Text Answer</span>
                  </button>
                </div>
              </div>

              {/* MODE 1: FILE UPLOAD (DRAG & DROP) */}
              {(submitModal.mode || 'upload') === 'upload' && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700">
                    Upload Your Document / Project File
                  </label>
                  
                  {submitModal.selectedFile ? (
                    <div className="bg-blue-50/80 border-2 border-blue-300 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-blue-500/20">
                          📄
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-900 truncate max-w-xs">
                            {submitModal.selectedFile.name}
                          </p>
                          <p className="text-[11px] text-blue-700 font-semibold">
                            {(submitModal.selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for submission
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSubmitModal((prev) => ({ ...prev, selectedFile: null }))}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition text-xs font-bold"
                        title="Remove file"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300/80 hover:border-blue-500 bg-white hover:bg-blue-50/30 rounded-3xl p-8 cursor-pointer transition group">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 group-hover:scale-110 flex items-center justify-center text-3xl mb-3 shadow-inner transition">
                        ☁️
                      </div>
                      <p className="font-extrabold text-sm text-slate-800 group-hover:text-blue-700 transition">
                        Click to select or drag &amp; drop your file here
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Supported formats: PDF, DOCX, ZIP, PNG, JPG (Max: 10 MB)
                      </p>
                      <input
                        type="file"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            if (file.size > 10 * 1024 * 1024) {
                              toast.error('File size must be 10 MB or less');
                              return;
                            }
                            setSubmitModal((prev) => ({ ...prev, selectedFile: file }));
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              )}

              {/* MODE 2: CLOUD LINK URL */}
              {submitModal.mode === 'link' && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700">
                    Paste Cloud Link / Repository URL <span className="text-rose-500">*</span>
                  </label>

                  {/* Preset Helper Chips */}
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase py-1">Quick Presets:</span>
                    {['Google Drive', 'GitHub', 'Figma', 'OneDrive', 'Dropbox'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          if (!submitModal.fileUrl) {
                            setSubmitModal((prev) => ({ ...prev, fileUrl: `https://${preset.toLowerCase().replace(' ', '')}.com/` }));
                          }
                        }}
                        className="text-[10px] font-bold px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 rounded-lg transition"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <input
                      type="url"
                      placeholder="https://drive.google.com/... or https://github.com/..."
                      value={submitModal.fileUrl}
                      onChange={(e) => setSubmitModal((prev) => ({ ...prev, fileUrl: e.target.value }))}
                      className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-2xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                    />
                    <span className="absolute left-3 top-3.5 text-xs text-slate-400">🔗</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Ensure your link permissions are set to "Anyone with the link can view".
                  </p>
                </div>
              )}

              {/* MODE 3: TEXT / ONLINE ANSWER */}
              {submitModal.mode === 'text' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Type or Paste Your Answer / Code <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Write your complete response, essay, or code solution here..."
                    value={submitModal.textAnswer || ''}
                    onChange={(e) => setSubmitModal((prev) => ({ ...prev, textAnswer: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono leading-relaxed"
                  />
                </div>
              )}

              {/* Optional Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Optional Note / Remarks for Instructor
                </label>
                <input
                  type="text"
                  placeholder="e.g. Completed with extra credit questions..."
                  value={submitModal.remarks}
                  onChange={(e) => setSubmitModal((prev) => ({ ...prev, remarks: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Academic Integrity Pledge Checkbox */}
              <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="academicPledge"
                  checked={submitModal.agreedPledge || false}
                  onChange={(e) => setSubmitModal((prev) => ({ ...prev, agreedPledge: e.target.checked }))}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="academicPledge" className="text-xs text-slate-700 font-medium cursor-pointer">
                  I confirm that this submission is my own authentic work and adheres to the institute's academic integrity and honor code.
                </label>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-5 sm:p-6 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSubmitModal({ isOpen: false, assignment: null, fileUrl: '', remarks: '', mode: 'upload', selectedFile: null, textAnswer: '', agreedPledge: false })}
                className="px-5 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={async (e) => {
                  e.preventDefault();
                  const mode = submitModal.mode || 'upload';

                  // Validation
                  if (mode === 'upload' && !submitModal.selectedFile && !submitModal.fileUrl) {
                    toast.error('Please select a file to upload.');
                    return;
                  }
                  if (mode === 'link' && !submitModal.fileUrl.trim()) {
                    toast.error('Please enter a valid cloud link.');
                    return;
                  }
                  if (mode === 'text' && !submitModal.textAnswer?.trim()) {
                    toast.error('Please enter your written answer.');
                    return;
                  }
                  if (!submitModal.agreedPledge) {
                    toast.error('Please accept the academic integrity pledge.');
                    return;
                  }

                  setSubmitting(true);
                  try {
                    let finalFileUrl = submitModal.fileUrl || '';
                    const effectiveStudentId = studentId || user?.id || 1;

                    // If file upload mode and file selected, upload to backend first
                    if (mode === 'upload' && submitModal.selectedFile) {
                      toast.loading('Uploading file to server...', { id: 'uploadToast' });
                      try {
                        const uploadRes = await assignmentAPI.uploadSubmissionFile(effectiveStudentId, submitModal.selectedFile);
                        finalFileUrl = uploadRes.data?.fileUrl || `/uploads/assignments/${submitModal.selectedFile.name}`;
                      } catch (uploadErr) {
                        console.warn('Backend file upload fallback:', uploadErr);
                        finalFileUrl = `/uploads/assignments/${submitModal.selectedFile.name}`;
                      } finally {
                        toast.dismiss('uploadToast');
                      }
                    } else if (mode === 'text') {
                      finalFileUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(submitModal.textAnswer)}`;
                    }

                    // Submit assignment
                    await assignmentAPI.submit(submitModal.assignment.id, effectiveStudentId, {
                      fileUrl: finalFileUrl || 'Attached submission file',
                      remarks: mode === 'text' ? (submitModal.textAnswer + '\n\nRemarks: ' + (submitModal.remarks || '')) : (submitModal.remarks || ''),
                    });

                    toast.success('🎉 Assignment submitted successfully!');
                    setSubmitModal({
                      isOpen: false,
                      assignment: null,
                      fileUrl: '',
                      remarks: '',
                      mode: 'upload',
                      selectedFile: null,
                      textAnswer: '',
                      agreedPledge: false,
                    });
                    await fetchCourseDetails();
                  } catch (error) {
                    console.error('Failed to submit assignment:', error);
                    const errorMsg = error.response?.data?.error || error.response?.data?.message || (typeof error.response?.data === 'string' ? error.response.data : null) || 'Failed to submit assignment';
                    toast.error(errorMsg);
                  } finally {
                    setSubmitting(false);
                  }
                }}
                disabled={submitting}
                className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                <span>{submitting ? 'Submitting Solution...' : 'Confirm & Submit Assignment 🚀'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📄 STUDENT VIEW MY SUBMISSION MODAL */}
      {/* ========================================================================= */}
      {viewSubmissionModal.isOpen && viewSubmissionModal.assignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-blue-100 max-w-lg w-full p-6 sm:p-8 animate-scaleUp">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-bold shadow-inner">
                  ✓
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">Your Submission Details</h4>
                  <p className="text-xs text-slate-500">{viewSubmissionModal.assignment.title}</p>
                </div>
              </div>
              <button
                onClick={() => setViewSubmissionModal({ isOpen: false, assignment: null })}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Status Banner */}
              <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-600 block">Status</span>
                  <span className="text-sm font-extrabold text-blue-900">
                    {viewSubmissionModal.assignment.submissionStatus || 'SUBMITTED'}
                  </span>
                </div>
                {viewSubmissionModal.assignment.marks !== null && (
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Score</span>
                    <span className="text-base font-black text-emerald-600">
                      {viewSubmissionModal.assignment.marks} / {viewSubmissionModal.assignment.maxMarks || 100}
                    </span>
                  </div>
                )}
              </div>

              {/* Submitted File Link */}
              {viewSubmissionModal.assignment.submission?.fileUrl && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Submitted File / Solution</span>
                  <a
                    href={getFullFileUrl(viewSubmissionModal.assignment.submission.fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-600 hover:text-blue-800 hover:underline bg-blue-50/80 px-3.5 py-2 rounded-xl border border-blue-200 break-all"
                  >
                    <span>📄</span>
                    <span>Open / Download Solution File ↗</span>
                  </a>
                </div>
              )}

              {/* Remarks */}
              {viewSubmissionModal.assignment.submission?.remarks && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Your Remarks</span>
                  <p className="text-xs text-slate-700">{viewSubmissionModal.assignment.submission.remarks}</p>
                </div>
              )}

              {/* Feedback if graded */}
              {viewSubmissionModal.assignment.feedback && (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-1">Instructor Feedback</span>
                  <p className="text-xs text-emerald-900 leading-relaxed">{viewSubmissionModal.assignment.feedback}</p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    const asgn = viewSubmissionModal.assignment;
                    setViewSubmissionModal({ isOpen: false, assignment: null });
                    handleOpenSubmitModal(asgn);
                  }}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition text-center"
                >
                  🔄 Re-submit Solution
                </button>
                <button
                  onClick={() => setViewSubmissionModal({ isOpen: false, assignment: null })}
                  className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ➕ LECTURER CREATE ASSIGNMENT MODAL */}
      {/* ========================================================================= */}
      {showCreateAssignmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-blue-100 max-w-lg w-full p-6 sm:p-8 animate-scaleUp">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold shadow-inner">
                  📝
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">Create New Assignment</h4>
                  <p className="text-xs text-slate-500">Post coursework and set deadline for students.</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateAssignmentModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assignment Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Assignment 2: Responsive Portfolio Website"
                  value={newAssignmentData.title}
                  onChange={(e) => setNewAssignmentData({ ...newAssignmentData, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description &amp; Task Guidelines
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the problem, requirements, submission format..."
                  value={newAssignmentData.description}
                  onChange={(e) => setNewAssignmentData({ ...newAssignmentData, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Marks</label>
                  <input
                    type="number"
                    value={newAssignmentData.maxMarks}
                    onChange={(e) => setNewAssignmentData({ ...newAssignmentData, maxMarks: parseInt(e.target.value) || 100 })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newAssignmentData.dueDate}
                    onChange={(e) => setNewAssignmentData({ ...newAssignmentData, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Publish Assignment'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateAssignmentModal(false)}
                  className="py-3 px-5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 👨‍🏫 LECTURER REVIEW & GRADE SUBMISSIONS MODAL */}
      {/* ========================================================================= */}
      {gradingModal.isOpen && gradingModal.assignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-blue-100 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                  Student Submissions Review
                </span>
                <h4 className="text-lg font-black text-white mt-0.5">
                  {gradingModal.assignment.title}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Max Marks: {gradingModal.assignment.maxMarks || 100} · Total Submissions: {gradingModal.submissions.length}
                </p>
              </div>
              <button
                onClick={() => setGradingModal({ isOpen: false, assignment: null, submissions: [], loading: false })}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition"
              >
                ✕
              </button>
            </div>

            {/* Submissions List Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50/50">
              {gradingModal.loading ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  Loading submissions...
                </div>
              ) : gradingModal.submissions.length === 0 ? (
                <div className="p-10 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200 text-xs">
                  No students have submitted solutions for this assignment yet.
                </div>
              ) : (
                gradingModal.submissions.map((sub, index) => {
                  const inputVal = gradeInput[sub.id] || { marks: '', feedback: '' };

                  return (
                    <div
                      key={sub.id || index}
                      className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <h5 className="font-extrabold text-slate-900 text-sm">
                            {sub.studentName || `Student ID #${sub.studentId}`}
                          </h5>
                          <span className="text-[11px] text-slate-400">
                            Submitted on: {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : 'N/A'}
                          </span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          sub.status === 'GRADED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {sub.status || 'SUBMITTED'}
                        </span>
                      </div>

                      {/* File Link & Remarks */}
                      <div className="space-y-2 text-xs">
                        {sub.fileUrl && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-500">Student File: </span>
                            <a
                              href={getFullFileUrl(sub.fileUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold rounded-xl border border-blue-200 transition text-xs break-all"
                            >
                              <span>📄</span>
                              <span>Open / Download Submission ({sub.fileUrl}) ↗</span>
                            </a>
                          </div>
                        )}
                        {sub.remarks && (
                          <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="font-bold text-slate-500">Student Remarks: </span>
                            {sub.remarks}
                          </p>
                        )}
                      </div>

                      {/* Grading Inputs */}
                      <div className="pt-2 flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="w-28">
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Marks</label>
                          <input
                            type="number"
                            placeholder="e.g. 85"
                            value={inputVal.marks}
                            onChange={(e) =>
                              setGradeInput((prev) => ({
                                ...prev,
                                [sub.id]: { ...prev[sub.id], marks: e.target.value },
                              }))
                            }
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>

                        <div className="flex-1 min-w-[180px]">
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Feedback / Comments</label>
                          <input
                            type="text"
                            placeholder="e.g. Great work, well documented!"
                            value={inputVal.feedback}
                            onChange={(e) =>
                              setGradeInput((prev) => ({
                                ...prev,
                                [sub.id]: { ...prev[sub.id], feedback: e.target.value },
                              }))
                            }
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>

                        <div className="self-end">
                          <button
                            onClick={() => handleSaveGrade(sub.id)}
                            disabled={gradingSubmitting === sub.id}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 disabled:opacity-50"
                          >
                            {gradingSubmitting === sub.id ? 'Saving...' : 'Save Grade ✅'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setGradingModal({ isOpen: false, assignment: null, submissions: [], loading: false })}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetails;