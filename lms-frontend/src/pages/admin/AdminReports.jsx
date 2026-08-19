import React from 'react';
import { Link } from 'react-router-dom';

const AdminReports = () => {
  const reports = [
    {
      icon: '👨‍🎓',
      title: 'Student Report',
      description: 'Enrollment, approval, and learner growth statistics.',
      accent: 'blue',
      meta: 'Learner overview',
    },
    {
      icon: '📚',
      title: 'Course Report',
      description: 'Course activity, completion, and catalogue performance.',
      accent: 'indigo',
      meta: 'Learning activity',
    },
    {
      icon: '💰',
      title: 'Payment Report',
      description: 'Fee collection, payment status, and revenue summaries.',
      accent: 'emerald',
      meta: 'Finance overview',
    },
    {
      icon: '📊',
      title: 'Attendance Report',
      description: 'Attendance trends and participation across courses.',
      accent: 'amber',
      meta: 'Engagement insights',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="border-b border-slate-200 bg-white/90 px-4 py-4 shadow-sm backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-xl shadow-sm shadow-violet-200">
              📊
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">Institute administration</p>
              <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">Reports & insights</h1>
            </div>
          </div>
          <Link
            to="/dashboard"
            className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
          >
            <span aria-hidden="true">←</span> Dashboard
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:py-10">
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="mb-2 text-sm font-semibold text-violet-600">Decision support</p>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">See the institute at a glance.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">Generate focused reports to understand learners, teaching activity, finances, and engagement.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Reporting period</p>
            <p className="mt-1 text-sm font-bold text-slate-700">Current academic year</p>
          </div>
        </div>

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reports.map((report) => {
            const accentStyles = {
              blue: 'border-blue-200 bg-blue-50 text-blue-700',
              indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700',
              emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
              amber: 'border-amber-200 bg-amber-50 text-amber-700',
            };

            return (
              <article key={report.title} className="group flex min-h-64 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl border text-2xl ${accentStyles[report.accent]}`}>
                    {report.icon}
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">PDF / CSV</span>
                </div>
                <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-400">{report.meta}</p>
                <h3 className="mt-1 text-lg font-bold text-slate-900">{report.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-5 text-slate-500">{report.description}</p>
                <button className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-300">
                  Generate report <span aria-hidden="true">→</span>
                </button>
              </article>
            );
          })}
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">Report centre</p>
                <h3 className="mt-1 text-lg font-bold text-slate-900">A clear view of what matters</h3>
              </div>
              <span className="text-2xl" aria-hidden="true">⌁</span>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Available reports</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">04</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Export formats</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">02</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Access level</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">Admin</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-violet-200 bg-violet-600 p-6 text-white shadow-sm">
            <p className="text-sm font-semibold text-violet-100">Quick note</p>
            <h3 className="mt-2 text-xl font-bold">Reports keep decisions grounded.</h3>
            <p className="mt-3 text-sm leading-6 text-violet-100">Choose a report above to create a focused snapshot of your institute’s activity.</p>
            <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-white"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15">✓</span> Ready to generate</div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminReports;