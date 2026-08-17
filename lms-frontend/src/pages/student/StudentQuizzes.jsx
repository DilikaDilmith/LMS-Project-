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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) {
      fetchInitialData();
    }
  }, [studentId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch enrolled courses
      const enrolledRes = await courseAPI.getEnrolled(studentId);
      const courses = enrolledRes.data || [];
      setEnrolledCourses(courses);

      // 2. Fetch student quiz attempts/results
      try {
        const attemptsRes = await quizAPI.getStudentResults(studentId);
        setAttempts(attemptsRes.data || []);
      } catch (err) {
        console.error('Failed to fetch quiz attempts:', err);
      }

      // 3. Fetch quizzes for all courses or first course
      if (courses.length > 0) {
        fetchAllQuizzes(courses);
      } else {
        setQuizzes([]);
      }
    } catch (error) {
      console.error('Failed to load quizzes data:', error);
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllQuizzes = async (coursesList) => {
    try {
      const quizPromises = coursesList.map((course) =>
        quizAPI.getByCourse(course.id).then((res) =>
          (res.data || []).map((q) => ({
            ...q,
            courseName: course.name,
          }))
        ).catch(() => [])
      );
      const results = await Promise.all(quizPromises);
      const allQuizzes = results.flat();
      setQuizzes(allQuizzes);
    } catch (err) {
      console.error('Error fetching course quizzes:', err);
    }
  };

  const filteredQuizzes =
    selectedCourse === 'ALL'
      ? quizzes
      : quizzes.filter((q) => String(q.courseId) === String(selectedCourse));

  const getQuizAttemptStatus = (quizId) => {
    const attempt = attempts.find((a) => String(a.quizId) === String(quizId));
    return attempt || null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading your quizzes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-slate-500 hover:text-slate-800 transition text-sm">
            ← Dashboard
          </Link>
          <h1 className="text-xl font-bold text-slate-800">❓ My Quizzes</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/student/results"
            className="text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 px-3.5 py-2 rounded-lg transition"
          >
            📊 View All Results
          </Link>
          <Link
            to="/student/courses"
            className="text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 px-3.5 py-2 rounded-lg transition"
          >
            📚 My Courses
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 mt-8">
        {/* Header Summary */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg mb-8">
          <h2 className="text-2xl font-extrabold">Online Assessments & Quizzes</h2>
          <p className="text-blue-200 text-sm mt-1">
            Test your knowledge and prepare for your exams across all enrolled courses.
          </p>

          {/* Filter Dropdown */}
          <div className="mt-5 flex items-center gap-3">
            <span className="text-xs font-semibold text-blue-200">Filter by Course:</span>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="bg-white/10 text-white border border-white/20 rounded-xl px-4 py-2 text-sm focus:outline-none focus:bg-slate-800"
            >
              <option value="ALL" className="text-slate-900">All Enrolled Courses ({enrolledCourses.length})</option>
              {enrolledCourses.map((c) => (
                <option key={c.id} value={c.id} className="text-slate-900">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quizzes List */}
        {filteredQuizzes.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
            <div className="text-4xl mb-3">❓</div>
            <h3 className="text-lg font-bold text-slate-800">No Quizzes Found</h3>
            <p className="text-slate-500 text-sm mt-1">
              There are no active quizzes available for your selected filter right now.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredQuizzes.map((quiz) => {
              const attempt = getQuizAttemptStatus(quiz.id);

              return (
                <div
                  key={quiz.id}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md">
                        {quiz.courseName || 'Course Quiz'}
                      </span>
                      {attempt ? (
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${attempt.isPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {attempt.isPassed ? 'PASSED ✅' : 'FAILED ❌'}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 rounded-md">
                          Available
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-800">{quiz.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {quiz.description || 'Test your knowledge on course materials.'}
                    </p>

                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
                      <div>⏱️ Duration: <strong>{quiz.durationMinutes || 30} mins</strong></div>
                      <div>🎯 Pass Score: <strong>{quiz.passingScore || 50}%</strong></div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    {attempt ? (
                      <div className="text-xs text-slate-500">
                        Score: <strong className="text-slate-800">{attempt.score} Marks</strong>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Not Attempted Yet</span>
                    )}

                    {attempt ? (
                      <Link
                        to={`/student/quiz/${quiz.id}`}
                        className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold rounded-xl transition"
                      >
                        Retake Quiz
                      </Link>
                    ) : (
                      <button
                        onClick={() => navigate(`/student/quiz/${quiz.id}`)}
                        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition active:scale-95 flex items-center gap-1.5"
                      >
                        Attempt Quiz 📝
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
