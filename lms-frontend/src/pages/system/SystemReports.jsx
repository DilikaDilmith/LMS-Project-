import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI } from '../../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const SystemReports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await dashboardAPI.getSystemReports();
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-gray-500 hover:text-gray-700 text-sm">← Dashboard</Link>
          <h1 className="text-xl font-bold text-blue-600">📊 System Reports</h1>
        </div>
        <span className="text-sm text-gray-500">Last updated: {new Date().toLocaleString()}</span>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Institute Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Institutes</p>
            <p className="text-2xl font-bold text-gray-800">{data?.instituteStats?.total || 0}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Active Institutes</p>
            <p className="text-2xl font-bold text-green-600">{data?.instituteStats?.active || 0}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Pending Institutes</p>
            <p className="text-2xl font-bold text-yellow-600">{data?.instituteStats?.pending || 0}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Suspended Institutes</p>
            <p className="text-2xl font-bold text-red-600">{data?.instituteStats?.suspended || 0}</p>
          </div>
        </div>

        {/* User Stats */}
        <h3 className="text-lg font-bold text-gray-800 mb-4">👥 User Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-bold text-gray-800">{data?.userStats?.total || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
            <p className="text-sm text-gray-500">Students</p>
            <p className="text-2xl font-bold text-blue-600">{data?.userStats?.students || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
            <p className="text-sm text-gray-500">Lecturers</p>
            <p className="text-2xl font-bold text-purple-600">{data?.userStats?.lecturers || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
            <p className="text-sm text-gray-500">Parents</p>
            <p className="text-2xl font-bold text-green-600">{data?.userStats?.parents || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
            <p className="text-sm text-gray-500">Admins</p>
            <p className="text-2xl font-bold text-red-600">{data?.userStats?.admins || 0}</p>
          </div>
        </div>

        {/* Course Stats */}
        <h3 className="text-lg font-bold text-gray-800 mb-4">📚 Course Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
            <p className="text-sm text-gray-500">Total Courses</p>
            <p className="text-2xl font-bold text-gray-800">{data?.courseStats?.total || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
            <p className="text-sm text-gray-500">Approved</p>
            <p className="text-2xl font-bold text-green-600">{data?.courseStats?.approved || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{data?.courseStats?.pending || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
            <p className="text-sm text-gray-500">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{data?.courseStats?.rejected || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
            <p className="text-sm text-gray-500">Draft</p>
            <p className="text-2xl font-bold text-gray-600">{data?.courseStats?.draft || 0}</p>
          </div>
        </div>

        {/* Revenue & Top Courses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Revenue */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h4 className="font-bold text-gray-800 mb-4">💰 Revenue Overview</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Revenue</span>
                <span className="font-bold text-gray-800">LKR {data?.revenueStats?.total?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Basic Plan</span>
                <span className="font-medium text-gray-700">LKR {data?.revenueStats?.basic?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Standard Plan</span>
                <span className="font-medium text-gray-700">LKR {data?.revenueStats?.standard?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Premium Plan</span>
                <span className="font-medium text-gray-700">LKR {data?.revenueStats?.premium?.toLocaleString() || 0}</span>
              </div>
              <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden flex">
                <div className="h-full bg-blue-500" style={{ width: `${(data?.revenueStats?.basic / data?.revenueStats?.total) * 100 || 0}%` }}></div>
                <div className="h-full bg-green-500" style={{ width: `${(data?.revenueStats?.standard / data?.revenueStats?.total) * 100 || 0}%` }}></div>
                <div className="h-full bg-purple-500" style={{ width: `${(data?.revenueStats?.premium / data?.revenueStats?.total) * 100 || 0}%` }}></div>
              </div>
            </div>
          </div>

          {/* Top Courses */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h4 className="font-bold text-gray-800 mb-4">🏆 Top Courses</h4>
            {data?.topCourses?.length > 0 ? (
              <div className="space-y-3">
                {data.topCourses.map((course, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-gray-700">{idx + 1}. {course.name}</span>
                    <span className="text-sm font-medium text-blue-600">{course.students} students</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No data available</p>
            )}
          </div>
        </div>

        {/* Recent Registrations */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h4 className="font-bold text-gray-800 mb-2">📈 Recent Registrations (Last 30 Days)</h4>
          <p className="text-3xl font-bold text-blue-600">{data?.recentRegistrations || 0}</p>
          <p className="text-sm text-gray-500">New users joined the platform in the last 30 days.</p>
        </div>
      </div>
    </div>
  );
};

export default SystemReports;