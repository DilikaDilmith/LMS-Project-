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
  const [loading, setLoading] = useState(true);

  // New Quiz Modal / Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    durationMinutes: 30,
    passingScore: 50,
  });

  // Question Modal / Form State
  const [activeQuizForQuestion, setActiveQuizForQuestion] = useState(null);
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
    try {
      const res = await courseAPI.getCoursesByLecturer(lecturerId);
      const lecturerCourses = res.data || [];
      setCourses(lecturerCourses);
      if (lecturerCourses.length > 0) {
        setSelectedCourse(lecturerCourses[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch lecturer courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCourse) {
      fetchQuizzesForCourse(selectedCourse);
    }
  }, [selectedCourse]);

  const fetchQuizzesForCourse = async (courseId) => {
    setLoading(true);
    try {
      const res = await quizAPI.getByCourse(courseId);
      setQuizzes(res.data || []);
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
      toast.error('Failed to load quizzes for selected course');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuizSubmit = async (e) => {
    e.preventDefault();
    if (!quizForm.title) {
      toast.error('Please enter a quiz title');
      return;
    }
    try {
      await quizAPI.create({
        courseId: parseInt(selectedCourse),
        title: quizForm.title,
        description: quizForm.description,
        durationMinutes: parseInt(quizForm.durationMinutes),
        passingScore: parseInt(quizForm.passingScore),
      });
      toast.success('Quiz created successfully!');
      setShowCreateModal(false);
      setQuizForm({ title: '', description: '', durationMinutes: 30, passingScore: 50 });
      fetchQuizzesForCourse(selectedCourse);
    } catch (error) {
      toast.error(error.response?.data || 'Failed to create quiz');
    }
  };

  const handleAddOption = () => {
    setQuestionForm((prev) => ({
      ...prev,
      options: [...prev.options, { optionText: '', isCorrect: false }],
    }));
  };

  const handleOptionChange = (idx, field, value) => {
    setQuestionForm((prev) => {
      const updatedOptions = prev.options.map((opt, i) => {
        if (i === idx) {
          return { ...opt, [field]: value };
        }
        if (field === 'isCorrect' && value === true) {
          return { ...opt, isCorrect: false }; // Only 1 correct option for simplicity
        }
        return opt;
      });
      return { ...prev, options: updatedOptions };
    });
  };

  const handleAddQuestionSubmit = async (e) => {
    e.preventDefault();
    if (!questionForm.questionText) {
      toast.error('Please enter a question prompt');
      return;
    }
    try {
      await quizAPI.addQuestion(activeQuizForQuestion.id, {
        questionText: questionForm.questionText,
        questionType: questionForm.questionType,
        marks: parseInt(questionForm.marks),
        options: questionForm.options.filter((opt) => opt.optionText.trim() !== ''),
      });
      toast.success('Question added to quiz!');
      setActiveQuizForQuestion(null);
      setQuestionForm({
        questionText: '',
        questionType: 'MCQ',
        marks: 10,
        options: [
          { optionText: '', isCorrect: true },
          { optionText: '', isCorrect: false },
        ],
      });
    } catch (error) {
      toast.error(error.response?.data || 'Failed to add question');
    }
  };

  if (loading && courses.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-slate-500 hover:text-slate-800 text-sm">
            ← Dashboard
          </Link>
          <h1 className="text-xl font-bold text-slate-800">📝 Quiz & Question Management</h1>
        </div>
        <Link
          to="/lecturer/grading"
          className="text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-100 px-4 py-2 rounded-lg transition"
        >
          ✅ Grade Submissions
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-4 mt-8">
        {/* Controls Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-slate-700">Course:</label>
            {courses.length === 0 ? (
              <span className="text-sm text-slate-400">No courses created yet</span>
            ) : (
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!selectedCourse}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md transition disabled:opacity-50"
          >
            + Create New Quiz
          </button>
        </div>

        {/* Quizzes List */}
        {quizzes.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
            <div className="text-4xl mb-3">📝</div>
            <h3 className="text-lg font-bold text-slate-800">No Quizzes for this Course</h3>
            <p className="text-slate-500 text-sm mt-1">
              Click "+ Create New Quiz" to publish an assessment for your students.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-wrap justify-between items-center gap-4"
              >
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{quiz.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{quiz.description || 'No description provided.'}</p>
                  <div className="flex gap-4 mt-3 text-xs text-slate-600">
                    <span>⏱️ Duration: <strong>{quiz.durationMinutes} min</strong></span>
                    <span>🎯 Pass Score: <strong>{quiz.passingScore}%</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveQuizForQuestion(quiz)}
                    className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold rounded-xl transition"
                  >
                    + Add Questions
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE QUIZ MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Create Course Quiz</h3>
            <form onSubmit={handleCreateQuizSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quiz Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Midterm Assessment"
                  value={quizForm.title}
                  onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows="3"
                  placeholder="Brief instructions for students..."
                  value={quizForm.description}
                  onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="5"
                    value={quizForm.durationMinutes}
                    onChange={(e) => setQuizForm({ ...quizForm, durationMinutes: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Passing Score (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={quizForm.passingScore}
                    onChange={(e) => setQuizForm({ ...quizForm, passingScore: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
                >
                  Create Quiz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD QUESTION MODAL */}
      {activeQuizForQuestion && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Add Question</h3>
            <p className="text-xs text-slate-500 mb-4">Quiz: {activeQuizForQuestion.title}</p>

            <form onSubmit={handleAddQuestionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Question Prompt</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Enter the question text..."
                  value={questionForm.questionText}
                  onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Question Type</label>
                  <select
                    value={questionForm.questionType}
                    onChange={(e) => setQuestionForm({ ...questionForm, questionType: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="MCQ">Multiple Choice (MCQ)</option>
                    <option value="TRUE_FALSE">True / False</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Marks</label>
                  <input
                    type="number"
                    min="1"
                    value={questionForm.marks}
                    onChange={(e) => setQuestionForm({ ...questionForm, marks: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Options */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-semibold text-slate-700">Answer Options</span>
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    + Add Option
                  </button>
                </div>

                <div className="space-y-2">
                  {questionForm.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctOption"
                        checked={opt.isCorrect}
                        onChange={() => handleOptionChange(idx, 'isCorrect', true)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <input
                        type="text"
                        placeholder={`Option ${idx + 1}`}
                        value={opt.optionText}
                        onChange={(e) => handleOptionChange(idx, 'optionText', e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setActiveQuizForQuestion(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LecturerQuizzes;
