import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { courseAPI } from '../../services/api';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const LecturerCreateCourse = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    thumbnailUrl: '',
    durationWeeks: 12,
    instituteId: user?.instituteId || 1,
    lecturerId: user?.id
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.name.trim()) {
      setError('Please enter a course name');
      setLoading(false);
      return;
    }
    if (!formData.description.trim()) {
      setError('Please enter a course description');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        thumbnailUrl: formData.thumbnailUrl || 'https://via.placeholder.com/300x200?text=Course',
        durationWeeks: parseInt(formData.durationWeeks) || 12,
        instituteId: parseInt(formData.instituteId) || 1,
        lecturerId: parseInt(formData.lecturerId)
      };

      const response = await courseAPI.create(payload);
      toast.success('🎉 Course created successfully!');
      navigate('/lecturer/courses');

    } catch (error) {
      console.error('Create course error:', error);
      const errorMsg = error.response?.data || 'Failed to create course. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">📚 Create New Course</h1>
        <Link to="/dashboard" className="text-blue-600 hover:underline text-sm">← Back</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Course Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Advanced Web Development"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="5"
                placeholder="Describe what students will learn, course outline, prerequisites..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Thumbnail URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thumbnail URL
              </label>
              <input
                type="url"
                name="thumbnailUrl"
                value={formData.thumbnailUrl}
                onChange={handleChange}
                placeholder="https://example.com/course-thumbnail.jpg"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">Optional: Add an image URL for the course cover.</p>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (Weeks)
              </label>
              <input
                type="number"
                name="durationWeeks"
                value={formData.durationWeeks}
                onChange={handleChange}
                min="1"
                max="52"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
              <p className="font-semibold">📌 How it works:</p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Create your course with all details</li>
                <li>It will be saved as <strong>DRAFT</strong></li>
                <li>Go to "My Courses" and <strong>Submit for Approval</strong></li>
                <li>Institute Admin will review and publish it</li>
              </ol>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 py-2.5 rounded-lg text-white font-medium transition ${
                  loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? 'Creating...' : '📤 Create Course'}
              </button>
              <Link
                to="/dashboard"
                className="flex-1 py-2.5 rounded-lg text-gray-600 font-medium border border-gray-300 hover:bg-gray-50 text-center transition"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LecturerCreateCourse;