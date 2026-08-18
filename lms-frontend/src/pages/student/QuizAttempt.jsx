import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { quizAPI, courseAPI, enrollmentAPI } from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const StudentQuizzes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const studentId = user?.id;

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  const fetchEnrolledCourses = async () => {
    try {
      const res = await courseAPI.getEnrolled(studentId);
      const enrolled = res.data || [];
      setCourses(enrolled);
      if (enrolled.length > 0) {
        setSelectedCourse(enrolled[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCourse) {
      fetchQuizzesAndAttempts();
    }
  }, [selectedCourse]);

  const fetchQuizzesAndAttempts = async () => {
    setLoading(true);
    try {
      // Get quizzes for this course
      const quizzesRes = await quizAPI.getByCourse(selectedCourse);
      const quizList = quizzesRes.data || [];

      // Get student's quiz attempts
      const attemptsRes = await quizAPI.getStudentResults(studentId);
      const attemptList = attemptsRes.data || [];

      // Map attempts to quizzes
      const quizzesWithStatus = quizList.map((quiz) => {
        const attempt = attemptList.find((a) => a.quizId === quiz.id);
        return {
          ...quiz,
          attemptId: attempt?.id,
          score: attempt?.score,
          isPassed: attempt?.passed,
          attemptedAt: attempt?.attemptedAt,
          status: attempt ? 'COMPLETED' : 'NOT_ATTEMPTED'
        };
      });

      setQuizzes(quizzesWithStatus);
      setAttempts(attemptList);
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = (quizId) => {
    navigate(`/student/quiz/${quizId}`);
  };

  const handleCourseChange = (e) => {
    setSelectedCourse(e.target.value);
  };

  if (loading && courses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quizzes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b p-4 flex flex-wrap justify-between items-center">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-gray-500 hover:text-gray-700 text-sm">← Dashboard</Link>
          <h1 className="text-xl font-bold text-blue-600">❓ My Quizzes</h1>
        </div>
        <span className="text-sm text-gray-500">
          {quizzes.filter(q => q.status === 'COMPLETED').length} completed
        </span>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Course Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Course</label>
          {courses.length === 0 ? (
            <p className="text-sm text-gray-500">You are not enrolled in any courses.</p>
          ) : (
            <select
              value={selectedCourse}
              onChange={handleCourseChange}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Quizzes List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : !selectedCourse ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
            <div className="text-4xl mb-3">📚</div>
            <h3 className="text-lg font-semibold text-gray-700">No courses selected</h3>
            <p className="text-gray-400 text-sm mt-1">Please select a course to view quizzes.</p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
            <div className="text-4xl mb-3">❓</div>
            <h3 className="text-lg font-semibold text-gray-700">No quizzes available</h3>
            <p className="text-gray-400 text-sm mt-1">This course doesn't have any quizzes yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className={`bg-white rounded-xl shadow-sm border p-5 transition ${
                  quiz.status === 'COMPLETED' 
                    ? quiz.isPassed 
                      ? 'border-green-200 bg-green-50/30' 
                      : 'border-red-200 bg-red-50/30'
                    : 'border-gray-100 hover:shadow-md'
                }`}
              >
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-800">{quiz.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{quiz.description}</p>
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                      <span>⏱️ {quiz.durationMinutes} minutes</span>
                      <span>📝 {quiz.passingScore}% passing score</span>
                      {quiz.questions?.length > 0 && (
                        <span>❓ {quiz.questions.length} questions</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right min-w-[120px]">
                    {quiz.status === 'COMPLETED' ? (
                      <div>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                          quiz.isPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {quiz.isPassed ? '✅ Passed' : '❌ Failed'}
                        </span>
                        <p className="text-lg font-bold text-gray-800 mt-1">
                          {quiz.score || 0}
                          <span className="text-sm text-gray-400"> / {quiz.totalMarks || '?'}</span>
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(quiz.attemptedAt).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartQuiz(quiz.id)}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
                      >
                        🚀 Start Quiz
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentQuizzes;