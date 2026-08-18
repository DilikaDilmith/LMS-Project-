import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { assignmentAPI, courseAPI } from '../../services/api';
import toast from 'react-hot-toast';

const LecturerGrading = () => {
  const { user } = useAuth();
  const lecturerId = user?.id;

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(null);
  const [gradeData, setGradeData] = useState({});

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      let list = [];
      if (lecturerId) {
        const res = await courseAPI.getCoursesByLecturer(lecturerId);
        list = res.data || [];
      }
      if (list.length === 0) {
        const allRes = await courseAPI.getAll();
        list = allRes.data || [];
      }
      setCourses(list);
      if (list.length > 0) {
        setSelectedCourse(list[0].id);
      }
    } catch (error) {
      console.warn('Primary fetch courses failed, attempting getAll fallback:', error);
      try {
        const allRes = await courseAPI.getAll();
        const list = allRes.data || [];
        setCourses(list);
        if (list.length > 0) {
          setSelectedCourse(list[0].id);
        }
      } catch (err2) {
        console.error('All course fetch attempts failed:', err2);
        toast.error('Failed to load courses');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCourse) {
      fetchSubmissions();
    }
  }, [selectedCourse]);

  const [assignmentsMap, setAssignmentsMap] = useState({});

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const assignRes = await assignmentAPI.getByCourse(selectedCourse);
      const courseAssignments = assignRes.data || [];

      const map = {};
      courseAssignments.forEach(a => {
        map[a.id] = a;
      });
      setAssignmentsMap(map);

      const submissionPromises = courseAssignments.map(a =>
        assignmentAPI.getSubmissions(a.id).then(res => res.data || []).catch(() => [])
      );

      const submissionLists = await Promise.all(submissionPromises);
      const allSubmissions = submissionLists.flat();
      setSubmissions(allSubmissions);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };


  const handleGradeChange = (submissionId, field, value) => {
    setGradeData(prev => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        [field]: value
      }
    }));
  };

  const handleGradeSubmit = async (submissionId) => {
    const data = gradeData[submissionId];
    if (!data?.marks) {
      toast.error('Please enter marks');
      return;
    }
    setGrading(submissionId);
    try {
      const activeLecturerId = lecturerId ? parseInt(lecturerId) : 1;
      await assignmentAPI.grade(submissionId, activeLecturerId, {
        marks: parseFloat(data.marks),
        feedback: data.feedback || ''
      });
      toast.success('Grade submitted successfully! 🎉');
      await fetchSubmissions();
      setGradeData(prev => {
        const newData = { ...prev };
        delete newData[submissionId];
        return newData;
      });
    } catch (error) {
      toast.error(error.response?.data || 'Failed to grade submission');
    } finally {
      setGrading(null);
    }
  };


  if (loading && courses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const pendingSubmissions = submissions.filter(s => s.status === 'SUBMITTED' || s.status === 'LATE');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">✅ Grade Submissions</h1>
        <Link to="/dashboard" className="text-blue-600 hover:underline text-sm">← Back</Link>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Course Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <label className="font-medium text-gray-700 text-sm">Select Course:</label>
            {courses.length === 0 ? (
              <p className="text-sm text-gray-500">You don't have any courses yet.</p>
            ) : (
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            )}
            <span className="text-sm text-gray-500">
              {pendingSubmissions.length} pending submissions
            </span>
          </div>
        </div>

        {/* Submissions List */}
        {pendingSubmissions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center border border-gray-100">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-lg font-semibold text-gray-700">No pending submissions</h3>
            <p className="text-gray-500 text-sm mt-1">All assignments have been graded.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingSubmissions.map((sub) => {
              const assign = assignmentsMap[sub.assignmentId];
              return (
                <div key={sub.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-800">Student #{sub.studentId}</h4>
                      <p className="text-sm text-gray-500 font-medium">
                        {assign?.title ? assign.title : `Assignment #${sub.assignmentId}`}
                        {assign?.maxMarks ? ` (Max Marks: ${assign.maxMarks})` : ''}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Submitted: {new Date(sub.submittedAt).toLocaleDateString()} {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <a
                        href={sub.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-xs text-blue-600 hover:underline font-medium"
                      >
                        📎 View Submission File
                      </a>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="w-28">
                        <input
                          type="number"
                          placeholder={assign?.maxMarks ? `Score / ${assign.maxMarks}` : "Marks"}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onChange={(e) => handleGradeChange(sub.id, 'marks', e.target.value)}
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Feedback (optional)"
                        className="flex-1 min-w-[150px] px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => handleGradeChange(sub.id, 'feedback', e.target.value)}
                      />
                      <button
                        onClick={() => handleGradeSubmit(sub.id)}
                        disabled={grading === sub.id}
                        className={`px-4 py-1.5 rounded-lg text-white text-sm font-medium transition-all ${grading === sub.id ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
                      >
                        {grading === sub.id ? 'Saving...' : 'Grade ✅'}
                      </button>
                    </div>
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

export default LecturerGrading;