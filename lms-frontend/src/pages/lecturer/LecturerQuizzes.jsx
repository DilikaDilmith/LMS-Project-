import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { courseAPI, quizAPI } from '../../services/api';
import toast from 'react-hot-toast';

const LecturerQuizzes = () => {
  const { user } = useAuth();
  const lecturerId = user?.id;

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [quizzes, setQuizzes] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  // New Quiz Modal / Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    durationMinutes: 30,
    passingScore: 50,
  });
  const [creatingQuiz, setCreatingQuiz] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [deletingQuizId, setDeletingQuizId] = useState(null);

  // Question Modal / Form State
  const [activeQuizForQuestion, setActiveQuizForQuestion] = useState(null);
  const [existingQuestions, setExistingQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState(false);

  // Submissions viewing state
  const [activeSubmissionsQuiz, setActiveSubmissionsQuiz] = useState(null);
  const [quizSubmissions, setQuizSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  const [questionForm, setQuestionForm] = useState({
    questionText: '',
    questionType: 'MCQ',
    marks: 10,
    options: [
      { optionText: '', isCorrect: true },
      { optionText: '', isCorrect: false },
    ],
  });

  useEffect(() => {
    fetchLecturerCourses();
  }, [lecturerId]);

  const fetchLecturerCourses = async () => {
    setLoadingCourses(true);
    try {
      let list = [];
      if (lecturerId) {
        const res = await courseAPI.getCoursesByLecturer(lecturerId);
        list = res.data || [];
      }
      // NOTE: Do NOT fall back to all courses — lecturer must only see their own courses.
      // Showing courses they don't own will cause 403 errors when they try to edit/delete quizzes.
      setCourses(list);
      if (list.length > 0) {
        setSelectedCourse(String(list[0].id));
      }
    } catch (error) {
      console.error('Failed to fetch lecturer courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    if (selectedCourse) {
      fetchQuizzesForCourse(selectedCourse);
    }
  }, [selectedCourse]);

  const fetchQuizzesForCourse = async (courseId) => {
    setLoadingQuizzes(true);
    try {
      const res = await quizAPI.getByCourse(courseId);
      const quizList = Array.isArray(res.data) ? res.data : [];
      setQuizzes(quizList);
      return quizList;
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
      setQuizzes([]);
      return [];
    } finally {
      setLoadingQuizzes(false);
    }
  };

  // Fetch Questions for selected quiz
  const fetchQuestionsForQuiz = async (quizId) => {
    setLoadingQuestions(true);
    try {
      const res = await quizAPI.getQuestions(quizId);
      setExistingQuestions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.warn('Failed to load questions:', err);
      setExistingQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleOpenQuestionModal = (quiz) => {
    setActiveQuizForQuestion(quiz);
    fetchQuestionsForQuiz(quiz.id);
    resetQuestionForm();
  };

  // Fetch & open submissions modal for a quiz
  const handleOpenSubmissions = async (quiz) => {
    setActiveSubmissionsQuiz(quiz);
    setLoadingSubmissions(true);
    setQuizSubmissions([]);
    try {
      const res = await quizAPI.getSubmissions(quiz.id);
      setQuizSubmissions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.warn('Failed to load submissions:', err);
      setQuizSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const resetQuestionForm = () => {
    setQuestionForm({
      questionText: '',
      questionType: 'MCQ',
      marks: 10,
      options: [
        { optionText: '', isCorrect: true },
        { optionText: '', isCorrect: false },
      ],
    });
  };

  const resetQuizForm = () => {
    setQuizForm({ title: '', description: '', durationMinutes: 30, passingScore: 50 });
  };

  const handleOpenCreateQuiz = () => {
    setEditingQuiz(null);
    resetQuizForm();
    setShowCreateModal(true);
  };

  const handleOpenEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setQuizForm({
      title: quiz.title || '',
      description: quiz.description || '',
      durationMinutes: quiz.durationMinutes || 30,
      passingScore: quiz.passingScore || 50,
    });
    setShowCreateModal(true);
  };

  // Handle Create Quiz
  const handleCreateQuizSubmit = async (e, shouldOpenQuestionBuilder = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!quizForm.title.trim()) {
      toast.error('Please enter a quiz title');
      return;
    }
    setCreatingQuiz(true);
    try {
      const payload = {
        courseId: parseInt(selectedCourse),
        title: quizForm.title.trim(),
        description: quizForm.description.trim(),
        durationMinutes: parseInt(quizForm.durationMinutes) || 30,
        passingScore: parseInt(quizForm.passingScore) || 50,
      };

      if (editingQuiz) {
        await quizAPI.update(editingQuiz.id, payload);
        toast.success('Quiz updated successfully!');
        setShowCreateModal(false);
        setEditingQuiz(null);
        resetQuizForm();
        await fetchQuizzesForCourse(selectedCourse);
        return;
      }

      const createdRes = await quizAPI.create(payload);

      toast.success('🎉 Quiz created successfully!');
      setShowCreateModal(false);
      const createdQuiz = createdRes.data;
      resetQuizForm();

      await fetchQuizzesForCourse(selectedCourse);

      if (shouldOpenQuestionBuilder && createdQuiz?.id) {
        handleOpenQuestionModal(createdQuiz);
      }
    } catch (error) {
      const action = editingQuiz ? 'update' : 'create';
      const data = error?.response?.data;
      const msg =
        (typeof data === 'string' ? data : data?.error || data?.message) ||
        error?.message ||
        `Failed to ${action} quiz`;
      toast.error(msg);
    } finally {
      setCreatingQuiz(false);
    }
  };

  // Helper: extract a readable error message from axios errors
  const extractErrorMessage = (error, fallback = 'An error occurred') => {
    const data = error?.response?.data;
    if (!data) return error?.message || fallback;
    if (typeof data === 'string') return data;
    if (typeof data === 'object') {
      return data.error || data.message || data.detail || JSON.stringify(data);
    }
    return fallback;
  };

  const handleDeleteQuiz = async (quiz) => {
    if (!window.confirm(`Delete "${quiz.title}"? This cannot be undone.`)) {
      return;
    }

    setDeletingQuizId(quiz.id);
    try {
      await quizAPI.remove(quiz.id);
      toast.success('Quiz deleted successfully!');
      await fetchQuizzesForCourse(selectedCourse);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to delete quiz'));
    } finally {
      setDeletingQuizId(null);
    }
  };

  const handleAddOption = () => {
    setQuestionForm((prev) => ({
      ...prev,
      options: [...prev.options, { optionText: '', isCorrect: false }],
    }));
  };

  const handleRemoveOption = (indexToRemove) => {
    if (questionForm.options.length <= 2) {
      toast.error('Multiple choice questions require at least 2 options');
      return;
    }
    setQuestionForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleOptionChange = (idx, field, value) => {
    setQuestionForm((prev) => {
      const updatedOptions = prev.options.map((opt, i) => {
        if (i === idx) {
          return { ...opt, [field]: value };
        }
        if (field === 'isCorrect' && value === true && questionForm.questionType !== 'MULTIPLE_SELECT') {
          return { ...opt, isCorrect: false };
        }
        return opt;
      });
      return { ...prev, options: updatedOptions };
    });
  };

  const handleQuestionTypeChange = (questionType) => {
    const options =
      questionType === 'TRUE_FALSE'
        ? [
            { optionText: 'True', isCorrect: true },
            { optionText: 'False', isCorrect: false },
          ]
        : questionType === 'SHORT_ANSWER'
        ? []
        : [
            { optionText: '', isCorrect: true },
            { optionText: '', isCorrect: false },
          ];
    setQuestionForm((prev) => ({ ...prev, questionType, options }));
  };

  // Save Question Function: separates "Add & Continue" from "Save & Close"
  const handleSaveQuestion = async (closeAfterSave = false) => {
    if (!questionForm.questionText.trim()) {
      toast.error('Please enter the question text/prompt');
      return;
    }

    if (questionForm.questionType !== 'SHORT_ANSWER') {
      const validOptions = questionForm.options.filter((o) => o.optionText.trim() !== '');
      if (validOptions.length < 2) {
        toast.error('Please fill at least 2 answer options');
        return;
      }
      const hasCorrect = validOptions.some((o) => o.isCorrect);
      if (!hasCorrect) {
        toast.error('Please select at least one correct answer option');
        return;
      }
    }

    setSavingQuestion(true);
    try {
      await quizAPI.addQuestion(activeQuizForQuestion.id, {
        questionText: questionForm.questionText.trim(),
        questionType: questionForm.questionType,
        marks: parseInt(questionForm.marks) || 10,
        options: questionForm.options.filter((opt) => opt.optionText.trim() !== ''),
      });

      toast.success(
        closeAfterSave
          ? '✅ Question saved and quiz updated!'
          : `✅ Question #${existingQuestions.length + 1} added! Enter your next question.`
      );

      // Refresh existing questions list
      await fetchQuestionsForQuiz(activeQuizForQuestion.id);

      if (closeAfterSave) {
        setActiveQuizForQuestion(null);
      } else {
        resetQuestionForm();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data || 'Failed to add question');
    } finally {
      setSavingQuestion(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20 animate-fadeIn">
      {/* Top Navbar */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-6 py-3.5 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center text-xl shadow-md shadow-blue-500/20">
            ❓
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 tracking-tight">
              Quiz &amp; Question Builder
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">Create online tests, MCQs, and question banks</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/lecturer/grading"
            className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 border border-emerald-200"
          >
            <span>📝</span>
            <span>Review Grading</span>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
        {/* Controls Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-blue-100 shadow-sm mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black uppercase text-slate-400">Select Course:</span>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Course #{c.id})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleOpenCreateQuiz}
            disabled={!selectedCourse}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 transition active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <span>➕</span>
            <span>Create New Quiz</span>
          </button>
        </div>

        {/* No Courses Assigned State */}
        {!loadingCourses && courses.length === 0 && (
          <div className="bg-white rounded-3xl p-16 text-center border border-amber-100 shadow-sm max-w-xl mx-auto my-6">
            <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-inner">
              📚
            </div>
            <h3 className="text-lg font-black text-slate-900">No Courses Assigned Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You don't have any courses assigned to you. Please contact your institute admin to be assigned to a course before creating quizzes.
            </p>
          </div>
        )}

        {/* Quizzes List */}
        {loadingCourses ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
            <p className="text-xs text-slate-500 font-semibold">Loading your courses...</p>
          </div>
        ) : loadingQuizzes ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
            <p className="text-xs text-slate-500 font-semibold">Loading quizzes for this course...</p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-blue-100 shadow-sm max-w-xl mx-auto my-6">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-inner">
              ❓
            </div>
            <h3 className="text-lg font-black text-slate-900">No Quizzes Published Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Click "+ Create New Quiz" to compose an online quiz and add multiple-choice questions.
            </p>
            <button
              onClick={handleOpenCreateQuiz}
              className="mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition"
            >
              Create First Quiz 🚀
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="group bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 text-white relative">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-extrabold uppercase text-blue-300 border border-white/10">
                      ⏱️ {quiz.durationMinutes} Minutes
                    </span>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[10px] font-black">
                      Pass: {quiz.passingScore}%
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-white leading-snug line-clamp-1">
                    {quiz.title}
                  </h3>
                </div>

                {/* Body */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {quiz.description || 'Interactive online quiz assessment for enrolled students.'}
                  </p>

                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleOpenQuestionModal(quiz)}
                      className="flex-1 py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 transition active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <span>➕</span>
                      <span>Manage &amp; Add Questions</span>
                    </button>
                    <button
                      onClick={() => handleOpenSubmissions(quiz)}
                      className="py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-xs rounded-xl border border-emerald-200 transition active:scale-95 flex items-center gap-1.5"
                    >
                      <span>📊</span>
                      <span>Submissions</span>
                    </button>
                    <button
                      onClick={() => handleOpenEditQuiz(quiz)}
                      disabled={deletingQuizId === quiz.id}
                      className="py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-700 font-extrabold text-xs rounded-xl border border-amber-200 transition disabled:opacity-50"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteQuiz(quiz)}
                      disabled={deletingQuizId === quiz.id}
                      className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs rounded-xl border border-rose-200 transition disabled:opacity-50 flex items-center gap-1"
                    >
                      {deletingQuizId === quiz.id ? '⏳ Deleting...' : '🗑️ Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 📝 CREATE QUIZ MODAL */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-blue-100 animate-scaleUp">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">{editingQuiz ? 'Quiz Editor' : 'Quiz Creator'}</span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">{editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}</h3>
              </div>
              <button
                type="button"
                onClick={() => { setShowCreateModal(false); setEditingQuiz(null); resetQuizForm(); }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={(e) => handleCreateQuizSubmit(e, false)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quiz Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Module 2: UI Design Principles Assessment"
                  value={quizForm.title}
                  onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description &amp; Guidelines</label>
                <textarea
                  rows="3"
                  placeholder="Instructions for students (e.g. Choose the single best answer for each question)..."
                  value={quizForm.description}
                  onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="5"
                    value={quizForm.durationMinutes}
                    onChange={(e) => setQuizForm({ ...quizForm, durationMinutes: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Passing Score (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={quizForm.passingScore}
                    onChange={(e) => setQuizForm({ ...quizForm, passingScore: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  type="button"
                  onClick={(e) => handleCreateQuizSubmit(e, !editingQuiz)}
                  disabled={creatingQuiz}
                  className="w-full sm:flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 transition active:scale-95 disabled:opacity-50"
                >
                  {creatingQuiz
                    ? (editingQuiz ? 'Updating...' : 'Creating...')
                    : (editingQuiz ? 'Update Quiz' : 'Create & Add Questions Now 🚀')}
                </button>

                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setEditingQuiz(null); resetQuizForm(); }}
                  className="w-full sm:w-auto px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ❓ QUESTION BUILDER MODAL WITH SEPARATED ACTION BUTTONS */}
      {/* ========================================================================= */}
      {activeQuizForQuestion && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-blue-100 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-6 relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">
                    Question Builder
                  </span>
                  <h4 className="text-xl font-black text-white mt-0.5">
                    {activeQuizForQuestion.title}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Questions in this Quiz: <span className="font-extrabold text-emerald-400">{existingQuestions.length}</span>
                  </p>
                </div>

                <button
                  onClick={() => setActiveQuizForQuestion(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
              {/* Existing Questions List Preview */}
              {existingQuestions.length > 0 && (
                <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>📋 Already Added Questions ({existingQuestions.length})</span>
                    <span className="text-[11px] text-blue-600 font-semibold">
                      Total Marks: {existingQuestions.reduce((acc, q) => acc + (q.marks || 0), 0)}
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {existingQuestions.map((q, idx) => (
                      <div key={q.id || idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-5 h-5 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-800 truncate">{q.questionText}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 shrink-0">
                          {q.marks} Marks
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Question Form */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    ➕ Add Question #{existingQuestions.length + 1}
                  </h5>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Question Prompt <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows="3"
                    placeholder="Enter your question here (e.g. Which Figma tool is used for creating vector shapes?)..."
                    value={questionForm.questionText}
                    onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Question Type</label>
                    <select
                      value={questionForm.questionType}
                      onChange={(e) => handleQuestionTypeChange(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                    >
                      <option value="MCQ">Multiple Choice (MCQ)</option>
                      <option value="TRUE_FALSE">True / False</option>
                      <option value="MULTIPLE_SELECT">Multiple Select</option>
                      <option value="SHORT_ANSWER">Short Answer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Marks</label>
                    <input
                      type="number"
                      min="1"
                      value={questionForm.marks}
                      onChange={(e) => setQuestionForm({ ...questionForm, marks: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                    />
                  </div>
                </div>

                {/* Answer Options */}
                {questionForm.questionType !== 'SHORT_ANSWER' && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-700 block">
                          Answer Options
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Select the radio button next to the correct answer.
                        </span>
                      </div>

                      {questionForm.questionType !== 'TRUE_FALSE' && (
                        <button
                          type="button"
                          onClick={handleAddOption}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition"
                        >
                          + Add Option
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {questionForm.options.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                          <input
                            type={questionForm.questionType === 'MULTIPLE_SELECT' ? 'checkbox' : 'radio'}
                            name="correctOption"
                            checked={opt.isCorrect}
                            onChange={() => handleOptionChange(idx, 'isCorrect', true)}
                            className="w-4 h-4 text-blue-600 accent-blue-600 cursor-pointer ml-1"
                            title="Mark as correct answer"
                          />
                          <input
                            type="text"
                            placeholder={`Option ${idx + 1} text...`}
                            value={opt.optionText}
                            onChange={(e) => handleOptionChange(idx, 'optionText', e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                          />
                          {questionForm.options.length > 2 && questionForm.questionType !== 'TRUE_FALSE' && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(idx)}
                              className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold flex items-center justify-center"
                              title="Delete option"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer with SEPARATED ACTIONS */}
            <div className="p-5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setActiveQuizForQuestion(null)}
                className="px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl transition"
              >
                Close Editor
              </button>

              <div className="flex items-center gap-2">
                {/* 1. Add Question & Continue Button */}
                <button
                  type="button"
                  onClick={() => handleSaveQuestion(false)}
                  disabled={savingQuestion}
                  className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-xs rounded-xl border border-blue-200 transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span>➕</span>
                  <span>{savingQuestion ? 'Saving...' : 'Save & Add Another Question'}</span>
                </button>

                {/* 2. Save & Finish Button */}
                <button
                  type="button"
                  onClick={() => handleSaveQuestion(true)}
                  disabled={savingQuestion}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span>💾</span>
                  <span>{savingQuestion ? 'Saving...' : 'Save & Finish'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📊 STUDENT SUBMISSIONS MODAL */}
      {/* ========================================================================= */}
      {activeSubmissionsQuiz && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-emerald-100 max-w-2xl w-full max-h-[88vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-950 text-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                    Student Submissions
                  </span>
                  <h4 className="text-xl font-black text-white mt-0.5">
                    {activeSubmissionsQuiz.title}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Passing Score: <span className="font-extrabold text-emerald-400">{activeSubmissionsQuiz.passingScore}%</span>
                    &nbsp;·&nbsp; Duration: <span className="font-extrabold text-blue-300">{activeSubmissionsQuiz.durationMinutes} min</span>
                  </p>
                </div>
                <button
                  onClick={() => setActiveSubmissionsQuiz(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Submissions Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
              {loadingSubmissions ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin"></div>
                  <p className="text-xs text-slate-500 font-semibold">Loading student submissions...</p>
                </div>
              ) : quizSubmissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-3xl mx-auto mb-3">📭</div>
                  <h5 className="text-sm font-black text-slate-700">No Submissions Yet</h5>
                  <p className="text-xs text-slate-400 mt-1">Students haven't attempted this quiz yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Summary row */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-white rounded-2xl p-3 border border-slate-200 text-center shadow-xs">
                      <div className="text-xl font-black text-slate-900">{quizSubmissions.length}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Total Attempts</div>
                    </div>
                    <div className="bg-white rounded-2xl p-3 border border-emerald-200 text-center shadow-xs">
                      <div className="text-xl font-black text-emerald-700">
                        {quizSubmissions.filter(a => a.isPassed).length}
                      </div>
                      <div className="text-[10px] font-bold text-emerald-500 uppercase">Passed</div>
                    </div>
                    <div className="bg-white rounded-2xl p-3 border border-rose-200 text-center shadow-xs">
                      <div className="text-xl font-black text-rose-700">
                        {quizSubmissions.filter(a => !a.isPassed).length}
                      </div>
                      <div className="text-[10px] font-bold text-rose-400 uppercase">Failed</div>
                    </div>
                  </div>

                  {/* Individual submission rows */}
                  {quizSubmissions.map((attempt, idx) => {
                    const passed = attempt.isPassed;
                    const score = attempt.score ?? 0;
                    const submittedAt = attempt.endTime || attempt.attemptedAt;
                    return (
                      <div
                        key={attempt.id || idx}
                        className={`bg-white rounded-2xl p-4 border flex items-center justify-between gap-4 shadow-xs ${
                          passed ? 'border-emerald-200' : 'border-rose-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                            passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {passed ? '✅' : '❌'}
                          </div>
                          <div>
                            <div className="text-xs font-extrabold text-slate-800">
                              Student ID: #{attempt.studentId}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                              {submittedAt
                                ? new Date(submittedAt).toLocaleString('en-US', {
                                    month: 'short', day: 'numeric',
                                    hour: '2-digit', minute: '2-digit',
                                  })
                                : 'Time not recorded'}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-base font-black text-slate-900">
                            {score} pts
                          </div>
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                            passed
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {passed ? 'PASSED' : 'FAILED'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveSubmissionsQuiz(null)}
                className="px-5 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LecturerQuizzes;
