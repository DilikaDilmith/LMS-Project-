import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { courseAPI, quizAPI } from '../../services/api';
import toast from 'react-hot-toast';

const StudentQuizzes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const studentId = user?.id;

  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  useEffect(() => {
    if (studentId) {
      fetchInitialData();
    }
  }, [studentId]);

  // Normalize course object: handle both EnrollmentResponse (courseId/courseName) and CourseResponse (id/name)
  const normalizeCourse = (c) => ({
    id: c.courseId ?? c.id,
    name: c.courseName ?? c.name ?? c.title ?? `Course #${c.courseId ?? c.id}`,
  });

  const fetchInitialData = async () => {
    setLoadingInit(true);
    try {
      // 1. Fetch enrolled courses (returns EnrollmentResponse[])
      const enrolledRes = await courseAPI.getEnrolled(studentId);
      const rawCourses = enrolledRes.data || [];
      // Normalize to {id, name} — handles EnrollmentResponse and CourseResponse
      const courses = rawCourses.map(normalizeCourse).filter((c) => c.id != null);
      setEnrolledCourses(courses);

      // 2. Fetch student quiz attempts
      try {
        const attemptsRes = await quizAPI.getStudentResults(studentId);
        setAttempts(attemptsRes.data || []);
      } catch (err) {
        console.warn('Failed to fetch quiz attempts:', err);
        setAttempts([]);
      }

      // 3. Fetch quizzes for all enrolled courses in parallel
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
              // ensure courseId field is present for filtering
              courseId: q.courseId ?? course.id,
            }))
          )
          .catch((err) => {
            console.warn(`Failed to fetch quizzes for course ${course.id}:`, err);
            return [];
          })
      );
      const results = await Promise.all(quizPromises);
      const allQuizzes = results.flat();
      setQuizzes(allQuizzes);
    } catch (err) {
      console.error('Error fetching course quizzes:', err);
      setQuizzes([]);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const filteredQuizzes =
    selectedCourse === 'ALL'
      ? quizzes
      : quizzes.filter((q) => String(q.courseId) === String(selectedCourse));

  const getAttemptForQuiz = (quizId) =>
    attempts.find((a) => String(a.quizId) === String(quizId)) || null;

  if (loadingInit) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto w-16 h-16 mb-4">
            <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-xl">❓</div>
          </div>
          <h3 className="text-slate-800 font-extrabold text-base">Loading Your Quizzes</h3>
          <p className="text-slate-500 text-xs mt-1">Fetching assessments from all enrolled courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      {/* Sticky Navbar */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-6 py-3.5 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-lg font-black shadow-md shadow-blue-500/20">
            ❓
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
              My Quizzes &amp; Assessments
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              {quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''} across {enrolledCourses.length} course{enrolledCourses.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/student/results"
            className="text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3.5 py-2 rounded-xl transition border border-purple-200 flex items-center gap-1.5"
          >
            <span>📊</span>
            <span>My Results</span>
          </Link>
          <Link
            to="/dashboard"
            className="text-xs font-bold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-4 py-2 rounded-xl transition flex items-center gap-1.5"
          >
            <span>←</span>
            <span>Dashboard</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl mb-6">
          <h2 className="text-2xl font-black">Online Assessments &amp; Quizzes</h2>
          <p className="text-blue-200 text-xs mt-1">
            Test your knowledge and prepare for your exams across all enrolled courses.
          </p>

          {/* Filter by Course */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-blue-300">Filter by Course:</span>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCourse('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${selectedCourse === 'ALL'
                    ? 'bg-white text-slate-900'
                    : 'bg-white/10 text-white hover:bg-white/20'
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
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${selectedCourse === String(c.id)
                        ? 'bg-white text-slate-900'
                        : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                  >
                    {c.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quiz Cards */}
        {loadingQuizzes ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-10 h-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
            <p className="text-xs text-slate-500 font-semibold">Loading quizzes from your courses...</p>
          </div>
        ) : enrolledCourses.length === 0 ? (
          <div className="bg-white rounded-3xl p-14 text-center border border-slate-200 shadow-sm">
            <div className="text-4xl mb-3">📚</div>
            <h3 className="text-lg font-black text-slate-800">No Enrolled Courses</h3>
            <p className="text-slate-500 text-xs mt-1">
              Enroll in a course to access quizzes and assessments.
            </p>
            <Link
              to="/courses"
              className="mt-5 inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition"
            >
              Browse Courses
            </Link>
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="bg-white rounded-3xl p-14 text-center border border-slate-200 shadow-sm">
            <div className="text-4xl mb-3">❓</div>
            <h3 className="text-lg font-black text-slate-800">No Quizzes Available</h3>
            <p className="text-slate-500 text-xs mt-1">
              {selectedCourse === 'ALL'
                ? 'No quizzes have been published for your enrolled courses yet.'
                : 'No quizzes published for this course yet. Check back soon!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredQuizzes.map((quiz) => {
              const attempt = getAttemptForQuiz(quiz.id);
              const isPassed = attempt?.isPassed;
              const isCompleted = !!attempt;

              return (
                <div
                  key={quiz.id}
                  className={`bg-white rounded-3xl border shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden ${isCompleted
                      ? isPassed
                        ? 'border-emerald-200 hover:border-emerald-300'
                        : 'border-rose-200 hover:border-rose-300'
                      : 'border-slate-200 hover:border-blue-300'
                    }`}
                >
                  {/* Card Header Banner */}
                  <div className={`p-5 text-white ${isCompleted
                      ? isPassed
                        ? 'bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900'
                        : 'bg-gradient-to-r from-rose-800 via-red-900 to-slate-900'
                      : 'bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-1 bg-white/10 rounded-lg text-[10px] font-extrabold uppercase text-blue-200 border border-white/10">
                        {quiz.courseName || 'Course Quiz'}
                      </span>
                      {isCompleted ? (
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${isPassed
                            ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                            : 'bg-rose-400/20 text-rose-300 border border-rose-400/30'
                          }`}>
                          {isPassed ? '✅ Passed' : '❌ Failed'}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-[10px] font-black uppercase">
                          🟡 Not Attempted
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-black text-white leading-snug line-clamp-2 mt-1">
                      {quiz.title}
                    </h3>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 space-y-4">
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {quiz.description || 'Test your knowledge on course materials with this assessment.'}
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-50 rounded-xl p-2.5 text-xs text-slate-600 border border-slate-100">
                        ⏱️ <strong>{quiz.durationMinutes || 30} mins</strong>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2.5 text-xs text-slate-600 border border-slate-100">
                        🎯 Pass: <strong>{quiz.passingScore || 50}%</strong>
                      </div>
                    </div>

                    {isCompleted && (
                      <div className={`flex items-center justify-between rounded-2xl px-4 py-2.5 text-xs font-bold border ${isPassed
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}>
                        <span>Your Score</span>
                        <span className="text-base font-black">{attempt.score ?? 0} pts</span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="px-5 pb-5">
                    {isCompleted ? (
                      <Link
                        to="/student/results"
                        className="w-full block py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition text-center"
                      >
                        📊 View in Transcript
                      </Link>
                    ) : (
                      <button
                        onClick={() => navigate(`/student/quiz/${quiz.id}`)}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl shadow-md shadow-blue-500/20 transition active:scale-95 flex items-center justify-center gap-2"
                      >
                        <span>📝</span>
                        <span>Attempt Quiz Now</span>
                      </button>
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

export default StudentQuizzes;
