import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { assignmentAPI, quizAPI } from '../../services/api';
import toast from 'react-hot-toast';

const StudentResults = () => {
  const { user } = useAuth();
  const studentId = user?.id;

  const [submissions, setSubmissions] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('assignments');

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const [submissionsRes, quizRes] = await Promise.all([
        assignmentAPI.getStudentSubmissions(studentId),
        quizAPI.getStudentResults(studentId)
      ]);
      setSubmissions(submissionsRes.data || []);
      setQuizAttempts(quizRes.data || []);
    } catch (error) {
      console.error('Failed to fetch results:', error);
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const gradedSubmissions = submissions.filter(s => s.status === 'GRADED');
  const passedQuizzes = quizAttempts.filter(q => q.passed);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">📊 My Results</h1>
        <Link to="/dashboard" className="text-blue-600 hover:underline text-sm">← Back</Link>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold text-blue-600">{gradedSubmissions.length}</p>
            <p className="text-xs text-gray-500">Assignments Graded</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold text-green-600">{passedQuizzes.length}</p>
            <p className="text-xs text-gray-500">Quizzes Passed</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold text-purple-600">{quizAttempts.length}</p>
            <p className="text-xs text-gray-500">Total Quizzes</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold text-orange-600">{submissions.length}</p>
            <p className="text-xs text-gray-500">Total Submissions</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`px-6 py-2 text-sm font-medium ${activeTab === 'assignments' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('assignments')}
          >
            📝 Assignments
          </button>
          <button
            className={`px-6 py-2 text-sm font-medium ${activeTab === 'quizzes' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('quizzes')}
          >
            ❓ Quizzes
          </button>
        </div>

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="space-y-4">
            {gradedSubmissions.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
                <div className="text-4xl mb-3">📝</div>
                <p className="text-gray-500">No graded assignments yet</p>
              </div>
            ) : (
              gradedSubmissions.map((sub) => (
                <div key={sub.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-wrap justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-gray-800">Assignment #{sub.assignmentId}</h4>
                    <p className="text-sm text-gray-500">Submitted: {new Date(sub.submittedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-blue-600">{sub.marks || 0}</span>
                    <span className="text-sm text-gray-400"> / max</span>
                    {sub.feedback && <p className="text-sm text-gray-500 italic mt-1">"{sub.feedback}"</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Quizzes Tab */}
        {activeTab === 'quizzes' && (
          <div className="space-y-4">
            {quizAttempts.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
                <div className="text-4xl mb-3">❓</div>
                <p className="text-gray-500">No quiz attempts yet</p>
              </div>
            ) : (
              quizAttempts.map((attempt) => (
                <div key={attempt.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-wrap justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-gray-800">Quiz #{attempt.quizId}</h4>
                    <p className="text-sm text-gray-500">Attempted: {new Date(attempt.attemptedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xl font-bold ${attempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                      {attempt.score || 0}
                    </span>
                    <span className="text-sm text-gray-400"> / marks</span>
                    <div className={`mt-1 text-xs font-medium px-2 py-0.5 rounded ${attempt.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {attempt.passed ? '✅ Passed' : '❌ Failed'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentResults;