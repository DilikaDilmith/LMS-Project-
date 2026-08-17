import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { quizAPI } from '../../services/api';
import toast from 'react-hot-toast';

const QuizAttempt = () => {
  const { quizId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const studentId = user?.id;

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    fetchQuizData();
  }, [quizId]);

  const fetchQuizData = async () => {
    try {
      const [quizRes, questionsRes] = await Promise.all([
        quizAPI.getById(quizId),
        quizAPI.getQuestions(quizId)
      ]);
      setQuiz(quizRes.data);
      setQuestions(questionsRes.data || []);
      setTimeLeft(quizRes.data?.durationMinutes * 60 || 600);
    } catch (error) {
      console.error('Failed to fetch quiz:', error);
      toast.error('Failed to load quiz');
      navigate('/courses');
    } finally {
      setLoading(false);
    }
  };

  // Timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleOptionSelect = (questionId, optionId) => {
    setSelectedOptions(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleSubmitQuiz = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        selectedOptions: selectedOptions,
        shortAnswers: {}
      };
      const res = await quizAPI.submit(quizId, studentId, payload);
      toast.success('Quiz submitted successfully!');
      navigate(`/student/quiz-result/${res.data?.attemptId || quizId}`);
    } catch (error) {
      toast.error(error.response?.data || 'Failed to submit quiz');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">❌</div>
          <h3 className="text-lg font-semibold text-gray-700">Quiz not found</h3>
        </div>
      </div>
    );
  }

  const totalQuestions = questions.length;
  const currentQ = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b p-4 flex flex-wrap justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-blue-600">📝 {quiz.title}</h1>
          <p className="text-sm text-gray-500">{quiz.description}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`px-4 py-2 rounded-lg font-bold ${timeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-700'}`}>
            ⏱️ {formatTime(timeLeft)}
          </div>
          <span className="text-sm text-gray-500">Q {currentQuestion + 1}/{totalQuestions}</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Question Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="mb-4">
            <span className="text-xs font-medium text-gray-400">Question {currentQuestion + 1} of {totalQuestions}</span>
            <h3 className="text-lg font-semibold text-gray-800 mt-1">{currentQ?.questionText}</h3>
            <span className="text-xs text-gray-400">Marks: {currentQ?.marks || 0}</span>
          </div>

          {/* Options */}
          <div className="space-y-3 mt-6">
            {currentQ?.options?.map((option) => (
              <label
                key={option.id}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${selectedOptions[currentQ.id] === option.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
              >
                <input
                  type="radio"
                  name={`question-${currentQ.id}`}
                  value={option.id}
                  checked={selectedOptions[currentQ.id] === option.id}
                  onChange={() => handleOptionSelect(currentQ.id, option.id)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700">{option.optionText}</span>
              </label>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
              className={`px-5 py-2 rounded-lg text-sm font-medium ${currentQuestion === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              ← Previous
            </button>

            {currentQuestion === totalQuestions - 1 ? (
              <button
                onClick={handleSubmitQuiz}
                disabled={submitting}
                className={`px-6 py-2 rounded-lg text-sm font-medium text-white ${submitting ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {submitting ? 'Submitting...' : 'Submit Quiz ✅'}
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestion(prev => Math.min(totalQuestions - 1, prev + 1))}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
              >
                Next →
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>Progress</span>
            <span>{Math.round(((currentQuestion + 1) / totalQuestions) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all"
              style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Cancel Button */}
        <div className="mt-6 text-center">
          <Link to="/courses" className="text-sm text-gray-400 hover:text-gray-600">
            Cancel & Leave Quiz
          </Link>
        </div>
      </div>
    </div>
  );
};

export default QuizAttempt;