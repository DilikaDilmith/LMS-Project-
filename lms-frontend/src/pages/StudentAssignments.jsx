import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { assignmentAPI, courseAPI } from '../services/api';
import toast from 'react-hot-toast';

const StudentAssignments = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const studentId = user?.id;

  // Get courseId from URL query params
  const queryParams = new URLSearchParams(location.search);
  const initialCourseId = queryParams.get('courseId');

  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId || '');
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Load enrolled courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await courseAPI.getEnrolled(studentId);
        const enrolledCourses = res.data || [];
        setCourses(enrolledCourses);
        
        // If no courseId in URL but we have courses, select first one
        if (!initialCourseId && enrolledCourses.length > 0) {
          setSelectedCourseId(enrolledCourses[0].id.toString());
          navigate(`/assignments?courseId=${enrolledCourses[0].id}`, { replace: true });
        }
      } catch (error) {
        console.error('Failed to fetch enrolled courses:', error);
        toast.error('Failed to load your courses');
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, [studentId]);

  // Load assignments when course changes
  useEffect(() => {
    if (!selectedCourseId) {
      setAssignments([]);
      setLoading(false);
      return;
    }
    fetchAssignments();
  }, [selectedCourseId]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await assignmentAPI.getByCourse(selectedCourseId);
      // Fetch submissions for this student
      const submissionsRes = await assignmentAPI.getStudentSubmissions(studentId);
      const submissions = submissionsRes.data || [];

      const assignmentsWithStatus = (res.data || []).map(assignment => {
        const submission = submissions.find(s => s.assignmentId === assignment.id);
        return {
          ...assignment,
          submissionStatus: submission?.status || 'NOT_SUBMITTED',
          submissionId: submission?.id,
          marks: submission?.marks,
          feedback: submission?.feedback,
        };
      });
      setAssignments(assignmentsWithStatus);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (assignmentId) => {
    if (!fileUrl.trim()) {
      toast.error('Please provide a file URL (e.g., Google Drive link)');
      return;
    }
    setSubmitting(assignmentId);
    try {
      await assignmentAPI.submit(assignmentId, studentId, { fileUrl });
      toast.success('Assignment submitted successfully!');
      setFileUrl('');
      await fetchAssignments();
    } catch (error) {
      toast.error(error.response?.data || 'Failed to submit assignment');
    } finally {
      setSubmitting(null);
    }
  };

  const handleCourseChange = (e) => {
    const newCourseId = e.target.value;
    setSelectedCourseId(newCourseId);
    navigate(`/assignments?courseId=${newCourseId}`);
  };

  if (loadingCourses) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b p-4 flex flex-wrap justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">📝 Assignments</h1>
        <Link to="/dashboard" className="text-blue-600 hover:underline text-sm">
          ← Back to Dashboard
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Course Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <label className="font-medium text-gray-700 text-sm">Select Course:</label>
            {courses.length === 0 ? (
              <p className="text-sm text-gray-500">You are not enrolled in any courses yet.</p>
            ) : (
              <select
                value={selectedCourseId}
                onChange={handleCourseChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm flex-1 max-w-xs"
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            )}
            {selectedCourseId && (
              <Link to={`/courses/${selectedCourseId}`} className="text-blue-600 hover:underline text-sm">
                View Course →
              </Link>
            )}
          </div>
        </div>

        {/* Assignments List */}
        {!selectedCourseId ? (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center border border-gray-100">
            <div className="text-4xl mb-3">📋</div>
            <h3 className="text-lg font-semibold text-gray-700">Select a course</h3>
            <p className="text-gray-500 text-sm mt-1">Choose a course to view its assignments.</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : assignments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center border border-gray-100">
            <div className="text-4xl mb-3">📋</div>
            <h3 className="text-lg font-semibold text-gray-700">No assignments yet</h3>
            <p className="text-gray-500 text-sm mt-1">This course has no assignments.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800">{assignment.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                      <span>📅 Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      <span>🏷️ Max Marks: {assignment.maxMarks}</span>
                    </div>
                  </div>
                  <div className="text-right min-w-[100px]">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      assignment.submissionStatus === 'GRADED' ? 'bg-green-100 text-green-700' :
                      assignment.submissionStatus === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                      assignment.submissionStatus === 'LATE' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {assignment.submissionStatus.replace('_', ' ')}
                    </span>
                    {assignment.marks !== null && assignment.marks !== undefined && (
                      <p className="mt-1 text-lg font-bold text-gray-800">{assignment.marks} / {assignment.maxMarks}</p>
                    )}
                    {assignment.feedback && (
                      <p className="mt-1 text-sm text-gray-500 italic">" {assignment.feedback} "</p>
                    )}
                  </div>
                </div>

                {(assignment.submissionStatus === 'NOT_SUBMITTED' || assignment.submissionStatus === 'RESUBMISSION_REQUESTED') && (
                  <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-xs font-medium text-gray-700 mb-1">File URL (Google Drive / OneDrive link)</label>
                      <input
                        type="url"
                        value={fileUrl}
                        onChange={(e) => setFileUrl(e.target.value)}
                        placeholder="https://drive.google.com/..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <button
                      onClick={() => handleSubmit(assignment.id)}
                      disabled={submitting === assignment.id}
                      className={`px-5 py-2 rounded-lg text-white text-sm font-medium transition ${
                        submitting === assignment.id ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {submitting === assignment.id ? 'Submitting...' : 'Submit Assignment'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAssignments;