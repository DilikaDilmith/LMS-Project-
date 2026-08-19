import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userAPI, instituteAPI } from '../../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const SystemUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Filters
  const [filterInstitute, setFilterInstitute] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, institutesRes] = await Promise.all([
        userAPI.getAllUsers(),
        instituteAPI.getAll()
      ]);
      setUsers(usersRes.data || []);
      setInstitutes(institutesRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!window.confirm(`Are you sure you want to ${newStatus} this user?`)) return;
    
    setActionLoading(userId);
    try {
      await userAPI.updateStatus(userId, newStatus);
      toast.success(`User ${newStatus} successfully!`);
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data || 'Failed to update status');
    } finally {
      setActionLoading(userId);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE': return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">🟢 Active</span>;
      case 'PENDING': return <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-medium">🟡 Pending</span>;
      case 'SUSPENDED': return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">🔴 Suspended</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  const getRoleName = (role) => {
    return role.replace('ROLE_', '').replace('_', ' ');
  };

  // Filter Logic
  const filteredUsers = users.filter(u => {
    const matchesInstitute = filterInstitute ? u.instituteId?.toString() === filterInstitute : true;
    const matchesRole = filterRole ? u.role === filterRole : true;
    const matchesStatus = filterStatus ? u.status === filterStatus : true;
    const matchesSearch = searchTerm ? 
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.firstName + ' ' + u.lastName).toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return matchesInstitute && matchesRole && matchesStatus && matchesSearch;
  });

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
      <nav className="bg-white shadow-sm border-b p-4 flex flex-wrap justify-between items-center">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-gray-500 hover:text-gray-700 text-sm">← Dashboard</Link>
          <h1 className="text-xl font-bold text-blue-600">👥 All Users</h1>
        </div>
        <span className="text-sm text-gray-500">{filteredUsers.length} users</span>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filterInstitute}
              onChange={(e) => setFilterInstitute(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Institutes</option>
              {institutes.map(inst => (
                <option key={inst.id} value={inst.id}>{inst.name}</option>
              ))}
            </select>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              <option value="ROLE_STUDENT">Student</option>
              <option value="ROLE_LECTURER">Lecturer</option>
              <option value="ROLE_PARENT">Parent</option>
              <option value="ROLE_INSTITUTE_ADMIN">Institute Admin</option>
              <option value="ROLE_SYSTEM_ADMIN">System Admin</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
            <button
              onClick={() => {
                setFilterInstitute('');
                setFilterRole('');
                setFilterStatus('');
                setSearchTerm('');
              }}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Institute</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-400">No users found</td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-gray-500">#{u.id}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{u.firstName} {u.lastName}</td>
                      <td className="px-4 py-3 text-gray-600">{u.username}</td>
                      <td className="px-4 py-3 text-gray-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                          {getRoleName(u.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {institutes.find(i => i.id === u.instituteId)?.name || 'Global'}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(u.status)}</td>
                      <td className="px-4 py-3">
                        {u.role !== 'ROLE_SYSTEM_ADMIN' && (
                          <button
                            onClick={() => handleStatusChange(u.id, u.status)}
                            disabled={actionLoading === u.id}
                            className={`px-3 py-1 rounded-lg text-white text-xs font-medium transition ${
                              actionLoading === u.id ? 'bg-gray-400' :
                              u.status === 'ACTIVE' ? 'bg-red-600 hover:bg-red-700' :
                              'bg-green-600 hover:bg-green-700'
                            }`}
                          >
                            {actionLoading === u.id ? '...' : u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemUsers;