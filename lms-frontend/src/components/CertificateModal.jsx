import React from 'react';

const CertificateModal = ({ isOpen, onClose, course, user }) => {
  if (!isOpen || !course) return null;

  const studentName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || 'Student';
  const completionDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Certificate of Completion</p>
            <h2 className="text-lg font-black text-slate-900">Congratulations!</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close certificate"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        <div className="m-6 rounded-2xl border-4 border-double border-amber-300 bg-gradient-to-br from-amber-50 via-white to-blue-50 px-6 py-12 text-center">
          <div className="text-5xl">🎓</div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.25em] text-slate-500">This certifies that</p>
          <h3 className="mt-3 text-3xl font-black text-slate-900">{studentName}</h3>
          <p className="mt-5 text-sm text-slate-600">has successfully completed</p>
          <h4 className="mt-2 text-xl font-extrabold text-indigo-700">{course.name || course.courseName || course.title || 'Course'}</h4>
          <p className="mt-8 text-xs font-medium text-slate-500">Awarded on {completionDate}</p>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-black text-slate-950 transition hover:bg-amber-500"
          >
            Print Certificate
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertificateModal;
