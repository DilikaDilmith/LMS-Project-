import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { announcementAPI } from '../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Announcements = () => {
  const { user } = useAuth();
  const role = user?.role;
  const instituteId = user?.instituteId;

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      // Fetch both institute and course announcements
      let allAnnouncements = [];

      // Institute announcements
      try {
        const instRes = await announcementAPI.getInstitute();
        allAnnouncements = [...allAnnouncements, ...(instRes.data || [])];
      } catch (e) {}

      // Global announcements (System Admin)
      try {
        const globalRes = await announcementAPI.getGlobal();
        allAnnouncements = [...allAnnouncements, ...(globalRes.data || [])];
      } catch (e) {}

      // Sort by createdAt (newest first)
      allAnnouncements.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );

      setAnnouncements(allAnnouncements);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const getTargetLabel = (announcement) => {
    if (announcement.targetRole === 'ALL') return 'All Users';
    if (announcement.targetRole) return announcement.targetRole.replace('_', ' ');
    if (announcement.courseId) return `Course #${announcement.courseId}`;
    return 'Institute';
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'SYSTEM_ADMIN': return 'bg-purple-100 text-purple-700';
      case 'INSTITUTE_ADMIN': return 'bg-blue-100 text-blue-700';
      case 'LECTURER': return 'bg-green-100 text-green-700';
      case 'PARENT': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b p-4 flex flex-wrap justify-between items-center">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-gray-500 hover:text-gray-700 text-sm">← Dashboard</Link>
          <h1 className="text-xl font-bold text-blue-600">📢 Announcements</h1>
        </div>
        {(role === 'ROLE_INSTITUTE_ADMIN' || role === 'ROLE_LECTURER') && (
          <Link
            to="/announcements/create"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
          >
            + New Announcement
          </Link>
        )}
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {announcements.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <div className="text-5xl mb-4">📢</div>
            <h3 className="text-lg font-semibold text-gray-700">No Announcements</h3>
            <p className="text-gray-400 text-sm mt-1">There are no announcements at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition"
              >
                <div className="flex flex-wrap justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-gray-800">{announcement.title}</h3>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        {getTargetLabel(announcement)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleBadge(announcement.createdByRole || '')}`}>
                        {announcement.createdByRole || 'Admin'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{announcement.message}</p>
                    <p className="text-xs text-gray-400 mt-3">
                      📅 {new Date(announcement.createdAt).toLocaleDateString()} at {new Date(announcement.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Announcements;