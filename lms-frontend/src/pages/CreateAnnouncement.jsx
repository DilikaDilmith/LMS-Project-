import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { announcementAPI } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const CreateAnnouncement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    instituteId: user?.instituteId || null,
    courseId: null,
    targetRole: 'ALL'
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!formData.message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        createdBy: user?.id
      };
      await announcementAPI.create(payload);
      toast.success('✅ Announcement published successfully!');
      navigate('/announcements');
    } catch (error) {
      console.error('Create announcement error:', error);
      toast.error(error.response?.data || 'Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">📢 Create Announcement</h1>
        <Link to="/announcements" className="text-blue-600 hover:underline text-sm">← Back</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter announcement title"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows="6"
                placeholder="Write your announcement here..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Target Audience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Audience
              </label>
              <select
                name="targetRole"
                value={formData.targetRole}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Users</option>
                <option value="STUDENT">Students Only</option>
                <option value="LECTURER">Lecturers Only</option>
                <option value="PARENT">Parents Only</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">Select who should see this announcement.</p>
            </div>

            {/* Course ID (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course ID (Optional)
              </label>
              <input
                type="number"
                name="courseId"
                value={formData.courseId || ''}
                onChange={handleChange}
                placeholder="Leave blank for institute-wide"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">If specified, only students of this course will see it.</p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
              <p className="font-semibold">📌 Note:</p>
              <p>This announcement will be visible to all {formData.targetRole === 'ALL' ? 'users' : formData.targetRole.toLowerCase() + 's'} in your institute.</p>
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
                {loading ? 'Publishing...' : '📢 Publish Announcement'}
              </button>
              <Link
                to="/announcements"
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

export default CreateAnnouncement;