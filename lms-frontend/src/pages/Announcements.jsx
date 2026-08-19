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
    switch (role.replace('ROLE_', '')) {
      case 'SYSTEM_ADMIN': return 'bg-purple-100 text-purple-700';
      case 'INSTITUTE_ADMIN': return 'bg-blue-100 text-blue-700';
      case 'LECTURER': return 'bg-green-100 text-green-700';
      case 'PARENT': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredAnnouncements = announcements.filter((announcement) => {
    if (filter === 'ALL') return true;
    if (filter === 'GLOBAL') return announcement.targetRole === 'ALL';
    if (filter === 'COURSE') return Boolean(announcement.courseId);
    return announcement.targetRole === filter;
  });

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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Navbar */}
      <nav className="border-b border-slate-200 bg-white/90 px-4 py-4 shadow-sm backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-xl shadow-sm shadow-sky-200">📢</div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-600">Institute communication</p>
              <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">Announcements</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">{announcements.length} updates</span>
            {(role === 'ROLE_INSTITUTE_ADMIN' || role === 'ROLE_LECTURER') && (
              <Link
                to="/announcements/create"
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-sky-700"
              >
                <span aria-hidden="true">+</span> New announcement
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8 lg:py-10">
        <div className="mb-8 rounded-2xl bg-slate-900 px-6 py-7 text-white shadow-lg sm:px-8">
          <p className="text-sm font-semibold text-sky-300">Stay in the loop</p>
          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">What’s happening across your institute.</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Important notices, course updates, and messages from your academic community in one clear feed.</p>
            </div>
            <div className="shrink-0 rounded-xl border border-white/10 bg-white/10 px-4 py-3">
              <p className="text-xs text-slate-300">Visible updates</p>
              <p className="mt-1 text-2xl font-bold">{filteredAnnouncements.length}</p>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Latest notices</h2>
            <p className="mt-1 text-sm text-slate-500">Sorted by most recent activity.</p>
          </div>
          <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
            {[
              ['ALL', 'All'],
              ['GLOBAL', 'Everyone'],
              ['COURSE', 'Courses'],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition ${filter === value ? 'bg-sky-600 text-white shadow-sm' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-sky-50'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filteredAnnouncements.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-4xl">📢</div>
            <h3 className="mt-5 text-lg font-bold text-slate-800">No announcements found</h3>
            <p className="mt-1 text-sm text-slate-400">There are no updates in this view right now.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md sm:p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="hidden h-11 w-1 shrink-0 rounded-full bg-sky-500 sm:block" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">{announcement.title}</h3>
                      <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
                        {getTargetLabel(announcement)}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getRoleBadge(announcement.createdByRole || '')}`}>
                        {(announcement.createdByRole || 'Admin').replace('ROLE_', '').replace('_', ' ')}
                      </span>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{announcement.message}</p>
                    <p className="mt-4 text-xs font-medium text-slate-400">
                      <span aria-hidden="true">◷</span> {new Date(announcement.createdAt).toLocaleDateString()} at {new Date(announcement.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Announcements;