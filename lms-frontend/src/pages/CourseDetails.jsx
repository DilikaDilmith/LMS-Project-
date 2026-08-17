import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseAPI, moduleAPI, progressAPI, assignmentAPI, announcementAPI, quizAPI } from '../services/api';
import toast from 'react-hot-toast';

const CourseDetails = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const studentId = user?.id;

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [completing, setCompleting] = useState(null);
  const [activeTab, setActiveTab] = useState('modules'); // 'modules' | 'assignments' | 'quizzes' | 'announcements'


  useEffect(() => {
    fetchCourseDetails();
  }, [courseId, studentId]);

  const fetchCourseDetails = async () => {
    setLoading(true);
    try {
      // Fetch course information
      try {
        const courseRes = await courseAPI.getById(courseId);
        setCourse(courseRes.data);
      } catch (err) {
        console.error('Failed to fetch course details:', err);
      }

      // Check if student is enrolled
      if (studentId) {
        try {
          const enrolledRes = await courseAPI.getEnrolled(studentId);
          const enrolledList = enrolledRes.data || [];
          const enrolled = enrolledList.some((c) => String(c.id) === String(courseId));
          setIsEnrolled(enrolled);
        } catch (err) {
          console.error('Failed to check enrollment:', err);
        }
      }

      // Fetch modules & lessons
      try {
        const modulesRes = await moduleAPI.getByCourse(courseId);
        setModules(modulesRes.data || []);
      } catch (err) {
        console.error('Failed to fetch modules:', err);
      }

      // Fetch assignments
      try {
        const assignmentsRes = await assignmentAPI.getByCourse(courseId);
        setAssignments(assignmentsRes.data || []);
      } catch (err) {
        console.error('Failed to fetch assignments:', err);
      }

      // Fetch announcements
      try {
        const announcementsRes = await announcementAPI.getCourse(courseId);
        setAnnouncements(announcementsRes.data || []);
      } catch (err) {
        console.error('Failed to fetch announcements:', err);
      }

      // Fetch quizzes
      try {
        const quizzesRes = await quizAPI.getByCourse(courseId);
        setQuizzes(quizzesRes.data || []);
      } catch (err) {
        console.error('Failed to fetch quizzes:', err);
      }


    } catch (error) {
      console.error('Error loading course details:', error);
      toast.error('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!studentId) {
      toast.error('Please log in first');
      return;
    }
    setEnrolling(true);
    try {
      await courseAPI.enroll(courseId, studentId);
      toast.success('Successfully enrolled in course!');
      setIsEnrolled(true);
    } catch (error) {
      const errorMsg = error.response?.data || 'Failed to enroll in course';
      toast.error(errorMsg);
    } finally {
      setEnrolling(false);
    }
  };

  const handleCompleteLesson = async (lessonId) => {
    if (!studentId) {
      toast.error('Please log in first');
      return;
    }
    setCompleting(lessonId);
    try {
      await progressAPI.completeLesson(lessonId, studentId);
      toast.success('Lesson marked as completed!');
      // Refresh modules to update completion status
      const modulesRes = await moduleAPI.getByCourse(courseId);
      setModules(modulesRes.data || []);
    } catch (error) {
      toast.error(error.response?.data || 'Failed to complete lesson');
    } finally {
      setCompleting(null);
    }
  };

  // Calculate stats
  const totalLessons = modules.reduce((acc, m) => acc + (m.lessons ? m.lessons.length : 0), 0);
  const completedLessons = modules.reduce(
    (acc, m) => acc + (m.lessons ? m.lessons.filter((l) => l.isCompleted).length : 0),
    0
  );
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading course details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Top Header/Navbar */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold text-slate-800 truncate">
            {course?.name || 'Course Details'}
          </h1>
        </div>
        <Link
          to="/student/courses"
          className="text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3.5 py-1.5 rounded-lg transition"
        >
          My Courses
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-4 mt-6">
        {/* Main Banner Card */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 rounded-2xl text-white p-6 sm:p-8 shadow-xl relative overflow-hidden mb-8">
          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <span className="text-xs font-semibold px-3 py-1 bg-blue-500/30 text-blue-200 border border-blue-400/30 rounded-full">
                {course?.durationWeeks ? `${course.durationWeeks} Weeks Duration` : 'Self-Paced'}
              </span>

              {isEnrolled ? (
                <span className="text-xs font-bold px-3 py-1 bg-green-500/20 text-green-300 border border-green-400/30 rounded-full flex items-center gap-1">
                  <span>✓</span> Enrolled
                </span>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="px-5 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition active:scale-95 disabled:opacity-50"
                >
                  {enrolling ? 'Enrolling...' : 'Enroll Now'}
                </button>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {course?.name || 'Course'}
            </h2>

            <p className="text-slate-300 mt-2 text-sm sm:text-base max-w-3xl leading-relaxed">
              {course?.description || 'No description provided for this course.'}
            </p>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center">
                <p className="text-xs text-slate-300">Modules</p>
                <p className="text-lg font-bold text-white mt-0.5">{modules.length}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center">
                <p className="text-xs text-slate-300">Lessons</p>
                <p className="text-lg font-bold text-white mt-0.5">{totalLessons}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center">
                <p className="text-xs text-slate-300">Assignments</p>
                <p className="text-lg font-bold text-white mt-0.5">{assignments.length}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center">
                <p className="text-xs text-slate-300">Your Progress</p>
                <p className="text-lg font-bold text-green-400 mt-0.5">{progressPercent}%</p>
              </div>
            </div>

            {/* Progress Bar */}
            {isEnrolled && totalLessons > 0 && (
              <div className="mt-5">
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Course Progress</span>
                  <span>{completedLessons} / {totalLessons} Lessons Completed</span>
                </div>
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-green-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6 bg-white rounded-xl p-1.5 shadow-sm gap-2">
          <button
            onClick={() => setActiveTab('modules')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition ${
              activeTab === 'modules'
                ? 'bg-blue-600 text-white shadow'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            📖 Modules & Lessons ({modules.length})
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition ${
              activeTab === 'assignments'
                ? 'bg-blue-600 text-white shadow'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            📝 Assignments ({assignments.length})
          </button>
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition ${
              activeTab === 'quizzes'
                ? 'bg-blue-600 text-white shadow'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            ❓ Quizzes ({quizzes.length})
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition ${
              activeTab === 'announcements'
                ? 'bg-blue-600 text-white shadow'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            📢 Announcements ({announcements.length})
          </button>

        </div>

        {/* TAB CONTENTS */}

        {/* 1. MODULES & LESSONS */}
        {activeTab === 'modules' && (
          <div>
            {modules.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-10 text-center border border-gray-200">
                <div className="text-4xl mb-3">📖</div>
                <h3 className="text-lg font-semibold text-gray-800">No Modules Available</h3>
                <p className="text-gray-500 text-sm mt-1">This course does not have any modules uploaded yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {modules.map((module, idx) => (
                  <div
                    key={module.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
                  >
                    {/* Module Header */}
                    <div className="bg-slate-50 px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                          {idx + 1}
                        </span>
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">{module.title}</h3>
                          {module.description && (
                            <p className="text-xs text-slate-500 mt-0.5">{module.description}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Lessons List */}
                    <div className="divide-y divide-gray-100">
                      {module.lessons && module.lessons.length > 0 ? (
                        module.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/80 transition"
                          >
                            <div className="flex items-center gap-3.5">
                              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm">
                                📄
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-800 text-sm sm:text-base">
                                  {lesson.title}
                                </h4>
                                {lesson.durationMinutes && (
                                  <p className="text-xs text-slate-400 mt-0.5">
                                    ⏱️ {lesson.durationMinutes} mins
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {lesson.isCompleted ? (
                                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                                  ✓ Completed
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleCompleteLesson(lesson.id)}
                                  disabled={completing === lesson.id || !isEnrolled}
                                  className={`text-xs px-4 py-1.5 rounded-lg font-semibold transition ${
                                    completing === lesson.id
                                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                      : isEnrolled
                                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  }`}
                                >
                                  {completing === lesson.id
                                    ? 'Completing...'
                                    : isEnrolled
                                    ? 'Mark Complete'
                                    : 'Enroll to Access'}
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-6 py-4 text-xs text-slate-400 italic">
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

        {/* 2. ASSIGNMENTS */}
        {activeTab === 'assignments' && (
          <div>
            {assignments.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-10 text-center border border-gray-200">
                <div className="text-4xl mb-3">📝</div>
                <h3 className="text-lg font-semibold text-gray-800">No Assignments Yet</h3>
                <p className="text-gray-500 text-sm mt-1">There are no assignments posted for this course.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignments.map((asgn) => (
                  <div
                    key={asgn.id}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-800 text-base">{asgn.title}</h4>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-medium">
                        Max Marks: {asgn.maxMarks || 100}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                      {asgn.description || 'No submission instructions available.'}
                    </p>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-slate-400">
                      <span>Due: {asgn.dueDate ? new Date(asgn.dueDate).toLocaleDateString() : 'N/A'}</span>
                      <Link
                        to="/assignments"
                        className="text-blue-600 font-semibold hover:underline"
                      >
                        View Assignment →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. QUIZZES */}
        {activeTab === 'quizzes' && (
          <div>
            {quizzes.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-10 text-center border border-gray-200">
                <div className="text-4xl mb-3">❓</div>
                <h3 className="text-lg font-semibold text-gray-800">No Quizzes Available</h3>
                <p className="text-gray-500 text-sm mt-1">No online quizzes have been created for this course yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-800 text-base">{quiz.title}</h4>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                          {quiz.durationMinutes || 30} Mins
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                        {quiz.description || 'Test your understanding on course concepts.'}
                      </p>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Passing Score: <strong>{quiz.passingScore || 50}%</strong></span>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-gray-100 flex justify-end">
                      <button
                        onClick={() => navigate(`/student/quiz/${quiz.id}`)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition active:scale-95 flex items-center gap-1"
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

        {/* 4. ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (

          <div>
            {announcements.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-10 text-center border border-gray-200">
                <div className="text-4xl mb-3">📢</div>
                <h3 className="text-lg font-semibold text-gray-800">No Announcements</h3>
                <p className="text-gray-500 text-sm mt-1">There are no announcements for this course yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((anc) => (
                  <div
                    key={anc.id}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">📢</span>
                      <h4 className="font-bold text-slate-800 text-base">{anc.title}</h4>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                      {anc.content}
                    </p>
                    <div className="mt-3 text-xs text-slate-400">
                      Posted on {anc.createdAt ? new Date(anc.createdAt).toLocaleDateString() : 'Recently'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetails;