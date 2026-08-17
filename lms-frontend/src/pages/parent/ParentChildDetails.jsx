import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI, attendanceAPI, courseAPI, feeAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ParentChildDetails = () => {
  const { childId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [childData, setChildData] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [courses, setCourses] = useState([]);
  const [fees, setFees] = useState([]);

  useEffect(() => {
    fetchChildData();
  }, [childId]);

  const fetchChildData = async () => {
    setLoading(true);
    try {
      // Get Parent Dashboard data
      const res = await dashboardAPI.getParent(user?.id);
      const children = res.data?.children || [];
      const child = children.find(c => c.id === parseInt(childId));
      
      if (!child) {
        toast.error('Child not found');
        navigate('/dashboard');
        return;
      }

      setChildData(child);

      // Fetch attendance details for this child
      const attendanceRes = await attendanceAPI.getStudentAll(childId);
      setAttendanceData(attendanceRes.data || []);

      // Fetch enrolled courses
      const coursesRes = await courseAPI.getEnrolled(childId);
      setCourses(coursesRes.data || []);

      // Fetch fees
      const feesRes = await feeAPI.getStudentFees(childId);
      setFees(feesRes.data || []);

    } catch (error) {
      console.error('Failed to fetch child details:', error);
      toast.error('Failed to load child details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading child details...</p>
        </div>
      </div>
    );
  }

  if (!childData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">👨‍👩‍👧</div>
          <h3 className="text-lg font-semibold text-gray-700">Child not found</h3>
          <Link to="/dashboard" className="text-violet-600 hover:underline text-sm mt-2 inline-block">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-gray-500 hover:text-gray-700 text-sm">← Dashboard</Link>
          <h1 className="text-xl font-bold text-violet-600">👨‍👩‍👦 {childData.name}</h1>
        </div>
        <span className="text-xs bg-violet-100 text-violet-700 px-3 py-1 rounded-full font-medium">
          Student ID: {childData.id}
        </span>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Attendance</p>
            <p className="text-2xl font-bold text-green-600">{childData.attendance || 0}%</p>
            <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(childData.attendance || 0, 100)}%` }} />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Average Marks</p>
            <p className="text-2xl font-bold text-blue-600">{childData.avgMarks || 0}%</p>
            <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(childData.avgMarks || 0, 100)}%` }} />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Course Progress</p>
            <p className="text-2xl font-bold text-yellow-600">{childData.progress || 0}%</p>
            <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
              <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${Math.min(childData.progress || 0, 100)}%` }} />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Courses Enrolled</p>
            <p className="text-2xl font-bold text-purple-600">{courses.length}</p>
            <p className="text-xs text-gray-400 mt-1">Active courses</p>
          </div>
        </div>

        {/* Courses Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📚 Enrolled Courses</h3>
          {courses.length === 0 ? (
            <p className="text-gray-400 text-sm">No courses enrolled yet.</p>
          ) : (
            <div className="space-y-4">
              {courses.map((course) => (
                <div key={course.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition">
                  <div className="flex flex-wrap justify-between items-center gap-3">
                    <div>
                      <h4 className="font-semibold text-gray-800">{course.name}</h4>
                      <p className="text-xs text-gray-500">Duration: {course.durationWeeks} weeks</p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">Active</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attendance Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📅 Attendance Summary</h3>
          {attendanceData.length === 0 ? (
            <p className="text-gray-400 text-sm">No attendance records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Classes</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Present</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attendanceData.map((record, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 text-gray-700">Course #{record.courseId}</td>
                      <td className="px-4 py-3 text-gray-600">{record.totalClasses || 0}</td>
                      <td className="px-4 py-3 text-gray-600">{record.present || 0}</td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${(record.attendancePercentage || 0) >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                          {record.attendancePercentage || 0}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Fees Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">💰 Fee Details</h3>
          {fees.length === 0 ? (
            <p className="text-gray-400 text-sm">No fee records found.</p>
          ) : (
            <div className="space-y-4">
              {fees.map((fee) => (
                <div key={fee.id} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex flex-wrap justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800">Course #{fee.courseId}</p>
                      <p className="text-sm text-gray-500">Total: LKR {fee.totalAmount}</p>
                      <p className="text-sm text-gray-500">Paid: LKR {fee.paidAmount}</p>
                    </div>
                    <div>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        fee.status === 'PAID' ? 'bg-green-100 text-green-700' :
                        fee.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' :
                        fee.status === 'PENDING' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {fee.status}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        Remaining: LKR {fee.totalAmount - fee.paidAmount}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ParentChildDetails;