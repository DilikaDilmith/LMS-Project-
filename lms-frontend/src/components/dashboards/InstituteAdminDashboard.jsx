import React from 'react';
import { Link } from 'react-router-dom';

const InstituteAdminDashboard = ({ data }) => {
  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-lg font-bold text-gray-800 mb-4">Institute Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-teal-500">
            <p className="text-sm text-gray-500">Students</p>
            <p className="text-3xl font-bold text-teal-600">{data?.totalStudents || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-pink-500">
            <p className="text-sm text-gray-500">Lecturers</p>
            <p className="text-3xl font-bold text-pink-600">{data?.totalLecturers || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
            <p className="text-sm text-gray-500">Courses</p>
            <p className="text-3xl font-bold text-orange-600">{data?.totalCourses || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
            <p className="text-sm text-gray-500">Pending Approvals</p>
            <p className="text-3xl font-bold text-yellow-600">{data?.pendingApprovals || 0}</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold text-gray-800 mb-4">Institute Management</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/admin/students" className="bg-white p-4 rounded-lg shadow hover:shadow-md border border-gray-200 text-center hover:border-teal-300 transition">
            <div className="text-2xl mb-1">👨‍🎓</div>
            <span className="text-sm font-medium">Students</span>
          </Link>
          <Link to="/admin/lecturers" className="bg-white p-4 rounded-lg shadow hover:shadow-md border border-gray-200 text-center hover:border-teal-300 transition">
            <div className="text-2xl mb-1">👨‍🏫</div>
            <span className="text-sm font-medium">Lecturers</span>
          </Link>
          <Link to="/admin/courses" className="bg-white p-4 rounded-lg shadow hover:shadow-md border border-gray-200 text-center hover:border-teal-300 transition">
            <div className="text-2xl mb-1">📚</div>
            <span className="text-sm font-medium">Approve Courses</span>
          </Link>
          <Link to="/admin/reports" className="bg-white p-4 rounded-lg shadow hover:shadow-md border border-gray-200 text-center hover:border-teal-300 transition">
            <div className="text-2xl mb-1">📊</div>
            <span className="text-sm font-medium">Reports</span>
          </Link>
          <Link to="/announcements" className="bg-white p-4 rounded-lg shadow hover:shadow-md border border-gray-200 text-center hover:border-teal-300 transition">
            <div className="text-2xl mb-1">📢</div>
            <span className="text-sm font-medium">Announcements</span>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default InstituteAdminDashboard;