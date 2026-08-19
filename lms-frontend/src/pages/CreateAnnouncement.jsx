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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="border-b border-slate-200 bg-white/90 px-4 py-4 shadow-sm backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-xl shadow-sm shadow-sky-200">📢</div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-600">Institute communication</p>
              <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">Create announcement</h1>
            </div>
          </div>
          <Link to="/announcements" className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700">
            <span aria-hidden="true">←</span> Announcements
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:py-10">
        <div className="mb-8 max-w-2xl">
          <p className="mb-2 text-sm font-semibold text-sky-600">Publish an update</p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Make sure the right people hear it.</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">Write a clear message, choose its audience, and preview how it will appear in the announcements feed.</p>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter announcement title"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                required
              />
            </div>

            {/* Message */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows="6"
                placeholder="Write your announcement here..."
                className="w-full resize-y rounded-lg border border-slate-300 px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                required
              />
            </div>

            {/* Target Audience */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Target Audience
              </label>
              <select
                name="targetRole"
                value={formData.targetRole}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              >
                <option value="ALL">All Users</option>
                <option value="STUDENT">Students Only</option>
                <option value="LECTURER">Lecturers Only</option>
                <option value="PARENT">Parents Only</option>
              </select>
              <p className="mt-2 text-xs text-slate-400">Select who should see this announcement.</p>
            </div>

            {/* Course ID (Optional) */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Course ID (Optional)
              </label>
              <input
                type="number"
                name="courseId"
                value={formData.courseId || ''}
                onChange={handleChange}
                placeholder="Leave blank for institute-wide"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              />
              <p className="mt-2 text-xs text-slate-400">If specified, only students of this course will see it.</p>
            </div>

            {/* Info Box */}
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
              <p className="font-semibold">📌 Visibility</p>
              <p className="mt-1 leading-5">This announcement will be visible to all {formData.targetRole === 'ALL' ? 'users' : formData.targetRole.toLowerCase() + 's'} in your institute.</p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row">
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 rounded-lg py-3 font-bold text-white transition ${
                  loading ? 'cursor-not-allowed bg-slate-400' : 'bg-sky-600 shadow-sm hover:bg-sky-700'
                }`}
              >
                {loading ? 'Publishing...' : '📢 Publish Announcement'}
              </button>
              <Link
                to="/announcements"
                className="flex-1 rounded-lg border border-slate-300 py-3 text-center font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </Link>
            </div>
          </form>
          </section>

          <aside className="space-y-5 lg:sticky lg:top-6">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-900 px-5 py-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-wider text-sky-300">Live preview</p>
                <h3 className="mt-1 font-bold">Announcement feed</h3>
              </div>
              <div className="p-5">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                    <span className="text-xs font-semibold text-sky-700">{formData.targetRole === 'ALL' ? 'All Users' : `${formData.targetRole} audience`}</span>
                  </div>
                  <h4 className="mt-4 wrap-break-word text-lg font-bold text-slate-900">{formData.title || 'Your announcement title'}</h4>
                  <p className="mt-2 min-h-20 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-slate-600">{formData.message || 'Your message will appear here as you write it.'}</p>
                  <p className="mt-4 text-xs text-slate-400">Just now · Institute announcement</p>
                </div>
              </div>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-slate-900">Publishing checklist</p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p><span className={`mr-2 ${formData.title.trim() ? 'text-emerald-600' : 'text-slate-300'}`}>●</span> Add a clear title</p>
                <p><span className={`mr-2 ${formData.message.trim() ? 'text-emerald-600' : 'text-slate-300'}`}>●</span> Write the message</p>
                <p><span className="mr-2 text-emerald-600">●</span> Confirm the audience</p>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default CreateAnnouncement;