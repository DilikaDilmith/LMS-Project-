import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { parentStudentAPI, userAPI } from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const LinkChild = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const parentId = user?.id;
  const instituteId = user?.instituteId;

  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await userAPI.getStudents(instituteId);
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.warn('Primary fetch students failed, attempting getAllStudents fallback:', error);
      try {
        const resAll = await userAPI.getAllStudents();
        setStudents(Array.isArray(resAll.data) ? resAll.data : []);
      } catch (err2) {
        console.error('All student fetch attempts failed:', err2);
        toast.error('Failed to load students. Please ensure backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };




  const handleLink = async () => {
    if (!selectedStudentId) {
      toast.error('Please select a student');
      return;
    }
    setLinking(true);
    try {
      await parentStudentAPI.link(parentId, parseInt(selectedStudentId));
      toast.success('Child linked successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Link error:', error);
      toast.error(error.response?.data || 'Failed to link child');
    } finally {
      setLinking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-violet-600">👨‍👩‍👦 Link Child</h1>
        <Link to="/dashboard" className="text-violet-600 hover:underline text-sm">← Back</Link>
      </nav>

      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Link Your Child</h2>
          <p className="text-sm text-gray-500 mb-6">Select a student to link with your parent account.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">-- Select a student --</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.firstName} {student.lastName} (ID: {student.id})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleLink}
              disabled={linking}
              className={`w-full py-2.5 rounded-lg text-white font-medium transition ${
                linking ? 'bg-gray-400 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700'
              }`}
            >
              {linking ? 'Linking...' : '🔗 Link Child'}
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-4 text-center">
            Students shown are from your institute. Contact admin if your child is not listed.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LinkChild;