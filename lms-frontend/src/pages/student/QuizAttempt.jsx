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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Active question index
  const [currentIdx, setCurrentIdx] = useState(0);

  // Student Answers state
  // selectedOptions: { [questionId]: optionId }
  const [selectedOptions, setSelectedOptions] = useState({});
  // shortAnswers: { [questionId]: text }
  const [shortAnswers, setShortAnswers] = useState({});

  // Timer State
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(null);

  // Quiz Result State after submission
  const [quizResult, setQuizResult] = useState(null);

  // Get effective student ID synchronously with localStorage fallback
  const effectiveStudentId =
    studentId ||
    user?.id ||
    (() => {
      try {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored)?.id : null;
      } catch {
        return null;
      }
    })();

  useEffect(() => {
    if (quizId) {
      loadQuiz();
    }
  }, [quizId, studentId, user]);

  // Countdown timer effect
  useEffect(() => {
    if (timeLeftSeconds === null || timeLeftSeconds <= 0 || quizResult) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeftSeconds, quizResult]);

  const loadQuiz = async () => {
    setLoading(true);
    try {
      const promises = [
        quizAPI.getById(quizId),
        quizAPI.getQuestions(quizId),
      ];
      if (effectiveStudentId) {
        promises.push(
          quizAPI.getStudentResults(effectiveStudentId).catch((err) => {
            console.warn('Failed to load student results:', err);
            return { data: [] };
          })
        );
      }

      const [quizRes, questionsRes, resultsRes] = await Promise.all(promises);

      const qData = quizRes.data;
      const qList = Array.isArray(questionsRes.data) ? questionsRes.data : [];

      setQuiz(qData);
      setQuestions(qList);

      // Check if student already completed this quiz
      const attemptsList = Array.isArray(resultsRes?.data) ? resultsRes.data : [];
      const pastAttempt = attemptsList
        .filter((a) => String(a.quizId) === String(quizId))
        .sort((a, b) => new Date(b.endTime || b.attemptedAt || b.startTime || 0) - new Date(a.endTime || a.attemptedAt || a.startTime || 0))[0];

      if (pastAttempt) {
        const totalMarks = qList.reduce((acc, q) => acc + (q.marks || 0), 0) || 100;
        setQuizResult({
          id: pastAttempt.id,
          score: pastAttempt.score ?? 0,
          totalMarks: totalMarks,
          isPassed: pastAttempt.isPassed ?? false,
          alreadyCompleted: true,
          attemptedAt: pastAttempt.attemptedAt || pastAttempt.endTime || pastAttempt.startTime,
        });
      } else {
        // Initialize Timer (minutes to seconds)
        const duration = qData?.durationMinutes || 30;
        setTimeLeftSeconds(duration * 60);
      }
    } catch (error) {
      console.error('Failed to load quiz:', error);
      toast.error('Failed to load quiz assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (questionId, optionId) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [String(questionId)]: optionId,
    }));
  };

  const handleShortAnswerChange = (questionId, text) => {
    setShortAnswers((prev) => ({
      ...prev,
      [String(questionId)]: text,
    }));
  };

  const handleAutoSubmit = () => {
    toast.error('⏰ Time is up! Submitting your answers automatically.');
    handleSubmitQuiz();
  };

  const handleRetakeQuiz = () => {
    setQuizResult(null);
    setSelectedOptions({});
    setShortAnswers({});
    setCurrentIdx(0);
    setTimeLeftSeconds((quiz?.durationMinutes || 30) * 60);
    toast.success('New attempt started. Your new score will be saved separately.');
  };

  const handleSubmitQuiz = async () => {
    if (submitting || quizResult) return;

    // Check unanswered questions
    const answeredCount = Object.keys(selectedOptions).length + Object.keys(shortAnswers).filter((k) => shortAnswers[k]?.trim()).length;
    if (answeredCount < questions.length && timeLeftSeconds > 0) {
      const proceed = window.confirm(
        `You have answered ${answeredCount} of ${questions.length} questions. Are you sure you want to submit?`
      );
      if (!proceed) return;
    }

    setSubmitting(true);
    try {
      const targetStudentId = effectiveStudentId || 1;
      const res = await quizAPI.submit(quizId, targetStudentId, {
        selectedOptions,
        shortAnswers,
      });

      const resultData = res.data;
      setQuizResult(resultData);
      toast.success('🎉 Quiz submitted successfully!');
    } catch (error) {
      const errorData = error.response?.data;
      const msg = errorData?.error || errorData?.message || (typeof errorData === 'string' ? errorData : 'Failed to submit quiz');

      // If already attempted, immediately fetch existing attempt and show the result screen!
      if (typeof msg === 'string' && msg.toLowerCase().includes('already attempted')) {
        toast('You have already completed this quiz. Loading your score...', { icon: '📊' });
        try {
          const resultsRes = await quizAPI.getStudentResults(effectiveStudentId);
          const attemptsList = Array.isArray(resultsRes.data) ? resultsRes.data : [];
          const pastAttempt = attemptsList.find((a) => String(a.quizId) === String(quizId));

          if (pastAttempt) {
            const totalMarks = questions.reduce((acc, q) => acc + (q.marks || 0), 0) || 100;
            setQuizResult({
              id: pastAttempt.id,
              score: pastAttempt.score ?? 0,
              totalMarks: totalMarks,
              isPassed: pastAttempt.isPassed ?? false,
              alreadyCompleted: true,
              attemptedAt: pastAttempt.attemptedAt || pastAttempt.endTime,
            });
            return;
          }
        } catch (fetchErr) {
          console.warn('Failed to load past attempt:', fetchErr);
        }
      }

      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds) => {
    if (seconds === null) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="relative mx-auto w-16 h-16 mb-4">
            <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-xl">❓</div>
          </div>
          <h3 className="text-slate-800 font-extrabold text-base">Loading Quiz Assessment</h3>
          <p className="text-slate-500 text-xs mt-1">Preparing your questions and timer...</p>
        </div>
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-slate-200 shadow-sm">
          <div className="text-4xl mb-3">❓</div>
          <h3 className="text-lg font-black text-slate-800">No Questions in this Quiz</h3>
          <p className="text-xs text-slate-500 mt-1">The instructor has not added questions to this quiz yet.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-5 px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 🏆 RESULT SCREEN UPON SUBMISSION
  // =========================================================================
  if (quizResult) {
    const isPassed = quizResult.isPassed;
    const score = quizResult.score || 0;
    const totalMarks = quizResult.totalMarks || questions.reduce((acc, q) => acc + (q.marks || 0), 0) || 100;
    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
    const isAlreadyCompleted = !!quizResult.alreadyCompleted;

    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-white rounded-3xl border border-blue-100 shadow-2xl max-w-lg w-full p-8 text-center animate-scaleUp">
          <div
            className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-inner mb-4 ${
              isPassed ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}
          >
            {isPassed ? '🏆' : '❌'}
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {isPassed ? 'Passed Successfully' : 'Assessment Failed'}
            </span>
            {isAlreadyCompleted && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                Already Completed
              </span>
            )}
          </div>

          <h2 className="text-xl font-black text-slate-900 mt-2">
            {quiz.title}
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            {isAlreadyCompleted
              ? 'You have already submitted this assessment. Here is your recorded score.'
              : 'Thank you for submitting your assessment! Your score has been recorded.'}
          </p>

          <div className="my-6 p-5 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="text-4xl font-black text-slate-900">
              {score} <span className="text-lg text-slate-400 font-bold">/ {totalMarks}</span>
            </div>
            <div className={`text-xs font-extrabold mt-1.5 ${isPassed ? 'text-emerald-600' : 'text-rose-600'}`}>
              Final Score: {percentage}% &nbsp;·&nbsp; Passing Threshold: {quiz.passingScore || 50}%
            </div>
            {quizResult.attemptedAt && (
              <div className="text-[11px] text-slate-400 font-medium mt-2">
                Completed on {new Date(quizResult.attemptedAt).toLocaleString()}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {isAlreadyCompleted && (
              <button
                type="button"
                onClick={handleRetakeQuiz}
                className="sm:col-span-2 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition active:scale-95"
              >
                Try Again — Start a New Attempt
              </button>
            )}
            {quiz?.courseId && (
              <Link
                to={`/courses/${quiz.courseId}`}
                className="py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-xs rounded-xl border border-blue-200 transition text-center"
              >
                ← Back to Course
              </Link>
            )}

            <Link
              to="/student/quizzes"
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition text-center"
            >
              All Quizzes ❓
            </Link>

            <Link
              to="/student/results"
              className="sm:col-span-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 transition active:scale-95 text-center"
            >
              View in Grade Transcript 📊
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Active question object
  const currentQ = questions[currentIdx];
  const isLastQuestion = currentIdx === questions.length - 1;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20 animate-fadeIn">
      {/* Top Fixed Quiz Header with Timer */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-6 py-3.5 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-lg font-black shadow-md shadow-blue-500/20">
            ❓
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight line-clamp-1">
              {quiz.title}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Question {currentIdx + 1} of {questions.length} · Passing Score: {quiz.passingScore}%
            </p>
          </div>
        </div>

        {/* Live Timer Pill */}
        <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl border font-black text-xs shadow-xs ${
          timeLeftSeconds && timeLeftSeconds < 180
            ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse'
            : 'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          <span>⏱️</span>
          <span>{formatTimer(timeLeftSeconds)}</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6">
        {/* Progress Bar & Question Palette */}
        <div className="bg-white rounded-3xl p-5 border border-blue-100 shadow-sm mb-6 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Overall Progress</span>
            <span>{Math.round(((currentIdx + 1) / questions.length) * 100)}%</span>
          </div>

          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Stepper bubbles */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2">
            {questions.map((q, idx) => {
              const isAnswered =
                selectedOptions[String(q.id)] !== undefined ||
                (shortAnswers[String(q.id)] && shortAnswers[String(q.id)].trim());
              const isCurrent = idx === currentIdx;

              return (
                <button
                  key={q.id || idx}
                  onClick={() => setCurrentIdx(idx)}
                  className={`w-7 h-7 rounded-xl text-xs font-black shrink-0 transition ${
                    isCurrent
                      ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/40'
                      : isAnswered
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 📝 ACTIVE QUESTION CARD */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <span className="text-xs font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              Question {currentIdx + 1} ({currentQ.marks || 10} Marks)
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              Type: {currentQ.questionType || 'MCQ'}
            </span>
          </div>

          {/* Question Text */}
          <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
            {currentQ.questionText}
          </h3>

          {/* Answer Options */}
          {currentQ.questionType === 'SHORT_ANSWER' ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Your Written Answer:
              </label>
              <textarea
                rows="4"
                placeholder="Type your response here..."
                value={shortAnswers[String(currentQ.id)] || ''}
                onChange={(e) => handleShortAnswerChange(currentQ.id, e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>
          ) : (
            <div className="space-y-3">
              {(currentQ.options || []).map((opt) => {
                const isSelected = selectedOptions[String(currentQ.id)] === opt.id;

                return (
                  <div
                    key={opt.id}
                    onClick={() => handleOptionSelect(currentQ.id, opt.id)}
                    className={`p-4 rounded-2xl border transition-all duration-200 flex items-center gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-500 shadow-sm ring-1 ring-blue-500'
                        : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100/60 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs transition ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && '✓'}
                    </div>

                    <span className={`text-xs sm:text-sm font-semibold flex-1 ${isSelected ? 'text-blue-900 font-bold' : 'text-slate-800'}`}>
                      {opt.optionText}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Stepper Buttons */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl transition disabled:opacity-30 disabled:pointer-events-none"
            >
              ← Previous Question
            </button>

            {isLastQuestion ? (
              <button
                onClick={handleSubmitQuiz}
                disabled={submitting}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-500/20 transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                <span>🚀</span>
                <span>{submitting ? 'Submitting...' : 'Finish & Submit Quiz'}</span>
              </button>
            ) : (
              <button
                onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-md shadow-blue-500/20 transition active:scale-95 flex items-center gap-1.5"
              >
                <span>Next Question</span>
                <span>→</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizAttempt;
