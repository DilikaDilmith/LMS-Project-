import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // 👈 මේක Import කරන්න අමතක කරන්න එපා!
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI } from '../../services/api';

// Import all role dashboards
import StudentDashboard from './StudentDashboard';
import LecturerDashboard from './LecturerDashboard';
import InstituteAdminDashboard from './InstituteAdminDashboard';
import SystemAdminDashboard from './SystemAdminDashboard';
import ParentDashboard from './ParentDashboard';


const Dashboard = () => {
  const { user, logout } = useAuth();
  const role = user?.role || 'ROLE_STUDENT';
  const userId = user?.id;
  const instituteId = user?.instituteId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        let response;
        switch (role) {
          case 'ROLE_STUDENT':
            response = await dashboardAPI.getStudent(userId);
            break;
          case 'ROLE_LECTURER':
            response = await dashboardAPI.getLecturer(userId);
            break;
          case 'ROLE_INSTITUTE_ADMIN': {
            const validInstId = (instituteId && instituteId !== 'undefined') ? instituteId : 1;
            response = await dashboardAPI.getInstitute(validInstId);
            break;
          }

          case 'ROLE_SYSTEM_ADMIN':
            response = await dashboardAPI.getSystemAdmin();
            break;
          case 'ROLE_PARENT':
            response = await dashboardAPI.getParent(userId);
            break;
          default:
            response = { data: {} };
        }
        setData(response.data);
      } catch (err) {
        console.error('Dashboard error:', err);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId, instituteId, role]);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800">Something went wrong</h2>
          <p className="text-gray-500 mt-2">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render correct dashboard based on role
  const renderDashboard = () => {
    switch (role) {
      case 'ROLE_STUDENT':
        return <StudentDashboard data={data} />;
      case 'ROLE_LECTURER':
        return <LecturerDashboard data={data} />;
      case 'ROLE_INSTITUTE_ADMIN':
        return <InstituteAdminDashboard data={data} />;
      case 'ROLE_SYSTEM_ADMIN':
        return <SystemAdminDashboard data={data} />;
      case 'ROLE_PARENT':
        return <ParentDashboard data={data} />;
      default:
        return <StudentDashboard data={data} />;
    }
  };

  const getRoleName = () => role.replace('ROLE_', '').replace('_', ' ');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
                <span className="text-xl">📚</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">LMS Portal</h1>
                <p className="hidden sm:block text-xs text-gray-400">Learning Management System</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-gray-800">{user?.username}</p>
                <p className="text-xs text-gray-400 capitalize">{getRoleName()}</p>
              </div>
              
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                {user?.username?.charAt(0)?.toUpperCase()}
              </div>

              {/* 👇 NEW: Notifications Link (🔔) */}
              <Link
                to="/notifications"
                className="relative p-2 rounded-lg hover:bg-gray-100 transition text-gray-600 hover:text-gray-800"
                title="Notifications"
              >
                <span className="text-xl">🔔</span>
                {/* Unread Badge - Static demo (Optional) */}
                {/* <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span> */}
              </Link>

              <button
                onClick={logout}
                className="ml-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {getRoleName()} Dashboard
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-500">
            Welcome to your personalized dashboard.
          </p>
          <div className="mt-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
              {getRoleName()}
            </span>
          </div>
        </div>

        {renderDashboard()}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 text-center text-xs text-gray-400">
          © 2026 LMS Portal. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;